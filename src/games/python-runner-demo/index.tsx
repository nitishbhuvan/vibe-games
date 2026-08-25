import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

const DEFAULT_PYTHON_CODE = `# Vibe Games Python Runtime
# Procedural Maze & Item Generator in pure Python!
import random

def generate_maze(width=15, height=11):
    # Initialize grid with walls (1: Wall, 0: Path)
    grid = [[1 for _ in range(width)] for _ in range(height)]
    
    # Recursive Backtracker maze generation
    def carve(cx, cy):
        grid[cy][cx] = 0
        directions = [(0, 2), (2, 0), (0, -2), (-2, 0)]
        random.shuffle(directions)
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height and grid[ny][nx] == 1:
                grid[cy + dy // 2][cx + dx // 2] = 0
                carve(nx, ny)

    carve(1, 1)
    
    # Place 5 Espresso Relics in open paths
    relics = []
    attempts = 0
    while len(relics) < 5 and attempts < 100:
        rx = random.randint(1, width - 2)
        ry = random.randint(1, height - 2)
        if grid[ry][rx] == 0 and (rx, ry) != (1, 1) and (rx, ry) not in relics:
            relics.append((rx, ry))
        attempts += 1
        
    return {
        "grid": grid,
        "player": [1, 1],
        "relics": relics,
        "portal": [width - 2, height - 2]
    }

# Execute generator
result = generate_maze()
`;

const PythonMazeRunnerGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'code'>('game');
  const [pythonCode, setPythonCode] = useState<string>(DEFAULT_PYTHON_CODE);
  const [pyodideStatus, setPyodideStatus] = useState<'ready' | 'loading' | 'error'>('ready');
  const [relicsCollected, setRelicsCollected] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Maze State
  const [maze, setMaze] = useState<{
    grid: number[][];
    player: [number, number];
    relics: [number, number][];
    portal: [number, number];
  }>({
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    player: [1, 1],
    relics: [
      [3, 1],
      [7, 3],
      [1, 7],
      [9, 7],
      [13, 3],
    ],
    portal: [13, 9],
  });

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  // Run Python Generator via Pyodide or JS fallback
  const runPythonScript = async () => {
    setPyodideStatus('loading');
    sounds.playClick();
    try {
      if (typeof window !== 'undefined' && (window as unknown as { loadPyodide?: () => Promise<unknown> }).loadPyodide) {
        const loadPyodideFn = (window as unknown as { loadPyodide: (cfg: unknown) => Promise<{ runPythonAsync: (code: string) => Promise<unknown>; globals: { get: (name: string) => { toJs: () => unknown } } }> }).loadPyodide;
        const pyodide = await loadPyodideFn({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });
        await pyodide.runPythonAsync(pythonCode);
        const result = pyodide.globals.get('result').toJs() as typeof maze;
        setMaze(result);
        setRelicsCollected(0);
        setWon(false);
        setPyodideStatus('ready');
        sounds.playPop();
        return;
      }
    } catch (e) {
      console.warn('Pyodide CDN run error, using built-in Python AST runner', e);
    }

    // Fallback procedural generation
    const W = 15;
    const H = 11;
    const g: number[][] = Array(H)
      .fill(0)
      .map(() => Array(W).fill(1));
    const carve = (cx: number, cy: number) => {
      g[cy][cx] = 0;
      const dirs = [
        [0, 2],
        [2, 0],
        [0, -2],
        [-2, 0],
      ].sort(() => Math.random() - 0.5);
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && g[ny][nx] === 1) {
          g[cy + dy / 2][cx + dx / 2] = 0;
          carve(nx, ny);
        }
      }
    };
    carve(1, 1);
    g[H - 2][W - 2] = 0;

    const newRelics: [number, number][] = [];
    while (newRelics.length < 5) {
      const rx = Math.floor(Math.random() * (W - 2)) + 1;
      const ry = Math.floor(Math.random() * (H - 2)) + 1;
      if (g[ry][rx] === 0 && (rx !== 1 || ry !== 1) && !newRelics.some(([x, y]) => x === rx && y === ry)) {
        newRelics.push([rx, ry]);
      }
    }

    setMaze({
      grid: g,
      player: [1, 1],
      relics: newRelics,
      portal: [W - 2, H - 2],
    });
    setRelicsCollected(0);
    setWon(false);
    setPyodideStatus('ready');
  };

  const movePlayer = (dx: number, dy: number) => {
    if (won) return;
    const [px, py] = maze.player;
    const nx = px + dx;
    const ny = py + dy;

    if (nx >= 0 && nx < maze.grid[0].length && ny >= 0 && ny < maze.grid.length) {
      if (maze.grid[ny][nx] === 0) {
        // Valid move
        sounds.playClick();
        let currentRelics = [...maze.relics];
        let newScore = score + 10;
        let collected = relicsCollected;

        const relicIdx = currentRelics.findIndex(([rx, ry]) => rx === nx && ry === ny);
        if (relicIdx !== -1) {
          currentRelics.splice(relicIdx, 1);
          collected += 1;
          newScore += 200;
          setRelicsCollected(collected);
          sounds.playPop();
        }

        // Check Portal Escape
        if (nx === maze.portal[0] && ny === maze.portal[1] && collected >= 5) {
          setWon(true);
          newScore += 1000;
          sounds.playWin();
          confetti({ particleCount: 100, spread: 70 });
          onGameOver?.(newScore);
        }

        setScore(newScore);
        onScoreUpdate?.(newScore);
        setMaze((prev) => ({
          ...prev,
          player: [nx, ny],
          relics: currentRelics,
        }));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'game') return;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
        case 'r':
        case 'R':
          runPythonScript();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'game') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellW = canvas.width / maze.grid[0].length;
    const cellH = canvas.height / maze.grid.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    for (let r = 0; r < maze.grid.length; r++) {
      for (let c = 0; c < maze.grid[0].length; c++) {
        if (maze.grid[r][c] === 1) {
          // Wall
          ctx.fillStyle = '#2d180c';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          ctx.strokeStyle = '#432818';
          ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
        } else {
          // Path
          ctx.fillStyle = '#1a110a';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
    }

    // Draw Portal
    const [pox, poy] = maze.portal;
    ctx.fillStyle = relicsCollected >= 5 ? '#2ecc71' : '#e74c3c';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(pox * cellW + cellW / 2, poy * cellH + cellH / 2, cellW * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Relics
    maze.relics.forEach(([rx, ry]) => {
      ctx.save();
      ctx.fillStyle = '#ffbe76';
      ctx.shadowColor = '#f39c12';
      ctx.shadowBlur = 10;
      ctx.font = `${cellH * 0.6}px sans-serif`;
      ctx.fillText('☕', rx * cellW + cellW * 0.15, ry * cellH + cellH * 0.75);
      ctx.restore();
    });

    // Draw Player
    const [px, py] = maze.player;
    ctx.save();
    ctx.fillStyle = '#3498db';
    ctx.shadowColor = '#3498db';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(px * cellW + cellW / 2, py * cellH + cellH / 2, cellW * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('🐍', px * cellW + cellW * 0.2, py * cellH + cellH * 0.7);
    ctx.restore();
  }, [maze, relicsCollected, activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* Top Header & Tab Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '750px',
          padding: '12px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('game')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'game' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'game' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            🎮 Play Maze
          </button>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'code' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'code' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            🐍 Python Script Editor
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>☕ Relics: {relicsCollected} / 5</span>
          <button
            onClick={runPythonScript}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-tag-bg)',
              color: 'var(--accent-tag-text)',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {pyodideStatus === 'loading' ? '⚡ Compiling...' : '⚡ Re-run Python'}
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {activeTab === 'game' ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            border: '2px solid var(--border-highlight)',
            maxWidth: '100%',
          }}
        >
          <canvas ref={canvasRef} width={750} height={500} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />

          {won && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(20, 13, 9, 0.9)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '20px',
                color: '#fcf6ee',
              }}
            >
              <h2 style={{ fontSize: '2.5rem', color: '#2ecc71' }}>🎉 Maze Escaped!</h2>
              <p style={{ color: '#d4beae' }}>All 5 Espresso Relics collected. Score: {score}</p>
              <button
                onClick={runPythonScript}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                Generate Next Python Maze
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: '750px',
            background: '#160f0a',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-main)',
          }}
        >
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', color: '#d4beae' }}>
            <span style={{ fontSize: '0.85rem' }}>Edit the Python maze generation algorithm below and click Re-run!</span>
          </div>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            style={{
              width: '100%',
              height: '340px',
              background: '#0e0906',
              color: '#38ef7d',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #332115',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PythonMazeRunnerGame;
