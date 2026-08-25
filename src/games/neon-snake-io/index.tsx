import React, { useEffect, useRef, useState } from 'react';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

interface Point {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
  val: number;
  color: string;
  radius: number;
  isCoffee: boolean;
}

interface Snake {
  id: string;
  name: string;
  body: Point[];
  angle: number;
  targetAngle: number;
  speed: number;
  baseSpeed: number;
  boostSpeed: number;
  isBoosting: boolean;
  length: number;
  color: string;
  isPlayer: boolean;
  score: number;
}

const NeonSnakeGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState<number>(0);
  const [length, setLength] = useState<number>(10);
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([]);

  const mousePosRef = useRef<Point>({ x: 440, y: 300 });
  const isMouseDownRef = useRef<boolean>(false);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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
    setLength(15);
    sounds.playWin();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WORLD_W = 1600;
    const WORLD_H = 1200;

    let animId: number;
    let lastTime = performance.now();

    // Create Player Snake
    const player: Snake = {
      id: 'player',
      name: 'You (Coffee King)',
      body: [],
      angle: 0,
      targetAngle: 0,
      speed: 180,
      baseSpeed: 180,
      boostSpeed: 300,
      isBoosting: false,
      length: 15,
      color: '#e09f58',
      isPlayer: true,
      score: 0,
    };

    for (let i = 0; i < player.length; i++) {
      player.body.push({ x: 400 - i * 8, y: 300 });
    }

    // Create AI Bots
    const botColors = ['#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71', '#1abc9c'];
    const botNames = ['MochaBot', 'CaffeineRush', 'ArabicaSlither', 'DriftViper', 'PixelPython', 'NitroSip'];
    const bots: Snake[] = botNames.map((name, idx) => {
      const b: Snake = {
        id: `bot-${idx}`,
        name,
        body: [],
        angle: Math.random() * Math.PI * 2,
        targetAngle: Math.random() * Math.PI * 2,
        speed: 150 + Math.random() * 30,
        baseSpeed: 150 + Math.random() * 30,
        boostSpeed: 250,
        isBoosting: false,
        length: 12 + Math.floor(Math.random() * 15),
        color: botColors[idx % botColors.length],
        isPlayer: false,
        score: 50 + Math.floor(Math.random() * 100),
      };
      const startX = 200 + Math.random() * (WORLD_W - 400);
      const startY = 200 + Math.random() * (WORLD_H - 400);
      for (let i = 0; i < b.length; i++) {
        b.body.push({ x: startX - i * 8, y: startY });
      }
      return b;
    });

    // Create Foods
    const foods: Food[] = [];
    const colors = ['#f5efe6', '#e09f58', '#f39c12', '#2ecc71', '#3498db', '#ff7675'];
    for (let i = 0; i < 180; i++) {
      foods.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        val: Math.random() < 0.2 ? 5 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() < 0.2 ? 7 : 4,
        isCoffee: Math.random() < 0.3,
      });
    }

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // 1. Update Player Input Angle & Speed
      const screenCenterX = canvas.width / 2;
      const screenCenterY = canvas.height / 2;

      // Mouse direction relative to screen center
      const dx = mousePosRef.current.x - screenCenterX;
      const dy = mousePosRef.current.y - screenCenterY;
      if (Math.hypot(dx, dy) > 10) {
        player.targetAngle = Math.atan2(dy, dx);
      }

      // Keyboard steering fallback
      const keys = keysRef.current;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.targetAngle -= 3.5 * dt;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.targetAngle += 3.5 * dt;

      player.isBoosting = isMouseDownRef.current || keys[' '] || keys['Shift'] || keys['ArrowUp'] || keys['w'];
      player.speed = player.isBoosting && player.length > 8 ? player.boostSpeed : player.baseSpeed;

      // Smooth angle interpolation
      let angleDiff = player.targetAngle - player.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      player.angle += angleDiff * Math.min(8 * dt, 1);

      // Move player head
      const head = player.body[0];
      const newHeadX = head.x + Math.cos(player.angle) * player.speed * dt;
      const newHeadY = head.y + Math.sin(player.angle) * player.speed * dt;

      // Boundary check
      if (newHeadX < 20 || newHeadX > WORLD_W - 20 || newHeadY < 20 || newHeadY > WORLD_H - 20) {
        // Player died on wall
        handlePlayerDeath(player.score);
        return;
      }

      player.body.unshift({ x: newHeadX, y: newHeadY });
      while (player.body.length > player.length) {
        player.body.pop();
      }

      // 2. Update Bots
      bots.forEach((bot) => {
        // AI random roaming / food tracking
        if (Math.random() < 0.04) {
          bot.targetAngle += (Math.random() - 0.5) * 1.5;
        }
        let bDiff = bot.targetAngle - bot.angle;
        while (bDiff > Math.PI) bDiff -= Math.PI * 2;
        while (bDiff < -Math.PI) bDiff += Math.PI * 2;
        bot.angle += bDiff * 4 * dt;

        const bHead = bot.body[0];
        let bNewX = bHead.x + Math.cos(bot.angle) * bot.speed * dt;
        let bNewY = bHead.y + Math.sin(bot.angle) * bot.speed * dt;

        // Turn away from walls
        if (bNewX < 50 || bNewX > WORLD_W - 50 || bNewY < 50 || bNewY > WORLD_H - 50) {
          bot.targetAngle += Math.PI * 0.8;
          bNewX = Math.max(30, Math.min(WORLD_W - 30, bNewX));
          bNewY = Math.max(30, Math.min(WORLD_H - 30, bNewY));
        }

        bot.body.unshift({ x: bNewX, y: bNewY });
        while (bot.body.length > bot.length) {
          bot.body.pop();
        }
      });

      // 3. Collision with Food
      foods.forEach((food) => {
        const pHead = player.body[0];
        const dist = Math.hypot(pHead.x - food.x, pHead.y - food.y);
        if (dist < 14 + food.radius) {
          food.x = Math.random() * WORLD_W;
          food.y = Math.random() * WORLD_H;
          player.length += food.val;
          player.score += food.val * 10;
          setScore(player.score);
          setLength(player.length);
          onScoreUpdate?.(player.score);
          sounds.playPop();
        }

        bots.forEach((b) => {
          const bHead = b.body[0];
          if (Math.hypot(bHead.x - food.x, bHead.y - food.y) < 14 + food.radius) {
            food.x = Math.random() * WORLD_W;
            food.y = Math.random() * WORLD_H;
            b.length += food.val;
            b.score += food.val * 10;
          }
        });
      });

      // 4. Collision with other snakes
      const pHead = player.body[0];
      for (const bot of bots) {
        for (let i = 2; i < bot.body.length; i++) {
          const segment = bot.body[i];
          if (Math.hypot(pHead.x - segment.x, pHead.y - segment.y) < 12) {
            handlePlayerDeath(player.score);
            return;
          }
        }
      }

      // Update Leaderboard
      const allSnakes = [player, ...bots].sort((a, b) => b.score - a.score);
      setLeaderboard(allSnakes.slice(0, 5).map((s) => ({ name: s.name, score: s.score })));

      // 5. Render Camera Centered on Player
      const camX = player.body[0].x - canvas.width / 2;
      const camY = player.body[0].y - canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-camX, -camY);

      // Arena Background & Grid
      ctx.fillStyle = '#140d09';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);

      ctx.strokeStyle = 'rgba(70, 45, 30, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= WORLD_W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_H);
        ctx.stroke();
      }
      for (let y = 0; y <= WORLD_H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_W, y);
        ctx.stroke();
      }

      // World Border Glow
      ctx.strokeStyle = '#e09f58';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#e09f58';
      ctx.shadowBlur = 15;
      ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
      ctx.shadowBlur = 0;

      // Draw Foods
      foods.forEach((food) => {
        ctx.save();
        ctx.translate(food.x, food.y);
        ctx.fillStyle = food.color;
        ctx.shadowColor = food.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, food.radius, 0, Math.PI * 2);
        ctx.fill();

        if (food.isCoffee) {
          ctx.fillStyle = '#140d09';
          ctx.font = '10px sans-serif';
          ctx.fillText('☕', -5, 4);
        }
        ctx.restore();
      });

      // Draw Bots
      bots.forEach((b) => drawSnake(ctx, b));

      // Draw Player
      drawSnake(ctx, player);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    const handlePlayerDeath = (finalScore: number) => {
      setGameState('gameover');
      sounds.playCrash();
      onGameOver?.(finalScore);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onGameOver, onScoreUpdate]);

  const drawSnake = (ctx: CanvasRenderingContext2D, snake: Snake) => {
    if (snake.body.length === 0) return;

    ctx.save();
    // Snake Body Segments
    for (let i = snake.body.length - 1; i >= 0; i--) {
      const pt = snake.body[i];
      const rad = i === 0 ? 10 : Math.max(6, 9 - (i / snake.body.length) * 3);

      ctx.fillStyle = snake.color;
      ctx.shadowColor = snake.color;
      ctx.shadowBlur = snake.isBoosting ? 14 : 6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snake Head Eyes
    const head = snake.body[0];
    const eyeDist = 5;
    const eyeAngle = snake.angle;
    const leftEyeX = head.x + Math.cos(eyeAngle + Math.PI / 3) * eyeDist;
    const leftEyeY = head.y + Math.sin(eyeAngle + Math.PI / 3) * eyeDist;
    const rightEyeX = head.x + Math.cos(eyeAngle - Math.PI / 3) * eyeDist;
    const rightEyeY = head.y + Math.sin(eyeAngle - Math.PI / 3) * eyeDist;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI * 2);
    ctx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(leftEyeX + Math.cos(snake.angle) * 1.5, leftEyeY + Math.sin(snake.angle) * 1.5, 1.5, 0, Math.PI * 2);
    ctx.arc(rightEyeX + Math.cos(snake.angle) * 1.5, rightEyeY + Math.sin(snake.angle) * 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Name tag
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000';
    ctx.fillText(snake.name, head.x - 20, head.y - 14);

    ctx.restore();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mousePosRef.current = {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '14px' }}>
      {/* Top HUD */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '880px',
          padding: '10px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>
            🐍 Length: {length}
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Score: {score}</span>
        </div>
        <button
          onClick={() => setGameState('menu')}
          aria-label="Reset arena"
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-tag-bg)',
            color: 'var(--accent-tag-text)',
            fontWeight: 600,
            fontSize: '0.82rem',
          }}
        >
          Reset Arena
        </button>
      </div>

      {/* Canvas Box */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--border-highlight)',
          width: '100%',
          maxWidth: '880px',
        }}
      >
        <canvas
          ref={canvasRef}
          width={880}
          height={560}
          onMouseMove={handleMouseMove}
          onMouseDown={() => (isMouseDownRef.current = true)}
          onMouseUp={() => (isMouseDownRef.current = false)}
          onTouchStart={(e) => {
            handleTouchMove(e);
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => (isMouseDownRef.current = false)}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            aspectRatio: '880/560',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />

        {/* Floating Nitro Boost Button for Mobile */}
        {gameState === 'playing' && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              zIndex: 10,
            }}
          >
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                isMouseDownRef.current = true;
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                isMouseDownRef.current = false;
              }}
              onPointerLeave={() => (isMouseDownRef.current = false)}
              aria-label="Nitro Boost"
              className="virtual-btn"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #f39c12 0%, var(--accent-primary) 100%)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                boxShadow: '0 0 20px rgba(243, 156, 18, 0.6), 0 4px 10px rgba(0,0,0,0.4)',
                border: '2px solid #ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <span>BOOST</span>
            </button>
          </div>
        )}

        {/* Live Leaderboard Overlay */}
        {gameState === 'playing' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(20, 13, 9, 0.78)',
              backdropFilter: 'blur(8px)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-main)',
              color: '#ffffff',
              fontSize: '0.75rem',
              pointerEvents: 'none',
              maxWidth: '180px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--accent-warm)', marginBottom: '4px' }}>🏆 Top Snakes</div>
            {leaderboard.slice(0, 4).map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                <span style={{ color: entry.name.includes('You') ? '#e09f58' : '#d4beae', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {idx + 1}. {entry.name}
                </span>
                <span style={{ fontWeight: 600 }}>{entry.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(20, 13, 9, 0.88)',
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
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-warm)', textShadow: '0 0 20px rgba(224, 159, 88, 0.6)' }}>
              NEON SNAKE IO
            </h2>
            <p style={{ maxWidth: '460px', color: '#d4beae' }}>
              Slither freely in 360°, collect glowing coffee pellets, and cut off bots to dominate the arena!
            </p>
            <button
              onClick={startGame}
              style={{
                padding: '14px 36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.15rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Enter Arena
            </button>
          </div>
        )}

        {/* GameOver Overlay */}
        {gameState === 'gameover' && (
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
            <h2 style={{ fontSize: '2.4rem', color: '#e74c3c' }}>💥 Snake Smashed!</h2>
            <p style={{ fontSize: '1.2rem', color: '#d4beae' }}>Final Score: {score} | Length: {length}</p>
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
              Respawn Snake
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeonSnakeGame;
