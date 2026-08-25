import type { GameMetadata } from './types';
import { turboDriftMetadata } from './turbo-drift/metadata';
import { coffee2048Metadata } from './coffee-2048/metadata';
import { neonSnakeMetadata } from './neon-snake-io/metadata';
import { dualPongMetadata } from './dual-pong/metadata';
import { vibeClickerMetadata } from './vibe-clicker/metadata';
import { retroJumpMetadata } from './retro-jump/metadata';
import { pythonMazeMetadata } from './python-runner-demo/metadata';

// Master list of all available games on Vibe Games
export const ALL_GAMES: GameMetadata[] = [
  turboDriftMetadata,
  coffee2048Metadata,
  neonSnakeMetadata,
  dualPongMetadata,
  vibeClickerMetadata,
  retroJumpMetadata,
  pythonMazeMetadata,
];

export const getGameById = (id: string): GameMetadata | undefined => {
  return ALL_GAMES.find((g) => g.id.toLowerCase() === id.toLowerCase());
};
