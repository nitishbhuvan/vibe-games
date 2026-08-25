# ☕ Contributing to Vibe Games

Welcome to the **Vibe Games** contributor guide! We are thrilled you want to bring your own browser games, mini-projects, or arcade classics to the hub.

---

## 🎯 The Vibe Games Architecture

Vibe Games is built with a **modular plugin architecture**. Every game lives in its own isolated directory inside `src/games/`.

When you add a game, the framework automatically handles:
1. 🏠 **Homepage Catalog & Search**: Categorization, badge ribbons, and search indexing.
2. 📊 **Session Statistics**: Play counts, last played timestamps, and high scores.
3. 🎮 **Game Player Stage**: Dynamic fullscreen wrapper, audio mute toggle, restart remounting, and shareable URLs.
4. 📱 **Mobile Adaptability**: Touch-safe containers, safe-area offsets, and responsive scaling.

---

## 🚀 Quick Step-by-Step Guide

### Step 1: Create your Game Folder

Create a new directory inside `src/games/` using `kebab-case`:

```bash
mkdir src/games/my-cool-game
```

Inside your folder, you will typically have:
```
src/games/my-cool-game/
├── index.tsx          # The React component containing your game
├── metadata.ts        # Metadata configuration and registration
└── styles.module.css  # Optional CSS file or inline styles
```

---

### Step 2: Write your Game Component (`index.tsx`)

Your game component receives `GameComponentProps` to communicate with the Vibe Games hub:

```tsx
import React, { useState, useEffect } from 'react';
import type { GameComponentProps } from '../types';

export const MyCoolGame: React.FC<GameComponentProps> = ({
  onScoreUpdate,
  onGameOver,
  isMuted,
}) => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Notify parent of score changes
  const addScore = (points: number) => {
    const newScore = score + points;
    setScore(newScore);
    onScoreUpdate?.(newScore);
  };

  // Notify parent on game over
  const handleEndGame = () => {
    setGameOver(true);
    onGameOver?.(score);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
      <div style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 800 }}>
        Score: {score}
      </div>

      {/* Your game canvas or interactive elements */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '16/9',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '2px solid var(--border-highlight)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => addScore(10)}
          className="virtual-btn"
          style={{ padding: '12px 24px', fontSize: '1.1rem' }}
        >
          Tap to Score! 🎯
        </button>
      </div>
    </div>
  );
};

export default MyCoolGame;
```

---

### Step 3: Define your Metadata (`metadata.ts`)

Create `src/games/my-cool-game/metadata.ts`:

```typescript
import type { GameMetadata } from '../types';
import MyCoolGame from './index';

export const myCoolGameMetadata: GameMetadata = {
  id: 'my-cool-game',                           // Unique URL slug (e.g. /game/my-cool-game)
  title: 'My Cool Game',                        // Display Title
  tagline: 'Exciting quick arcade fun',         // Short 1-sentence tagline
  description:                                  // Full description
    'Detailed description of the gameplay mechanics, scoring, and goals.',
  instructions: [                               // Bulleted how-to-play points
    'Use on-screen buttons or arrow keys to move.',
    'Collect coffee power-ups to increase score.',
    'Avoid obstacles to stay in the game!',
  ],
  categories: ['action', 'mouse'],              // Choose from: '2-player' | 'puzzles' | 'racing' | 'action' | 'io' | 'flash' | 'mouse' | 'python'
  thumbnail: '🚀',                              // Emoji or SVG icon
  accentColor: '#e09f58',                       // Hex accent color
  badge: '✨ New',                              // Optional ribbon badge
  rating: 5.0,                                  // Rating (out of 5.0)
  author: 'YourGitHubUsername',                 // Author name or GitHub handle
  controls: [                                   // Keybindings & action descriptions
    { key: 'W / ↑', action: 'Move Up' },
    { key: 'Space', action: 'Jump / Action' },
  ],
  type: 'react',                                // 'react' | 'canvas' | 'python' | 'iframe'
  component: MyCoolGame,                        // Component reference
};
```

---

### Step 4: Add to the Master Registry (`src/games/registry.ts`)

Open `src/games/registry.ts` and import your metadata:

```typescript
import type { GameMetadata } from './types';
import { turboDriftMetadata } from './turbo-drift/metadata';
import { coffee2048Metadata } from './coffee-2048/metadata';
// ... other games
import { myCoolGameMetadata } from './my-cool-game/metadata'; // <-- 1. Import

export const ALL_GAMES: GameMetadata[] = [
  turboDriftMetadata,
  coffee2048Metadata,
  // ... other games
  myCoolGameMetadata,                                          // <-- 2. Add to list
];
```

---

## 📱 Mobile Touch & Responsiveness Best Practices

To ensure your game is delightful on smartphones and tablets:

1. **Normalized Canvas Coordinates**:
   If using HTML5 `<canvas>`, always convert touch coordinates relative to bounding rect:
   ```typescript
   const rect = canvas.getBoundingClientRect();
   const touchX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
   const touchY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
   ```
2. **Prevent Page Scroll Hijacking**:
   Add `touch-action: none;` or `touchAction: 'none'` to your interactive canvas or swipe container.
3. **Touch Targets**:
   Use `.virtual-btn` class or ensure touch buttons have a minimum size of `44px x 44px`.
4. **Fluid Dimensions**:
   Avoid fixed pixel widths. Use `width: '100%', maxWidth: 'Xpx', height: 'auto', aspectRatio: 'W/H'`.

---

## 🎨 Design & Aesthetic Guidelines

* **Coffee & Cream Color Tokens**:
  * Primary Accent: `var(--accent-primary)` (`#c87941` / `#e09f58`)
  * Card Background: `var(--bg-card)`
  * Subtle Background: `var(--bg-subtle)`
  * Text Colors: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
* **Zero Intrusive Popups**: No external tracking, ads, or login walls.

---

## 📋 Pull Request Checklist

Before submitting your PR, please verify:
- [ ] `npm run build` succeeds with zero TypeScript errors.
- [ ] The game works seamlessly on both desktop (keyboard/mouse) and mobile viewports (touch).
- [ ] `metadata.ts` contains clear instructions and accurate author credits.
- [ ] No large external binary assets (keep games lightweight).

---

<div align="center">

Thank you for building with the Vibe Games community! ☕🎮

</div>
