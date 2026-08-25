import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

type Difficulty = 'easy' | 'medium' | 'hard' | 'insane';

interface DifficultySetting {
  id: Difficulty;
  label: string;
  speedMultiplier: number;
  aiReaction: number;
  color: string;
  badge: string;
}

const DIFFICULTIES: DifficultySetting[] = [
  {
    id: 'easy',
    label: 'Mild Brew (1.0x)',
    speedMultiplier: 1.0,
    aiReaction: 0.72,
    color: '#8fae8b',
    badge: '🌱 Casual',
  },
  {
    id: 'medium',
    label: 'Espresso (1.35x)',
    speedMultiplier: 1.35,
    aiReaction: 0.86,
    color: '#e09f58',
    badge: '☕ Medium',
  },
  {
    id: 'hard',
    label: 'Dark Roast (1.75x)',
    speedMultiplier: 1.75,
    aiReaction: 0.96,
    color: '#d97706',
    badge: '🔥 Fast',
  },
  {
    id: 'insane',
    label: 'Nitro Overdrive (2.25x)',
    speedMultiplier: 2.25,
    aiReaction: 1.15,
    color: '#ef4444',
    badge: '⚡ Insane',
  },
];

const DualPongGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const difficultyRef = useRef<Difficulty>(difficulty);
  const p1TouchYRef = useRef<number | null>(null);
  const p2TouchYRef = useRef<number | null>(null);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'w', 's', ' '].includes(e.key)) {
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

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const midX = rect.left + rect.width / 2;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const touchY = (touch.clientY - rect.top) * scaleY;
      if (touch.clientX < midX) {
        p1TouchYRef.current = touchY;
      } else {
        p2TouchYRef.current = touchY;
      }
    }
  };

  const handleCanvasTouchEnd = () => {
    p1TouchYRef.current = null;
    p2TouchYRef.current = null;
  };

  const startGame = (selectedMode: '1P' | '2P', selectedDiff: Difficulty = difficulty) => {
    setMode(selectedMode);
    setDifficulty(selectedDiff);
    difficultyRef.current = selectedDiff;
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    p1TouchYRef.current = null;
    p2TouchYRef.current = null;
    setGameState('playing');
    sounds.playWin();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const currentDiffSetting = DIFFICULTIES.find((d) => d.id === difficultyRef.current) || DIFFICULTIES[1];
    const speedMult = currentDiffSetting.speedMultiplier;

    const paddleWidth = 14;
    const paddleHeight = 90;
    const paddleSpeed = 440 * Math.max(1, speedMult * 0.85);

    let p1Y = canvas.height / 2 - paddleHeight / 2;
    let p2Y = canvas.height / 2 - paddleHeight / 2;

    const baseBallSpeed = 360 * speedMult;
    let ballSpeed = baseBallSpeed;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballVX = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
    let ballVY = (Math.random() * 2 - 1) * (180 * speedMult);
    const ballRadius = 9;

    let score1 = 0;
    let score2 = 0;
    let rally = 0;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const resetBall = (direction: number) => {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeed = baseBallSpeed;
      ballVX = direction * ballSpeed;
      ballVY = (Math.random() * 2 - 1) * (180 * speedMult);
      rally = 0;
    };

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const keys = keysRef.current;

      // 1. Move Player 1 (Touch drag OR W/S)
      if (p1TouchYRef.current !== null) {
        const targetP1 = p1TouchYRef.current - paddleHeight / 2;
        p1Y += (targetP1 - p1Y) * Math.min(18 * dt, 1);
      } else {
        if (keys['w'] || keys['W']) p1Y -= paddleSpeed * dt;
        if (keys['s'] || keys['S']) p1Y += paddleSpeed * dt;
      }
      p1Y = Math.max(10, Math.min(canvas.height - paddleHeight - 10, p1Y));

      // 2. Move Player 2 (Touch drag in 2P, Arrow keys in 2P, or AI in 1P)
      if (mode === '2P') {
        if (p2TouchYRef.current !== null) {
          const targetP2 = p2TouchYRef.current - paddleHeight / 2;
          p2Y += (targetP2 - p2Y) * Math.min(18 * dt, 1);
        } else {
          if (keys['ArrowUp']) p2Y -= paddleSpeed * dt;
          if (keys['ArrowDown']) p2Y += paddleSpeed * dt;
        }
      } else {
        // AI Logic scaled with difficulty
        const targetY = ballY - paddleHeight / 2;
        const diff = targetY - p2Y;
        const aiSpeed = paddleSpeed * currentDiffSetting.aiReaction;
        p2Y += Math.sign(diff) * Math.min(Math.abs(diff), aiSpeed * dt);
      }
      p2Y = Math.max(10, Math.min(canvas.height - paddleHeight - 10, p2Y));

      // 3. Move Ball
      ballX += ballVX * dt;
      ballY += ballVY * dt;

      // Top / Bottom wall bounce
      if (ballY - ballRadius <= 0) {
        ballY = ballRadius;
        ballVY = -ballVY;
        sounds.playBounce();
      } else if (ballY + ballRadius >= canvas.height) {
        ballY = canvas.height - ballRadius;
        ballVY = -ballVY;
        sounds.playBounce();
      }

      // Left Paddle Collision (Player 1)
      if (
        ballX - ballRadius <= 30 + paddleWidth &&
        ballX + ballRadius >= 30 &&
        ballY >= p1Y &&
        ballY <= p1Y + paddleHeight &&
        ballVX < 0
      ) {
        ballX = 30 + paddleWidth + ballRadius;
        rally++;
        ballSpeed = Math.min(ballSpeed + 25 * speedMult, 950 * speedMult);
        const hitOffset = (ballY - (p1Y + paddleHeight / 2)) / (paddleHeight / 2);
        ballVX = Math.cos(hitOffset * 0.9) * ballSpeed;
        ballVY = Math.sin(hitOffset * 0.9) * ballSpeed;
        sounds.playBounce();
        spawnParticles(ballX, ballY, '#e09f58', Math.round(6 * speedMult));
      }

      // Right Paddle Collision (Player 2 / AI)
      const p2X = canvas.width - 30 - paddleWidth;
      if (
        ballX + ballRadius >= p2X &&
        ballX - ballRadius <= p2X + paddleWidth &&
        ballY >= p2Y &&
        ballY <= p2Y + paddleHeight &&
        ballVX > 0
      ) {
        ballX = p2X - ballRadius;
        rally++;
        ballSpeed = Math.min(ballSpeed + 25 * speedMult, 950 * speedMult);
        const hitOffset = (ballY - (p2Y + paddleHeight / 2)) / (paddleHeight / 2);
        ballVX = -Math.cos(hitOffset * 0.9) * ballSpeed;
        ballVY = Math.sin(hitOffset * 0.9) * ballSpeed;
        sounds.playBounce();
        spawnParticles(ballX, ballY, '#f5efe6', Math.round(6 * speedMult));
      }

      // Score Check
      if (ballX < 0) {
        score2++;
        setP2Score(score2);
        sounds.playScore();
        if (score2 >= 7) {
          endMatch('p2', mode === '2P' ? 'Player 2 Wins!' : 'AI Overlord Wins!');
          return;
        }
        resetBall(1);
      } else if (ballX > canvas.width) {
        score1++;
        setP1Score(score1);
        onScoreUpdate?.(score1 * 100 * Math.round(speedMult));
        sounds.playScore();
        if (score1 >= 7) {
          endMatch('p1', 'Player 1 Wins!');
          return;
        }
        resetBall(-1);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2.2;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Draw Screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#140d09';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center Divider line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Circle
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.15)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Paddles
      ctx.fillStyle = '#e09f58';
      ctx.shadowColor = '#e09f58';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(30, p1Y, paddleWidth, paddleHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#f5efe6';
      ctx.shadowColor = '#f5efe6';
      ctx.beginPath();
      ctx.roundRect(canvas.width - 30 - paddleWidth, p2Y, paddleWidth, paddleHeight, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Ball with intensity based on speed
      ctx.fillStyle = currentDiffSetting.color;
      ctx.shadowColor = currentDiffSetting.color;
      ctx.shadowBlur = 14 + speedMult * 6;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 180 * speedMult,
          vy: (Math.random() - 0.5) * 180 * speedMult,
          life: 0.5,
          color,
        });
      }
    };

    const triggerVictoryConfetti = (winningSide: 'p1' | 'p2') => {
      sounds.playWin();

      if (winningSide === 'p1') {
        // Player 1 (Left Side) Confetti Cannons
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.25, y: 0.6 },
          colors: ['#e09f58', '#f39c12', '#ffc988', '#ffffff', '#c87941'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 90,
            angle: 60,
            spread: 65,
            origin: { x: 0.05, y: 0.7 },
            colors: ['#e09f58', '#ffc988', '#ffffff'],
          });
        }, 250);
        setTimeout(() => {
          confetti({
            particleCount: 140,
            spread: 100,
            origin: { x: 0.5, y: 0.4 },
          });
        }, 500);
      } else {
        // Player 2 / AI (Right Side) Confetti Cannons
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.75, y: 0.6 },
          colors: ['#f5efe6', '#d4a373', '#e09f58', '#ffffff', '#ffbe76'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 90,
            angle: 120,
            spread: 65,
            origin: { x: 0.95, y: 0.7 },
            colors: ['#f5efe6', '#d4a373', '#ffffff'],
          });
        }, 250);
        setTimeout(() => {
          confetti({
            particleCount: 140,
            spread: 100,
            origin: { x: 0.5, y: 0.4 },
          });
        }, 500);
      }
    };

    const endMatch = (winningSide: 'p1' | 'p2', winnerMsg: string) => {
      setGameState('gameover');
      setWinner(winnerMsg);
      triggerVictoryConfetti(winningSide);
      onGameOver?.(score1 * 100 * Math.round(speedMult));
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode, onGameOver, onScoreUpdate]);

  const currentDiff = DIFFICULTIES.find((d) => d.id === difficulty) || DIFFICULTIES[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* Score Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '820px',
          padding: '12px 24px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>P1 (WASD)</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{p1Score}</span>
        </div>

        {/* Center: Difficulty Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-tag-bg)',
              color: currentDiff.color,
              fontSize: '0.8rem',
              fontWeight: 800,
              border: `1px solid ${currentDiff.color}55`,
            }}
          >
            {currentDiff.badge} • {currentDiff.speedMultiplier}x Speed
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{p2Score}</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {mode === '2P' ? 'P2 (Arrows)' : 'AI Bot'}
          </span>
        </div>
      </div>

      {/* Canvas Frame with Touch Interaction */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '2px solid var(--border-highlight)',
          width: '100%',
          maxWidth: '820px',
        }}
      >
        <canvas
          ref={canvasRef}
          width={820}
          height={520}
          onTouchStart={handleCanvasTouch}
          onTouchMove={handleCanvasTouch}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            aspectRatio: '820/520',
            touchAction: 'none',
          }}
        />

        {/* Menu Overlay with Difficulty Factor Selector */}
        {gameState === 'menu' && (
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
              gap: 'clamp(12px, 3vw, 20px)',
              color: '#fcf6ee',
              padding: '16px',
              textAlign: 'center',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--accent-warm)', textShadow: '0 0 20px rgba(224, 159, 88, 0.6)' }}>
              DUAL PONG BATTLE
            </h2>
            <p style={{ maxWidth: '460px', color: '#d4beae', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
              Spin curves, deflect rallies, and adjust the ball speed difficulty factor! Touch and drag directly on screen to steer your paddle!
            </p>

            {/* Difficulty Speed Multiplier Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-warm)', letterSpacing: '0.04em' }}>
                DIFFICULTY FACTOR:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {DIFFICULTIES.map((d) => {
                  const isSel = difficulty === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSel ? d.color : 'rgba(40, 25, 16, 0.8)',
                        color: isSel ? '#ffffff' : '#d4beae',
                        border: isSel ? `2px solid #ffffff` : `1px solid rgba(255,255,255,0.15)`,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        boxShadow: isSel ? `0 0 16px ${d.color}88` : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Select Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => startGame('1P')}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                1 Player (vs AI)
              </button>
              <button
                onClick={() => startGame('2P')}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: '#2d1d13',
                  color: 'var(--accent-warm)',
                  border: '1px solid var(--accent-primary)',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                2 Players (Split Touch)
              </button>
            </div>
          </div>
        )}

        {/* GameOver Overlay with Celebratory Winner Card */}
        {gameState === 'gameover' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(20, 13, 9, 0.94)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              color: '#fcf6ee',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              🎉 VICTORY CELEBRATION
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                color: winner?.includes('Player 1') ? '#e09f58' : '#f5efe6',
                textShadow: '0 0 30px rgba(224, 159, 88, 0.7)',
                lineHeight: 1.1,
              }}
            >
              🏆 {winner}
            </h2>

            <div
              style={{
                display: 'flex',
                gap: '16px',
                background: 'rgba(35, 23, 16, 0.8)',
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-main)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#d4beae', display: 'block' }}>FINAL SCORE</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {p1Score} - {p2Score}
                </span>
              </div>
              <div style={{ width: '1px', background: 'var(--border-main)' }} />
              <div>
                <span style={{ fontSize: '0.72rem', color: '#d4beae', display: 'block' }}>DIFFICULTY</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: currentDiff.color }}>
                  {currentDiff.speedMultiplier}x
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => setGameState('menu')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: '1px solid var(--border-main)',
                  color: '#d4beae',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Change Difficulty
              </button>
              <button
                onClick={() => startGame(mode)}
                style={{
                  padding: '10px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                Play Rematch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Virtual Buttons & Touch Controls Guide */}
      {gameState === 'playing' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '820px', padding: '0 8px', gap: '12px', alignItems: 'center' }}>
          {/* P1 Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onPointerDown={() => (keysRef.current['w'] = true)}
              onPointerUp={() => (keysRef.current['w'] = false)}
              onPointerLeave={() => (keysRef.current['w'] = false)}
              aria-label="Player 1 Up"
              className="virtual-btn"
              style={{ width: '50px', height: '48px', fontSize: '1.2rem', color: '#e09f58' }}
            >
              ▲
            </button>
            <button
              onPointerDown={() => (keysRef.current['s'] = true)}
              onPointerUp={() => (keysRef.current['s'] = false)}
              onPointerLeave={() => (keysRef.current['s'] = false)}
              aria-label="Player 1 Down"
              className="virtual-btn"
              style={{ width: '50px', height: '48px', fontSize: '1.2rem', color: '#e09f58' }}
            >
              ▼
            </button>
            <span style={{ fontSize: '0.78rem', color: '#e09f58', fontWeight: 700, marginLeft: '4px' }}>P1 Controls</span>
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            👆 Or drag finger directly on screen!
          </span>

          {/* P2 Controls in 2P Mode */}
          {mode === '2P' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#f5efe6', fontWeight: 700, marginRight: '4px' }}>P2 Controls</span>
              <button
                onPointerDown={() => (keysRef.current['ArrowUp'] = true)}
                onPointerUp={() => (keysRef.current['ArrowUp'] = false)}
                onPointerLeave={() => (keysRef.current['ArrowUp'] = false)}
                aria-label="Player 2 Up"
                className="virtual-btn"
                style={{ width: '50px', height: '48px', fontSize: '1.2rem' }}
              >
                ▲
              </button>
              <button
                onPointerDown={() => (keysRef.current['ArrowDown'] = true)}
                onPointerUp={() => (keysRef.current['ArrowDown'] = false)}
                onPointerLeave={() => (keysRef.current['ArrowDown'] = false)}
                aria-label="Player 2 Down"
                className="virtual-btn"
                style={{ width: '50px', height: '48px', fontSize: '1.2rem' }}
              >
                ▼
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DualPongGame;
