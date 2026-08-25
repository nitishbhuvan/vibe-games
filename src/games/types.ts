import React from 'react';

export type GameCategory =
  | 'all'
  | '2-player'
  | 'puzzles'
  | 'racing'
  | 'action'
  | 'io'
  | 'flash'
  | 'mouse'
  | 'python';

export interface CategoryInfo {
  id: GameCategory;
  name: string;
  icon: string; // Emoji / Icon key
  description: string;
}

export interface GameControlInfo {
  key: string;
  action: string;
}

export interface GameComponentProps {
  onGameOver?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
  isMuted?: boolean;
}

export interface GameMetadata {
  id: string;
  title: string;
  tagline: string;
  description: string;
  instructions: string[];
  categories: GameCategory[];
  thumbnail: string; // Gradient, SVG, or image URL
  accentColor: string;
  badge?: string;
  rating: number;
  author: string;
  controls: GameControlInfo[];
  type: 'react' | 'canvas' | 'python' | 'iframe';
  pythonCode?: string; // Optional raw Python code for python-type games
  component: React.ComponentType<GameComponentProps>;
}

export interface GameSessionStats {
  playCount: number;
  lastPlayed: number | null; // Milliseconds timestamp
  highScore: number;
  isFavorite: boolean;
}

export type AllGameStats = Record<string, GameSessionStats>;
