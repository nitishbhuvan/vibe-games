import type { GameMetadata } from '../types';
import Coffee2048Game from './index';

export const coffee2048Metadata: GameMetadata = {
  id: 'coffee-2048',
  title: 'Espresso 2048',
  tagline: 'Roast, merge, and craft the legendary Nitro Cold Brew',
  description:
    'Slide and merge matching coffee beans from raw green beans through light and medium roasts all the way to ultimate Nitro Cold Brew in this smooth coffee puzzle!',
  instructions: [
    'Use Arrow keys, WASD, or swipe to slide coffee tiles in any direction.',
    'When two identical coffee roasts collide, they merge into the next premium roast tier!',
    'Reach the 2048 Nitro Cold Brew tile to win, or keep pushing for highest score!',
    'Use the Undo button if you make a misstep.',
  ],
  categories: ['puzzles', 'mouse', 'flash'],
  thumbnail: '☕',
  accentColor: '#c87941',
  badge: '🧩 Top Puzzle',
  rating: 4.8,
  author: 'Vibe Roastery',
  controls: [
    { key: '↑ / W', action: 'Slide Up' },
    { key: '↓ / S', action: 'Slide Down' },
    { key: '← / A', action: 'Slide Left' },
    { key: '→ / D', action: 'Slide Right' },
    { key: 'U', action: 'Undo Last Move' },
  ],
  type: 'react',
  component: Coffee2048Game,
};
