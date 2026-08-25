import React, { useEffect, useRef, useState } from 'react';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'standard' | 'moving' | 'spring' | 'broken';
  vx?: number;
  broken?: boolean;
}

const RetroJumpGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState<number>(0);

  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    sounds.playBounce();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Player
    const player = {
      x: canvas.width / 2 - 15,
      y: canvas.height - 120,
      w: 32,
      h: 32,
      vx: 0,
      vy: -550,
      facing: 1,
    };

    const gravity = 1200;
    const jumpPower = -620;
    const superJumpPower = -950;
    let currentScore = 0;
    let cameraY = 0;

    // Generate initial platforms
    const platforms: Platform[] = [
      { x: canvas.width / 2 - 40, y: canvas.height - 50, w: 80, h: 14, type: 'standard' },
    ];

    for (let i = 1; i < 15; i++) {
      const typeRand = Math.random();
      const type: Platform['type'] = typeRand < 0.2 ? 'spring' : typeRand < 0.4 ? 'moving' : 'standard';
      platforms.push({
        x: Math.random() * (canvas.width - 80),
        y: canvas.height - i * 65,
        w: 75,
        h: 14,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 80 : -80) : 0,
      });
    }

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Handle Horizontal Movement
      const keys = keysRef.current;
      const moveSpeed = 360;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.vx = -moveSpeed;
        player.facing = -1;
      } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.vx = moveSpeed;
        player.facing = 1;
      } else {
        player.vx *= 0.8;
      }

      // Physics
      player.vy += gravity * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Screen wrapping
      if (player.x < -player.w) player.x = canvas.width;
      if (player.x > canvas.width) player.x = -player.w;

      // Moving platforms update
      platforms.forEach((plat) => {
        if (plat.type === 'moving' && plat.vx) {
          plat.x += plat.vx * dt;
          if (plat.x < 0 || plat.x + plat.w > canvas.width) {
            plat.vx = -plat.vx;
          }
        }
      });

      // Platform Collisions (only when falling downwards)
      if (player.vy > 0) {
        platforms.forEach((plat) => {
          if (
            player.x + player.w > plat.x &&
            player.x < plat.x + plat.w &&
            player.y + player.h >= plat.y &&
            player.y + player.h <= plat.y + 16
          ) {
            if (plat.type === 'spring') {
              player.vy = superJumpPower;
              sounds.playWin();
            } else {
              player.vy = jumpPower;
              sounds.playBounce();
            }
          }
        });
      }

      // Camera Scrolling & Score Tracking
      if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        cameraY += diff;
        currentScore = Math.floor(cameraY);
        setScore(currentScore);
        onScoreUpdate?.(currentScore);

        platforms.forEach((plat) => {
          plat.y += diff;
        });

        // Remove offscreen platforms and spawn new ones at top
        for (let i = platforms.length - 1; i >= 0; i--) {
          if (platforms[i].y > canvas.height + 50) {
            platforms.splice(i, 1);
            const highestY = Math.min(...platforms.map((p) => p.y));
            const typeRand = Math.random();
            const type: Platform['type'] = typeRand < 0.25 ? 'spring' : typeRand < 0.5 ? 'moving' : 'standard';
            platforms.push({
              x: Math.random() * (canvas.width - 80),
              y: highestY - (55 + Math.random() * 25),
              w: 70,
              h: 14,
              type,
              vx: type === 'moving' ? (Math.random() > 0.5 ? 90 : -90) : 0,
            });
          }
        }
      }

      // Fall off bottom -> Game Over
      if (player.y > canvas.height + 40) {
        setGameState('gameover');
        sounds.playCrash();
        onGameOver?.(currentScore);
        return;
      }

      // Draw Everything
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#1e140e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Background stars/coffee dust
      ctx.fillStyle = 'rgba(212, 163, 115, 0.15)';
      for (let i = 0; i < 20; i++) {
        const starY = (i * 35 + cameraY * 0.4) % canvas.height;
        ctx.fillRect((i * 47) % canvas.width, starY, 3, 3);
      }

      // Draw Platforms
      platforms.forEach((plat) => {
        ctx.save();
        if (plat.type === 'spring') {
          ctx.fillStyle = '#f39c12';
          ctx.shadowColor = '#f39c12';
          ctx.shadowBlur = 10;
        } else if (plat.type === 'moving') {
          ctx.fillStyle = '#3498db';
        } else {
          ctx.fillStyle = '#8fae8b';
        }

        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();

        // Spring icon
        if (plat.type === 'spring') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText('☕ BOOST', plat.x + 12, plat.y + 11);
        }
        ctx.restore();
      });

      // Draw Player (Coffee Jumper Character)
      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
      if (player.facing === -1) ctx.scale(-1, 1);

      ctx.fillStyle = '#e09f58';
      ctx.shadowColor = '#e09f58';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Snout
      ctx.fillStyle = '#2c1810';
      ctx.beginPath();
      ctx.arc(6, -3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Coffee cap
      ctx.fillStyle = '#f5efe6';
      ctx.fillRect(-10, -16, 20, 5);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onGameOver, onScoreUpdate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* Score Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '420px',
          padding: '12px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
          Altitude: {score}m
        </span>
        <button
          onClick={() => setGameState('menu')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-tag-bg)',
            color: 'var(--accent-tag-text)',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--border-highlight)',
        }}
      >
        <canvas ref={canvasRef} width={420} height={580} style={{ display: 'block' }} />

        {/* Menu */}
        {gameState === 'menu' && (
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
              gap: '24px',
              color: '#fcf6ee',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: '2.4rem', color: 'var(--accent-warm)', textShadow: '0 0 20px rgba(224, 159, 88, 0.6)' }}>
              PIXEL JUMP
            </h2>
            <p style={{ maxWidth: '320px', color: '#d4beae', fontSize: '0.95rem' }}>
              Steer left and right, bounce on green platforms and grab espresso spring boosts to soar!
            </p>
            <button
              onClick={startGame}
              style={{
                padding: '12px 32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.1rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Start Jump
            </button>
          </div>
        )}

        {/* GameOver */}
        {gameState === 'gameover' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(20, 13, 9, 0.92)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              color: '#fcf6ee',
            }}
          >
            <h2 style={{ fontSize: '2.4rem', color: '#e74c3c' }}>💀 Fell Down!</h2>
            <p style={{ fontSize: '1.2rem', color: '#d4beae' }}>Max Altitude: {score}m</p>
            <button
              onClick={startGame}
              style={{
                padding: '12px 32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Jump Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroJumpGame;
