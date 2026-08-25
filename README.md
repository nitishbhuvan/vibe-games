# ☕ Vibe Games — The Cozy Coffee-Themed Browser Arcade

<div align="center">

[![Vibe Games Hub](https://img.shields.io/badge/☕_Vibe_Games-Espresso_%26_Cream-8c533c?style=for-the-badge)](https://github.com/nitishbhuvan/vibe-games)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-e09f58?style=for-the-badge)](LICENSE)

**Instant browser games, local 2-player duels, puzzle solvers, and live Python scripts.**  
*Zero downloads • Instant vibe • 100% Mobile Touch & Desktop Friendly*

[🎮 Play Live Demo](#) • [🚀 Quick Start](#-quick-start) • [✨ Add Your Game](#-contributing--add-your-game-in-3-steps) • [📖 Contributing Guide](CONTRIBUTING.md)

</div>

---

## 🌟 Why Vibe Games Was Built

Modern web gaming is often cluttered with intrusive ads, heavy downloads, and clunky mobile experiences. **Vibe Games** was created with a simple vision:

> **A cozy, aesthetic, coffee-themed game hub built for pure vibes, instant play, and effortless community contributions.**

### ☕ Core Highlights
* **Espresso & Cream Aesthetic**: Tailored warm coffee color palette with dark/light themes, sleek glassmorphism, and micro-interactions.
* **Smart Vibe Sorting**: Automatically ranks your **#1 Most Recently Played** title followed by your **Most Played** games on your device via zero-backend LocalStorage.
* **100% Mobile & Touch Optimized**: Fluid responsive layouts, bottom quick-navigation bar, and on-screen virtual gamepads / swipe gestures for every game.
* **Local 2-Player Battles**: Split-screen and shared-touch arcade action directly on a single phone, tablet, or keyboard.
* **Plug & Play Extensibility**: Adding a new game takes just **one folder and one line of code** in the registry.

---

## 🕹️ Available Games

| Game | Category | Type | Description |
| :--- | :--- | :--- | :--- |
| **🏎️ Turbo Drift 2D** | Racing, 2-Player | Canvas 2D | Top-down apex racer with handbrake drifts, nitro beans, and split-screen mode. |
| **☕ Coffee 2048** | Puzzle | React / Touch | Merge beans from Green Bean to Nitro Cold Brew with touch swipe gestures. |
| **🐍 Neon Snake IO** | Action, IO | Canvas 2D | High-speed neon snake arena with multi-snake AI, boost pads, and live leaderboards. |
| **🏓 Dual Pong Battle** | 2-Player, Action | Canvas 2D | Curve-spin deflect pong with customizable ball physics and local 2P touch drag. |
| **☕ Vibe Clicker** | Casual, Clicker | React / Touch | Roast beans, buy roastery equipment, and unlock multi-finger combo multipliers. |
| **🦘 Pixel Jump** | Action, Arcade | Canvas 2D | Doodle-jump style vertical platformer with espresso spring boosts. |
| **🐍 Python Maze Runner** | Python, Puzzle | Pyodide (Wasm) | Live in-browser Python IDE generating procedural labyrinths in real-time. |

---

## 🚀 Quick Start

Ensure you have **Node.js 18+** installed on your system.

```bash
# 1. Clone the repository
git clone https://github.com/nitishbhuvan/vibe-games.git

# 2. Enter directory
cd vibe-games

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start playing!

---

## 🤝 Contributing — Add Your Game in 3 Steps!

We designed Vibe Games so that **anyone can contribute their own game in minutes** without having to touch routing, state management, or UI shells.

```
src/games/
└── my-awesome-game/          <-- 1. Create your game folder
    ├── index.tsx             <-- Your React or Canvas component
    └── metadata.ts           <-- Game title, author, controls, tags
```

### Step 1: Create your game folder
Create a folder inside `src/games/` named after your game (e.g. `src/games/my-awesome-game/`).

### Step 2: Add your game files
Create `src/games/my-awesome-game/metadata.ts`:
```typescript
import type { GameMetadata } from '../types';
import MyAwesomeGame from './index';

export const myAwesomeGameMetadata: GameMetadata = {
  id: 'my-awesome-game',
  title: 'My Awesome Game',
  tagline: 'Short catchy tagline',
  description: 'Explain what your game is about and how to play.',
  instructions: [
    'Use Arrow Keys or on-screen buttons to move.',
    'Collect items to score points!',
  ],
  categories: ['action', 'puzzles'], // '2-player' | 'puzzles' | 'racing' | 'action' | 'io' | 'flash' | 'mouse' | 'python'
  thumbnail: '🎮', // Emoji icon or thumbnail
  accentColor: '#e09f58',
  badge: '✨ New Release',
  rating: 5.0,
  author: 'Your GitHub Username',
  controls: [
    { key: 'Arrow Keys / Touch', action: 'Move' },
    { key: 'Space', action: 'Action / Jump' },
  ],
  type: 'canvas', // 'react' | 'canvas' | 'python' | 'iframe'
  component: MyAwesomeGame,
};
```

### Step 3: Register it in `src/games/registry.ts`
Add your game to the master list:
```typescript
import { myAwesomeGameMetadata } from './my-awesome-game/metadata';

export const ALL_GAMES: GameMetadata[] = [
  turboDriftMetadata,
  coffee2048Metadata,
  myAwesomeGameMetadata, // <-- Add here!
  // ...
];
```

🎉 **That's it!** The app automatically generates:
- ✅ A card on the Homepage with search and category filtering
- ✅ A dedicated Game Player route (`/game/my-awesome-game`)
- ✅ Local play statistics, high score tracking, and favorites
- ✅ Mobile touch container & fullscreen/audio controls

👉 **Check out [CONTRIBUTING.md](CONTRIBUTING.md) for boilerplate code, styling tips, and PR guidelines.**

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite 7](https://vitejs.dev/)
* **Styling**: Vanilla Modern CSS Design System (Custom Tokens, Safe-Area insets, Glassmorphism, CSS Grid & Flexbox)
* **Routing**: [React Router 7](https://reactrouter.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **In-Browser Python**: [Pyodide](https://pyodide.org/) WebAssembly

---

## 📱 Mobile-First Design

Vibe Games is built from the ground up to feel like a native mobile web application:
- Safe area notch and bottom home-bar padding (`env(safe-area-inset-*)`).
- `min-height: 100dvh` viewport support.
- Multi-touch canvas drags and virtual gamepad controls with zero input latency.
- Pinned bottom thumb navigation for quick category exploration.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

<div align="center">

Made with ☕ and passion. Pull requests and game submissions are warmly welcome!

</div>
