import { useState, useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// 📚 BEGINNER'S GUIDE TO THIS CODE
// ══════════════════════════════════════════════════════════════
//
// This is a Wumpus World agent that uses Logic to stay safe.
//
// THE WORLD:
//   - A grid of cells (like a map)
//   - Hidden PITS 🕳  — fall in = dead
//   - A hidden WUMPUS 👹 — walk into it = dead
//   - Agent 🤖 starts at top-left (row 0, col 0)
//
// HOW THE AGENT THINKS:
//   1. It visits a cell and feels PERCEPTS (clues):
//      - BREEZE 💨 means a pit is next to this cell
//      - STENCH 💀 means the Wumpus is next to this cell
//   2. It stores these clues in a Knowledge Base (KB)
//   3. Before moving, it ASKS the KB: "Is that cell safe?"
//   4. If the logic proves it safe → move there!
//
// RESOLUTION REFUTATION (the logic engine):
//   - To prove cell X is safe, we ASSUME it's dangerous
//   - We add that assumption to the KB
//   - If the KB becomes CONTRADICTORY → our assumption was wrong
//   - So X MUST be safe! ✓
//
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────
// STEP 1: HELPER — Get neighboring cells
// ─────────────────────────────────────
function getNeighbors(row, col, rows, cols) {
  const neighbors = [];
  if (row > 0)       neighbors.push({ r: row - 1, c: col });
  if (row < rows-1)  neighbors.push({ r: row + 1, c: col });
  if (col > 0)       neighbors.push({ r: row, c: col - 1 });
  if (col < cols-1)  neighbors.push({ r: row, c: col + 1 });
  return neighbors;
}

// ─────────────────────────────────────
// STEP 2: WORLD GENERATOR
// ─────────────────────────────────────
function generateWorld(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      grid[r].push({ hasPit: false, hasWumpus: false });
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 && c === 0) continue;
      if (Math.random() < 0.2) {
        grid[r][c].hasPit = true;
      }
    }
  }

  let placed = false;
  while (!placed) {
    const wr = Math.floor(Math.random() * rows);
    const wc = Math.floor(Math.random() * cols);
    if ((wr === 0 && wc === 0) || grid[wr][wc].hasPit) continue;
    grid[wr][wc].hasWumpus = true;
    placed = true;
  }

  return grid;
}

// ─────────────────────────────────────
// STEP 3: PERCEPT DETECTOR
// ─────────────────────────────────────
function getPercepts(grid, row, col, rows, cols) {
  let breeze = false;
  let stench = false;

  for (const n of getNeighbors(row, col, rows, cols)) {
    if (grid[n.r][n.c].hasPit)    breeze = true;
    if (grid[n.r][n.c].hasWumpus) stench = true;
  }

  return { breeze, stench };
}

