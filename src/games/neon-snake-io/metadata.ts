import type { GameMetadata } from '../types';
import NeonSnakeGame from './index';

export const neonSnakeMetadata: GameMetadata = {
  id: 'neon-snake-io',
  title: 'Neon Snake IO',
  tagline: '360° glowing arena slither showdown',
  description:
    'Slither through the vibrant neon arena, consume energy orbs and coffee crystals to grow your snake, outmaneuver AI bots, and reach the top of the leaderboard!',
  instructions: [
    'Move your Mouse or use Arrow keys to steer your snake 360° freely.',
    'Hold Left Mouse Button, Space, or Shift to activate Turbo Speed boost.',
    'Eat glowing coffee beans and plasma dots to grow longer.',
    'Cut off enemy snakes and avoid colliding with other snakes or arena walls.',
  ],
  categories: ['io', 'action', 'mouse'],
  thumbnail: '🐍',
  accentColor: '#e09f58',
  badge: '👑 IO Arena',
  rating: 4.9,
  author: 'Vibe IO Studio',
  controls: [
    { key: 'Mouse', action: 'Direct Snake 360°' },
    { key: 'Click / Space / Shift', action: 'Speed Boost' },
    { key: 'Arrow Keys', action: 'Steer (Alternative)' },
  ],
  type: 'canvas',
  component: NeonSnakeGame,
};
