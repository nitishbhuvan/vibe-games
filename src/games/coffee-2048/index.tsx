import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

type Board = number[][];

const COFFEE_STAGES: { [key: number]: { label: string; bg: string; text: string; icon: string } } = {
  2: { label: 'Green Bean', bg: '#8fae8b', text: '#1e331b', icon: '🌱' },
  4: { label: 'Light Roast', bg: '#e8cb9b', text: '#4a2c11', icon: '✨' },
  8: { label: 'Cinnamon', bg: '#dca474', text: '#ffffff', icon: '🍂' },
  16: { label: 'Medium Roast', bg: '#c8804e', text: '#ffffff', icon: '☕' },
  32: { label: 'City Roast', bg: '#b26132', text: '#ffffff', icon: '🔥' },
  64: { label: 'French Roast', bg: '#8d3b1b', text: '#ffffff', icon: '⚡' },
  128: { label: 'Espresso', bg: '#67270e', text: '#ffffff', icon: '🌟' },
  256: { label: 'Flat White', bg: '#d4a373', text: '#2c1810', icon: '🥛' },
  512: { label: 'Caramel Macchiato', bg: '#e09f58', text: '#140d09', icon: '🍯' },
  1024: { label: 'Cold Brew Nitro', bg: '#432818', text: '#ffc988', icon: '🧊' },
  2048: { label: 'VIBE MASTER ROAST', bg: '#ff9f1c', text: '#ffffff', icon: '👑' },
  4096: { label: 'Cosmic Roast', bg: '#9d4edd', text: '#ffffff', icon: '🌌' },
};

const createEmptyBoard = (): Board => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const addRandomTile = (board: Board): Board => {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return board;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = Math.random() < 0.85 ? 2 : 4;
  return newBoard;
};

const Coffee2048Game: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(createEmptyBoard())));
  const [previousBoard, setPreviousBoard] = useState<Board | null>(null);
  const [score, setScore] = useState<number>(0);
  const [prevScore, setPrevScore] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const hasTriggeredWin = useRef<boolean>(false);

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  const startNewGame = () => {
    const initial = addRandomTile(addRandomTile(createEmptyBoard()));
    setBoard(initial);
    setPreviousBoard(null);
    setScore(0);
    setPrevScore(0);
    setWon(false);
    setGameOver(false);
    hasTriggeredWin.current = false;
    sounds.playClick();
  };

  const undoMove = () => {
    if (!previousBoard) return;
    setBoard(previousBoard);
    setScore(prevScore);
    setPreviousBoard(null);
    setGameOver(false);
    sounds.playPop();
  };

  const moveLeft = (currentBoard: Board): { newBoard: Board; points: number; moved: boolean } => {
    let moved = false;
    let points = 0;
    const newBoard = createEmptyBoard();

    for (let r = 0; r < 4; r++) {
      const row = currentBoard[r].filter((v) => v !== 0);
      const mergedRow: number[] = [];

      for (let i = 0; i < row.length; i++) {
        if (i < row.length - 1 && row[i] === row[i + 1]) {
          const mergedVal = row[i] * 2;
          mergedRow.push(mergedVal);
          points += mergedVal;
          i++; // Skip next element
        } else {
          mergedRow.push(row[i]);
        }
      }

      while (mergedRow.length < 4) {
        mergedRow.push(0);
      }

      for (let c = 0; c < 4; c++) {
        newBoard[r][c] = mergedRow[c];
        if (newBoard[r][c] !== currentBoard[r][c]) {
          moved = true;
        }
      }
    }

    return { newBoard, points, moved };
  };

  const rotateClockwise = (matrix: Board): Board => {
    const res = createEmptyBoard();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        res[c][3 - r] = matrix[r][c];
      }
    }
    return res;
  };

  const move = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;

      let rotated = board;
      const turns = { left: 0, up: 3, right: 2, down: 1 }[dir];

      for (let i = 0; i < turns; i++) {
        rotated = rotateClockwise(rotated);
      }

      const { newBoard, points, moved } = moveLeft(rotated);

      if (moved) {
        let finalBoard = newBoard;
        for (let i = 0; i < (4 - turns) % 4; i++) {
          finalBoard = rotateClockwise(finalBoard);
        }

        const spawnedBoard = addRandomTile(finalBoard);
        setPreviousBoard(board);
        setPrevScore(score);
        setBoard(spawnedBoard);

        const newTotalScore = score + points;
        setScore(newTotalScore);
        onScoreUpdate?.(newTotalScore);

        if (points > 0) {
          sounds.playPop();
        } else {
          sounds.playClick();
        }

        // Check for 2048 win
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (spawnedBoard[r][c] === 2048 && !hasTriggeredWin.current) {
              setWon(true);
              hasTriggeredWin.current = true;
              sounds.playWin();
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
          }
        }

        // Check for Game Over (no moves remaining)
        if (checkGameOver(spawnedBoard)) {
          setGameOver(true);
          sounds.playCrash();
          onGameOver?.(newTotalScore);
        }
      }
    },
    [board, score, gameOver, onGameOver, onScoreUpdate]
  );

  const checkGameOver = (b: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move('down');
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          undoMove();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* Score Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '480px',
          padding: '12px 18px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>BREW SCORE</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
            {score}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={undoMove}
            disabled={!previousBoard}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: previousBoard ? 'var(--accent-tag-bg)' : 'transparent',
              color: previousBoard ? 'var(--accent-tag-text)' : 'var(--text-muted)',
              border: '1px solid var(--border-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: previousBoard ? 'pointer' : 'not-allowed',
            }}
          >
            ↩ Undo
          </button>
          <button
            onClick={startNewGame}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            New Game
          </button>
        </div>
      </div>

      {/* 2048 Grid Board */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          aspectRatio: '1/1',
          background: 'var(--bg-card)',
          border: '2px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '10px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const stage = COFFEE_STAGES[val];
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: stage ? stage.bg : 'var(--bg-subtle)',
                  color: stage ? stage.text : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: val >= 1024 ? '1.1rem' : val >= 128 ? '1.35rem' : '1.7rem',
                  fontFamily: 'var(--font-display)',
                  boxShadow: val > 0 ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  position: 'relative',
                  border: val > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                }}
              >
                {val > 0 && (
                  <>
                    <span style={{ fontSize: '0.9rem', marginBottom: '2px' }}>{stage?.icon}</span>
                    <span>{val}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.85, marginTop: '2px', textAlign: 'center' }}>
                      {stage?.label}
                    </span>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* Win / Overlays */}
        {gameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(20, 13, 9, 0.88)',
              backdropFilter: 'blur(6px)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              color: '#ffffff',
            }}
          >
            <h3 style={{ fontSize: '2rem', color: '#ffc988' }}>☕ Out of Space!</h3>
            <p style={{ color: '#d4beae' }}>Final Score: {score}</p>
            <button
              onClick={startNewGame}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {won && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'var(--accent-primary)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            🎉 Nitro Cold Brew Unlocked!
          </div>
        )}
      </div>

      {/* Touch / Click Direction Arrows for Mobile & Mouse */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: '8px', marginTop: '8px' }}>
        <div />
        <button
          onClick={() => move('up')}
          style={{
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            fontSize: '1.2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => move('left')}
          style={{
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            fontSize: '1.2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ◀
        </button>
        <button
          onClick={() => move('down')}
          style={{
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            fontSize: '1.2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ▼
        </button>
        <button
          onClick={() => move('right')}
          style={{
            height: '56px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            fontSize: '1.2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default Coffee2048Game;
