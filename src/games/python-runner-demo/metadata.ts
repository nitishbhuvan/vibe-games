import type { GameMetadata } from '../types';
import PythonMazeRunnerGame from './index';

export const pythonMazeMetadata: GameMetadata = {
  id: 'python-maze',
  title: 'Python Maze Lab (Pyodide)',
  tagline: 'Interactive Python-driven procedural maze crawler',
  description:
    'Runs 100% native Python code in the browser via Pyodide! Explore procedural dungeon mazes, collect golden coffee beans, or modify the Python game script in real time.',
  instructions: [
    'Use Arrow Keys or WASD to navigate through the procedural labyrinth.',
    'Collect all 5 Espresso Relics to open the escape portal.',
    'Switch to the "Python Code" tab to view or edit the underlying Python game algorithm live!',
  ],
  categories: ['python', 'puzzles', 'action'],
  thumbnail: '🐍',
  accentColor: '#3498db',
  badge: '⚡ Python Inside',
  rating: 4.92,
  author: 'Vibe Python Lab',
  controls: [
    { key: 'WASD / Arrows', action: 'Move Python Explorer' },
    { key: 'R', action: 'Regenerate Python Maze' },
  ],
  type: 'python',
  component: PythonMazeRunnerGame,
};
