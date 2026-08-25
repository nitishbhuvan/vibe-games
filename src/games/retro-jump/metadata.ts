import type { GameMetadata } from '../types';
import RetroJumpGame from './index';

export const retroJumpMetadata: GameMetadata = {
  id: 'retro-jump',
  title: 'Pixel Coffee Jump',
  tagline: 'Bounce to infinite caffeine heights',
  description:
    'Leap from platform to platform, ride spring boosters, collect espresso cups for double bounces, and reach the stratosphere in this nostalgic arcade jumper!',
  instructions: [
    'Use Left / Right Arrow keys or A / D to steer your jumper in mid-air.',
    'Screen wraps around: jumping off the left side reappears on the right.',
    'Land on green platforms to bounce upward.',
    'Land on golden coffee springs for super jumps!',
  ],
  categories: ['flash', 'action', 'mouse'],
  thumbnail: '🦘',
  accentColor: '#e09f58',
  badge: '🕹️ Flash Classic',
  rating: 4.88,
  author: 'Vibe Pixel Lab',
  controls: [
    { key: '← / A', action: 'Move Left' },
    { key: '→ / D', action: 'Move Right' },
  ],
  type: 'canvas',
  component: RetroJumpGame,
};
