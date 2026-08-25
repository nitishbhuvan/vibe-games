import type { GameMetadata } from '../types';
import DualPongGame from './index';

export const dualPongMetadata: GameMetadata = {
  id: 'dual-pong',
  title: 'Dual Pong Battle',
  tagline: 'High-speed 2-Player neon table showdown with speed multiplier',
  description:
    'Classic arcade pong upgraded with customizable ball speed difficulty factors (1.0x to 2.25x Nitro Overdrive), paddle curved deflections, speed rallies, and full 1-Player vs AI or 2-Player local battle!',
  instructions: [
    'Choose your Difficulty & Ball Speed Factor (Mild Brew 1.0x, Espresso 1.35x, Dark Roast 1.75x, Nitro Overdrive 2.25x).',
    'Player 1 (Left Paddle): W to move UP, S to move DOWN.',
    'Player 2 / AI (Right Paddle): Arrow UP / Arrow DOWN.',
    'Hitting the ball while moving applies slice spin and curves the trajectory.',
    'First player to reach 7 points wins the championship match!',
  ],
  categories: ['2-player', 'action', 'flash'],
  thumbnail: '🏓',
  accentColor: '#d4a373',
  badge: '👥 2-Player Favorite',
  rating: 4.85,
  author: 'Vibe Arcade',
  controls: [
    { key: 'W / S', action: 'Player 1 Up / Down' },
    { key: '↑ / ↓', action: 'Player 2 Up / Down' },
    { key: 'Space', action: 'Serve / Pause' },
  ],
  type: 'canvas',
  component: DualPongGame,
};
