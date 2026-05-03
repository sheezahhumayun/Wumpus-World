# 🧠 Wumpus World AI Agent (React + Logic)

A smart **Wumpus World simulation** where an AI agent uses **logic instead of luck** to survive.

Built with **React**, this project visualizes how **propositional logic and resolution** help an agent make safe decisions.

---

## ⚡ Quick Highlights

- 🤖 Logic-driven agent (no random guessing)
- 💡 Uses **Resolution Refutation**
- 📡 Real-time percept detection (Breeze & Stench)
- 🧭 Intelligent movement strategy
- 🎮 Step mode + Auto simulation
- 📋 Transparent reasoning logs

---

## 🌍 The Environment

The world is a grid containing:
- 🕳 **Pits** → deadly if entered  
- 👹 **Wumpus** → kills the agent  
- 🤖 **Agent** → starts at (0,0)  

---

## 🔍 How the Agent Thinks

### Step 1: Observe
The agent senses:
- Breeze → Pit nearby  
- Stench → Wumpus nearby  

---

### Step 2: Store Knowledge
All observations are saved in a **Knowledge Base**:
- Safe cells
- Visited cells
- Percepts (breeze/stench)

---

### Step 3: Reason (Key Logic)

#### ✔ CNF-Based Rules
- No Breeze ⇒ No Pit nearby  
- No Stench ⇒ No Wumpus nearby  

---

#### ✔ Resolution Refutation
To check safety of a cell:

1. Assume the cell is dangerous  
2. Look for contradiction with known facts  
3. If contradiction exists → cell is **SAFE**

---

## 🔁 Inference Engine

The reasoning loop works like this:


repeat
for each unknown cell
try to prove it safe
until no new information is found


---

## 🎮 Controls

| Action        | Description |
|--------------|------------|
| ▶ New Game   | Generate a new grid |
| 👟 Step Once | Move agent one step |
| ⏩ Auto Run  | Run continuously |
| 🎚 Speed     | Adjust simulation speed |

---

## 📊 UI Features

- Color-coded grid:
  - 🟢 Safe
  - 🔵 Visited
  - 🔴 Dangerous
  - ❓ Unknown
- Live percept indicators
- Step-by-step decision logs

---

## 🛠 Tech Stack

- **React (Hooks)**
- JavaScript (ES6)
- CSS-in-JS styling

---

## 📂 Main Components


/logic
- KnowledgeBase
- Inference Engine
- Resolution Logic

/UI
- Grid Renderer
- Control Panel
- Logs Panel
- Visualization


---

## ▶ Running the Project
npm install
npm start

## 🎓 What You Learn
How AI uses logic instead of probability
Practical use of Resolution in reasoning
Building interactive simulations with React
Designing explainable AI systems
## 💡 Example Insight

If a visited cell has no breeze, then:
→ All its neighbors cannot have pits

If assuming danger leads to contradiction:
→ That cell is proven safe

## 🏁 Final Thoughts

This project is a clear demonstration of Symbolic AI in action.
Instead of guessing, the agent proves safety logically, making decisions that are explainable and reliable.
