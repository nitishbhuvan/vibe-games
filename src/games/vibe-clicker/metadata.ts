import type { GameMetadata } from '../types';
import VibeClickerGame from './index';

export const vibeClickerMetadata: GameMetadata = {
  id: 'vibe-clicker',
  title: 'Coffee Bean Clicker',
  tagline: 'Craft your global espresso empire bean by bean',
  description:
    'Tap the giant coffee mug to brew beans, unlock automated grinders, steam wands, cold brew towers, and hire AI baristas to build a trillion-bean empire!',
  instructions: [
    'Click or tap the Giant Coffee Mug to harvest beans.',
    'Build combo streaks by clicking rapidly to multiply your yield!',
    'Purchase automation upgrades like Hand Grinders, Espresso Machines, and Cold Brew Towers in the roastery shop.',
    'Watch your beans per second (BPS) skyrocket!',
  ],
  categories: ['mouse', 'puzzles'],
  thumbnail: '☕',
  accentColor: '#c87941',
  badge: '🎯 Super Addictive',
  rating: 4.95,
  author: 'Vibe Tycoon',
  controls: [
    { key: 'Left Click / Tap', action: 'Brew Coffee Beans' },
    { key: 'Number Keys 1-5', action: 'Quick Buy Upgrades' },
  ],
  type: 'react',
  component: VibeClickerGame,
};
