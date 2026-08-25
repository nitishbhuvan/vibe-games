import type { CategoryInfo, GameCategory } from './types';

export const GAME_CATEGORIES: CategoryInfo[] = [
  {
    id: 'all',
    name: 'All Games',
    icon: '☕',
    description: 'Browse all vibe coded creations',
  },
  {
    id: '2-player',
    name: '2 Player Games',
    icon: '👥',
    description: 'Dual screen and local keyboard multiplayer',
  },
  {
    id: 'racing',
    name: 'Car Racing',
    icon: '🏎️',
    description: 'Drift, time trials, and high-speed tracks',
  },
  {
    id: 'puzzles',
    name: 'Puzzles & Brain',
    icon: '🧩',
    description: 'Strategic, math, and spatial challenges',
  },
  {
    id: 'io',
    name: 'IO & Arena',
    icon: '🌐',
    description: 'Grow big, eat orbs, and dominate the arena',
  },
  {
    id: 'action',
    name: 'Action & Crazy',
    icon: '⚡',
    description: 'Fast reflexes, crazy physics, and chaos',
  },
  {
    id: 'mouse',
    name: 'Mouse & Casual',
    icon: '🎯',
    description: 'Clickers, reaction tests, and relaxing loops',
  },
  {
    id: 'flash',
    name: 'Flash & Retro',
    icon: '🕹️',
    description: 'Nostalgic arcade mechanics and pixel vibes',
  },
  {
    id: 'python',
    name: 'Python Powered',
    icon: '🐍',
    description: 'Live Python scripts running in the browser',
  },
];

export const getCategoryInfo = (id: GameCategory): CategoryInfo => {
  return GAME_CATEGORIES.find((cat) => cat.id === id) || GAME_CATEGORIES[0];
};
