import type { GameMetadata } from '../types';
import TurboDriftGame from './index';

export const turboDriftMetadata: GameMetadata = {
  id: 'turbo-drift',
  title: 'Turbo Drift 2D',
  tagline: 'High-octane top-down arcade drift racer',
  description:
    'Hit the apex, lay down tire smoke, and master high-speed cornering! Play solo time-attack or go head-to-head in 2-Player local split racer mode.',
  instructions: [
    'Player 1 (Espresso Car): Use W / A / S / D to Accelerate, Steer, and Brake.',
    'Player 2 (Cream Car): Use Arrow Keys to Steer and Accelerate (in 2-Player mode).',
    'Hold drift into turns to build your turbo meter and boost out of corners!',
    'Collect glowing coffee beans for instantaneous Nitro Boost.',
  ],
  categories: ['racing', '2-player', 'action'],
  thumbnail: '🏎️',
  accentColor: '#e09f58',
  badge: '🔥 Hot Racer',
  rating: 4.9,
  author: 'Vibe Studios',
  controls: [
    { key: 'W / ↑', action: 'Accelerate' },
    { key: 'A / ←', action: 'Steer Left' },
    { key: 'D / →', action: 'Steer Right' },
    { key: 'S / ↓', action: 'Brake / Reverse' },
    { key: 'Space', action: 'Handbrake / Drift' },
  ],
  type: 'canvas',
  component: TurboDriftGame,
};