// ─────────────────────────────────────
// STEP 4: KNOWLEDGE BASE (KB)
// ─────────────────────────────────────
class KnowledgeBase {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.knownSafe    = new Set();
    this.knownPit     = new Set();
    this.knownWumpus  = new Set();
    this.breezeAt     = new Set();
    this.stenchAt     = new Set();
    this.visited      = new Set();
    this.inferenceLog = [];
    this.totalSteps   = 0;
  }

  key(r, c) { return `${r},${c}`; }

  tellVisit(row, col, breeze, stench) {
    const k = this.key(row, col);
    this.visited.add(k);
    this.knownSafe.add(k);

    if (breeze) {
      this.breezeAt.add(k);
      this.inferenceLog.push(`📍 (${row},${col}): BREEZE felt → a pit is nearby`);
    } else {
      for (const n of getNeighbors(row, col, this.rows, this.cols)) {
        this.knownSafe.add(this.key(n.r, n.c));
        this.inferenceLog.push(`✅ (${n.r},${n.c}): No breeze at (${row},${col}) → NOT a pit`);
      }
    }

    if (stench) {
      this.stenchAt.add(k);
      this.inferenceLog.push(`📍 (${row},${col}): STENCH felt → Wumpus is nearby`);
    } else {
      for (const n of getNeighbors(row, col, this.rows, this.cols)) {
        this.knownSafe.add(this.key(n.r, n.c));
        this.inferenceLog.push(`✅ (${n.r},${n.c}): No stench at (${row},${col}) → NOT Wumpus`);
      }
    }
  }

  askIsSafe(row, col) {
    this.totalSteps++;
    const k = this.key(row, col);

    if (this.knownSafe.has(k)) {
      this.inferenceLog.push(`🔍 Ask (${row},${col}): Already in safe set → SAFE ✓`);
      return true;
    }

    if (this.knownPit.has(k) || this.knownWumpus.has(k)) {
      this.inferenceLog.push(`🔍 Ask (${row},${col}): Known dangerous → NOT SAFE ✗`);
      return false;
    }

    // Resolution Refutation for pit
    let pitContradiction = false;
    for (const n of getNeighbors(row, col, this.rows, this.cols)) {
      const nk = this.key(n.r, n.c);
      if (this.visited.has(nk) && !this.breezeAt.has(nk)) {
        pitContradiction = true;
        this.totalSteps++;
        this.inferenceLog.push(`🔍 Resolution: Assume Pit(${row},${col}) → (${n.r},${n.c}) must have BREEZE → but it doesn't → CONTRADICTION → ¬Pit proven!`);
        break;
      }
    }

    // Resolution Refutation for wumpus
    let wumpusContradiction = false;
    for (const n of getNeighbors(row, col, this.rows, this.cols)) {
      const nk = this.key(n.r, n.c);
      if (this.visited.has(nk) && !this.stenchAt.has(nk)) {
        wumpusContradiction = true;
        this.totalSteps++;
        this.inferenceLog.push(`🔍 Resolution: Assume Wumpus(${row},${col}) → (${n.r},${n.c}) must have STENCH → but it doesn't → CONTRADICTION → ¬Wumpus proven!`);
        break;
      }
    }

    if (pitContradiction && wumpusContradiction) {
      this.knownSafe.add(k);
      this.inferenceLog.push(`✅ (${row},${col}): Both contradictions found → PROVEN SAFE!`);
      return true;
    }

    this.inferenceLog.push(`❓ (${row},${col}): Cannot prove safe yet`);
    return false;
  }

  runInference() {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const k = this.key(r, c);
          if (!this.visited.has(k) && !this.knownSafe.has(k) && !this.knownPit.has(k)) {
            const wasSafe = this.knownSafe.has(k);
            this.askIsSafe(r, c);
            if (!wasSafe && this.knownSafe.has(k)) changed = true;
          }
        }
      }
    }
  }

  findNextMove(agentRow, agentCol) {
    const neighbors = getNeighbors(agentRow, agentCol, this.rows, this.cols);

    for (const n of neighbors) {
      const k = this.key(n.r, n.c);
      if (!this.visited.has(k) && this.knownSafe.has(k)) {
        return { ...n, reason: "Proven safe by KB ✓" };
      }
    }

    for (const n of neighbors) {
      const k = this.key(n.r, n.c);
      if (!this.visited.has(k) && !this.knownPit.has(k) && !this.knownWumpus.has(k)) {
        return { ...n, reason: "Unknown — taking a careful risk ⚠" };
      }
    }

    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// REACT UI COMPONENT
// ══════════════════════════════════════════════════════════════

const COLORS = {
  bg:       "#f0f4f8",
  panel:    "#ffffff",
  border:   "#dde3ec",
  text:     "#2d3748",
  muted:    "#718096",
  safe:     "#c6f6d5",
  safeBdr:  "#38a169",
  visited:  "#bee3f8",
  visitBdr: "#3182ce",
  unknown:  "#e2e8f0",
  unknBdr:  "#a0aec0",
  danger:   "#fed7d7",
  dangBdr:  "#e53e3e",
  agent:    "#faf089",
  agentBdr: "#d69e2e",
  pit:      "#fc8181",
  wumpus:   "#f6ad55",
};

export default function WumpusWorld() {
  const [rows, setRows]           = useState(4);
  const [cols, setCols]           = useState(4);
  const [phase, setPhase]         = useState("setup");
  const [grid, setGrid]           = useState(null);
  const [kb, setKb]               = useState(null);
  const [agentPos, setAgentPos]   = useState({ r: 0, c: 0 });
  const [percepts, setPercepts]   = useState({ breeze: false, stench: false });
  const [log, setLog]             = useState([]);
  const [steps, setSteps]         = useState(0);
  const [autoRunning, setAutoRunning] = useState(false);
  const [speed, setSpeed]         = useState(900);
  const [showHidden, setShowHidden] = useState(false);
  const intervalRef = useRef(null);
  const stateRef    = useRef({});

  useEffect(() => {
    stateRef.current = { grid, kb, agentPos, phase };
  });

  function startGame() {
    const newGrid = generateWorld(rows, cols);
    const newKB   = new KnowledgeBase(rows, cols);

    const startPercepts = getPercepts(newGrid, 0, 0, rows, cols);
    newKB.tellVisit(0, 0, startPercepts.breeze, startPercepts.stench);
    newKB.runInference();

    setGrid(newGrid);
    setKb(newKB);
    setAgentPos({ r: 0, c: 0 });
    setPercepts(startPercepts);
    setLog([`🚀 Game started! Agent at (0,0). ${startPercepts.breeze ? "💨 Breeze! " : ""}${startPercepts.stench ? "💀 Stench! " : ""}${!startPercepts.breeze && !startPercepts.stench ? "All clear!" : ""}`]);
    setSteps(0);
    setPhase("playing");
    setAutoRunning(false);
    setShowHidden(false);
  }

  function step() {
    const { grid, kb, agentPos, phase } = stateRef.current;
    if (phase !== "playing" || !kb || !grid) return;

    const move = kb.findNextMove(agentPos.r, agentPos.c);

    if (!move) {
      setLog(prev => [...prev, "🏁 No more moves — exploration complete!"]);
      setPhase("won");
      setAutoRunning(false);
      setShowHidden(true);
      return;
    }

    const newLogs = [`➡ Moving to (${move.r},${move.c}): ${move.reason}`];

    if (grid[move.r][move.c].hasPit) {
      newLogs.push(`💀 FELL INTO A PIT at (${move.r},${move.c})! Game over.`);
      setLog(prev => [...prev, ...newLogs]);
      setAgentPos({ r: move.r, c: move.c });
      setPhase("dead");
      setAutoRunning(false);
      setShowHidden(true);
      return;
    }
    if (grid[move.r][move.c].hasWumpus) {
      newLogs.push(`💀 EATEN BY WUMPUS at (${move.r},${move.c})! Game over.`);
      setLog(prev => [...prev, ...newLogs]);
      setAgentPos({ r: move.r, c: move.c });
      setPhase("dead");
      setAutoRunning(false);
      setShowHidden(true);
      return;
    }

    const newPercepts = getPercepts(grid, move.r, move.c, rows, cols);
    kb.tellVisit(move.r, move.c, newPercepts.breeze, newPercepts.stench);
    kb.runInference();

    if (newPercepts.breeze) newLogs.push(`💨 Breeze felt — a pit is adjacent!`);
    if (newPercepts.stench) newLogs.push(`👃 Stench felt — Wumpus is nearby!`);
    if (!newPercepts.breeze && !newPercepts.stench) newLogs.push(`✨ No percepts — area is clear.`);

    setAgentPos({ r: move.r, c: move.c });
    setPercepts(newPercepts);
    setSteps(kb.totalSteps);
    setLog(prev => [...prev, ...newLogs]);

    if (kb.visited.size >= rows * cols * 0.65) {
      setLog(prev => [...prev, "🏆 Great exploration! Mission complete."]);
      setPhase("won");
      setAutoRunning(false);
      setShowHidden(true);
    }
  }

  useEffect(() => {
    if (autoRunning) {
      intervalRef.current = setInterval(step, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRunning, speed]);

  function getCellStyle(r, c) {
    if (!kb) return { bg: COLORS.unknown, border: COLORS.unknBdr, icon: "" };
    const k = kb.key(r, c);
    const isAgent = agentPos.r === r && agentPos.c === c && phase !== "setup";

    if (showHidden && grid) {
      if (grid[r][c].hasPit)    return { bg: COLORS.pit,    border: "#c53030", icon: "🕳" };
      if (grid[r][c].hasWumpus) return { bg: COLORS.wumpus, border: "#c05621", icon: "👹" };
    }
    if (isAgent)                return { bg: COLORS.agent,   border: COLORS.agentBdr, icon: "🤖" };
    if (kb.visited.has(k))      return { bg: COLORS.visited, border: COLORS.visitBdr, icon: "" };
    if (kb.knownSafe.has(k))    return { bg: COLORS.safe,    border: COLORS.safeBdr,  icon: "✓" };
    if (kb.knownPit.has(k))     return { bg: COLORS.danger,  border: COLORS.dangBdr,  icon: "🕳" };
    if (kb.knownWumpus.has(k))  return { bg: COLORS.danger,  border: COLORS.dangBdr,  icon: "👹" };
    return { bg: COLORS.unknown, border: COLORS.unknBdr, icon: "?" };
  }

  const cellSize = Math.min(Math.floor(320 / Math.max(rows, cols)), 80);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: 24, fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: COLORS.text, margin: 0 }}>🤖 Wumpus World</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, marginTop: 4 }}>
          A Knowledge-Based Agent using Propositional Logic & Resolution Refutation
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>

        {/* LEFT PANEL */}
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 14 }}>

          <Box title="⚙️ Setup">
            <label style={labelStyle}>Grid Rows (3–7)</label>
            <input type="number" min={3} max={7} value={rows}
              onChange={e => setRows(+e.target.value)}
              style={inputStyle} />
            <label style={labelStyle}>Grid Cols (3–7)</label>
            <input type="number" min={3} max={7} value={cols}
              onChange={e => setCols(+e.target.value)}
              style={inputStyle} />
            <button onClick={startGame} style={{ ...btnStyle, background: "#2b6cb0", color: "white", marginTop: 6 }}>
              ▶ New Game
            </button>
          </Box>

          {phase === "playing" && (
            <Box title="🕹 Controls">
              <button onClick={step} disabled={autoRunning}
                style={{ ...btnStyle, background: "#276749", color: "white", opacity: autoRunning ? 0.4 : 1 }}>
                👟 Step Once
              </button>
              <button onClick={() => setAutoRunning(v => !v)}
                style={{ ...btnStyle, background: autoRunning ? "#742a2a" : "#744210", color: "white", marginTop: 6 }}>
                {autoRunning ? "⏸ Pause" : "⏩ Auto Run"}
              </button>
              <label style={{ ...labelStyle, marginTop: 8 }}>Speed: {speed}ms</label>
              <input type="range" min={200} max={2000} step={100} value={speed}
                onChange={e => setSpeed(+e.target.value)}
                style={{ width: "100%", accentColor: "#2b6cb0" }} />
            </Box>
          )}

          {phase !== "setup" && (
            <Box title="📡 Percepts Now">
              <PerceptBadge on={percepts.breeze} emoji="💨" label="Breeze (pit nearby)" />
              <PerceptBadge on={percepts.stench} emoji="💀" label="Stench (Wumpus near)" />
              {!percepts.breeze && !percepts.stench && (
                <div style={{ color: "#276749", fontSize: 13 }}>✨ All clear here!</div>
              )}
              <div style={{ marginTop: 8, fontSize: 12, color: COLORS.muted }}>
                Agent at ({agentPos.r}, {agentPos.c})
              </div>
            </Box>
          )}

          <Box title="🗺 Legend">
            {[
              { color: COLORS.agent,   border: COLORS.agentBdr, label: "🤖 Agent (you)" },
              { color: COLORS.visited, border: COLORS.visitBdr, label: "🔵 Visited cell" },
              { color: COLORS.safe,    border: COLORS.safeBdr,  label: "✅ KB-proven safe" },
              { color: COLORS.unknown, border: COLORS.unknBdr,  label: "❓ Unknown" },
              { color: COLORS.danger,  border: COLORS.dangBdr,  label: "🔴 Dangerous!" },
            ].map(({ color, border, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 16, height: 16, background: color, border: `2px solid ${border}`, borderRadius: 3 }} />
                <span style={{ fontSize: 12, color: COLORS.text }}>{label}</span>
              </div>
            ))}
          </Box>
        </div>

        {/* CENTER: Grid */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

          {phase === "dead" && (
            <div style={{ background: "#fed7d7", border: "2px solid #e53e3e", borderRadius: 8, padding: "10px 20px", color: "#742a2a", fontWeight: "bold", fontSize: 16 }}>
              💀 Agent died! Better luck next time.
            </div>
          )}
          {phase === "won" && (
            <div style={{ background: "#c6f6d5", border: "2px solid #38a169", borderRadius: 8, padding: "10px 20px", color: "#276749", fontWeight: "bold", fontSize: 16 }}>
              🏆 Mission complete! Agent survived!
            </div>
          )}
          {phase === "setup" && (
            <div style={{ color: COLORS.muted, fontSize: 14, textAlign: "center" }}>
              Set grid size and click ▶ New Game
            </div>
          )}

          {phase !== "setup" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gap: 4,
              padding: 12,
              background: "white",
              borderRadius: 12,
              border: `2px solid ${COLORS.border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}>
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const { bg, border, icon } = getCellStyle(r, c);
                  const isAgent = agentPos.r === r && agentPos.c === c;
                  const k = kb ? kb.key(r, c) : null;
                  const hasBreeze = kb && kb.breezeAt.has(k);
                  const hasStench = kb && kb.stenchAt.has(k);

                  return (
                    <div key={`${r}-${c}`} style={{
                      width: cellSize, height: cellSize,
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: 8,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      position: "relative",
                      fontSize: cellSize > 60 ? 22 : 16,
                      transition: "all 0.25s",
                      boxShadow: isAgent ? "0 0 10px rgba(214,158,46,0.5)" : "none",
                    }}>
                      <span>{icon || (isAgent ? "🤖" : "")}</span>
                      {kb && kb.visited.has(k) && (
                        <div style={{ position: "absolute", top: 2, left: 2, display: "flex", gap: 1 }}>
                          {hasBreeze && <span style={{ fontSize: 9 }}>💨</span>}
                          {hasStench && <span style={{ fontSize: 9 }}>💀</span>}
                        </div>
                      )}
                      <span style={{ position: "absolute", bottom: 1, right: 3, fontSize: 8, color: "#a0aec0" }}>
                        {r},{c}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {phase !== "setup" && (
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Inference Steps", value: steps },
                { label: "Cells Visited",   value: kb ? kb.visited.size : 0 },
                { label: "Safe Proven",      value: kb ? kb.knownSafe.size : 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: "white", border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: "8px 14px", textAlign: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#2b6cb0" }}>{value}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        {phase !== "setup" && (
          <div style={{ width: 240 }}>
            <Box title="📋 Agent Log">
              <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {[...log].reverse().map((entry, i) => (
                  <div key={i} style={{
                    fontSize: 12,
                    color: entry.includes("💀") ? "#742a2a"
                         : entry.includes("✅") ? "#276749"
                         : entry.includes("➡") ? "#2b6cb0"
                         : COLORS.text,
                    padding: "4px 6px",
                    background: i === 0 ? "#f7fafc" : "transparent",
                    borderRadius: 4,
                    borderLeft: `3px solid ${
                      entry.includes("💀") ? "#e53e3e"
                    : entry.includes("✅") ? "#38a169"
                    : entry.includes("➡") ? "#3182ce"
                    : "#e2e8f0"}`,
                    lineHeight: 1.4,
                  }}>
                    {entry}
                  </div>
                ))}
              </div>
            </Box>

            <Box title="💡 How Logic Works">
              <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
                <b style={{ color: COLORS.text }}>Resolution Refutation:</b><br />
                To prove cell X is safe:<br />
                1. <em>Assume</em> X is dangerous<br />
                2. Check if that contradicts what we know<br />
                3. If YES → X must be SAFE! ✓<br /><br />
                <b style={{ color: COLORS.text }}>Example:</b><br />
                If (0,1) has no breeze, then (0,0) and (1,1) cannot have pits — because a pit would cause breeze. Contradiction! → Safe ✓
              </div>
            </Box>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable components ──

function Box({ title, children }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #dde3ec",
      borderRadius: 10,
      padding: 14,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 13, fontWeight: "bold", color: "#2d3748", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function PerceptBadge({ on, emoji, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 8px", borderRadius: 6, marginBottom: 4,
      background: on ? "#fefcbf" : "#f7fafc",
      border: `1px solid ${on ? "#d69e2e" : "#e2e8f0"}`,
      fontSize: 12,
      color: on ? "#744210" : "#a0aec0",
    }}>
      <span>{emoji}</span>
      <span>{label}</span>
      <span style={{ marginLeft: "auto", fontWeight: "bold" }}>{on ? "YES" : "no"}</span>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "#718096", display: "block", marginBottom: 2 };
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #dde3ec", borderRadius: 5,
  padding: "5px 8px", fontSize: 13,
  marginBottom: 6, fontFamily: "Georgia, serif",
};
const btnStyle = {
  width: "100%", padding: "9px 0",
  border: "none", borderRadius: 6,
  fontSize: 13, cursor: "pointer",
  fontFamily: "Georgia, serif",
};