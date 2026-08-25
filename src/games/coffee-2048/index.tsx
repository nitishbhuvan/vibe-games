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

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const start = touchStartRef.current;
    const end = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
    touchStartRef.current = null;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);

    // Minimum swipe threshold
    if (dist >= 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) move('right');
        else move('left');
      } else {
        if (dy > 0) move('down');
        else move('up');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '14px' }}>
      {/* Score Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: 'min(94vw, 440px)',
          padding: '10px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>BREW SCORE</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
            {score}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={undoMove}
            disabled={!previousBoard}
            aria-label="Undo move"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: previousBoard ? 'var(--accent-tag-bg)' : 'transparent',
              color: previousBoard ? 'var(--accent-tag-text)' : 'var(--text-muted)',
              border: '1px solid var(--border-main)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: previousBoard ? 'pointer' : 'not-allowed',
            }}
          >
            ↩ Undo
          </button>
          <button
            onClick={startNewGame}
            aria-label="New game"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            New Game
          </button>
        </div>
      </div>

      {/* 2048 Grid Board with Swipe Gestures */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'min(94vw, 440px)',
          aspectRatio: '1/1',
          background: 'var(--bg-card)',
          border: '2px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(6px, 2vw, 12px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: 'clamp(6px, 1.8vw, 10px)',
          boxShadow: 'var(--shadow-md)',
          touchAction: 'none',
          userSelect: 'none',
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
                  fontSize: val >= 1024 ? 'clamp(0.85rem, 2.5vw, 1.1rem)' : val >= 128 ? 'clamp(1rem, 3.2vw, 1.35rem)' : 'clamp(1.25rem, 4.5vw, 1.7rem)',
                  fontFamily: 'var(--font-display)',
                  boxShadow: val > 0 ? '0 3px 8px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.12s ease',
                  userSelect: 'none',
                  position: 'relative',
                  border: val > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  padding: '2px',
                }}
              >
                {val > 0 && (
                  <>
                    <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', marginBottom: '1px' }}>{stage?.icon}</span>
                    <span>{val}</span>
                    <span style={{ fontSize: 'clamp(0.55rem, 1.4vw, 0.65rem)', fontWeight: 600, opacity: 0.85, marginTop: '1px', textAlign: 'center', lineHeight: 1.1 }}>
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
              background: 'rgba(20, 13, 9, 0.9)',
              backdropFilter: 'blur(6px)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              color: '#ffffff',
              padding: '16px',
            }}
          >
            <h3 style={{ fontSize: '1.8rem', color: '#ffc988' }}>☕ Out of Space!</h3>
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
              top: '10px',
              right: '10px',
              background: 'var(--accent-primary)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            🎉 Nitro Cold Brew Unlocked!
          </div>
        )}
      </div>

      {/* Touch / Click Direction D-Pad Buttons for Mobile & Desktop */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          👆 Swipe on board or tap D-Pad below
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gap: '6px' }}>
          <div />
          <button
            onClick={() => move('up')}
            aria-label="Move Up"
            className="virtual-btn"
            style={{ fontSize: '1.1rem' }}
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => move('left')}
            aria-label="Move Left"
            className="virtual-btn"
            style={{ fontSize: '1.1rem' }}
          >
            ◀
          </button>
          <button
            onClick={() => move('down')}
            aria-label="Move Down"
            className="virtual-btn"
            style={{ fontSize: '1.1rem' }}
          >
            ▼
          </button>
          <button
            onClick={() => move('right')}
            aria-label="Move Right"
            className="virtual-btn"
            style={{ fontSize: '1.1rem' }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default Coffee2048Game;
