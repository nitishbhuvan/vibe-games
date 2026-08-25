import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

const DualPongGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);

  const keysRef = useRef<{ [key: string]: boolean }>({});

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

  const startGame = (selectedMode: '1P' | '2P') => {
    setMode(selectedMode);
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
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

    const paddleWidth = 14;
    const paddleHeight = 90;
    const paddleSpeed = 440;

    let p1Y = canvas.height / 2 - paddleHeight / 2;
    let p2Y = canvas.height / 2 - paddleHeight / 2;

    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeed = 380;
    let ballVX = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
    let ballVY = (Math.random() * 2 - 1) * 200;
    const ballRadius = 9;

    let score1 = 0;
    let score2 = 0;
    let rally = 0;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

    const resetBall = (direction: number) => {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeed = 380;
      ballVX = direction * ballSpeed;
      ballVY = (Math.random() * 2 - 1) * 180;
      rally = 0;
    };

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const keys = keysRef.current;

      // 1. Move Player 1 (W / S)
      if (keys['w'] || keys['W']) p1Y -= paddleSpeed * dt;
      if (keys['s'] || keys['S']) p1Y += paddleSpeed * dt;
      p1Y = Math.max(10, Math.min(canvas.height - paddleHeight - 10, p1Y));

      // 2. Move Player 2 (Arrow keys in 2P, AI in 1P)
      if (mode === '2P') {
        if (keys['ArrowUp']) p2Y -= paddleSpeed * dt;
        if (keys['ArrowDown']) p2Y += paddleSpeed * dt;
      } else {
        // AI Logic
        const targetY = ballY - paddleHeight / 2;
        const diff = targetY - p2Y;
        const aiSpeed = paddleSpeed * 0.82;
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
        ballSpeed = Math.min(ballSpeed + 25, 750);
        const hitOffset = (ballY - (p1Y + paddleHeight / 2)) / (paddleHeight / 2);
        ballVX = Math.cos(hitOffset * 0.9) * ballSpeed;
        ballVY = Math.sin(hitOffset * 0.9) * ballSpeed;
        sounds.playBounce();
        spawnParticles(ballX, ballY, '#e09f58');
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
        ballSpeed = Math.min(ballSpeed + 25, 750);
        const hitOffset = (ballY - (p2Y + paddleHeight / 2)) / (paddleHeight / 2);
        ballVX = -Math.cos(hitOffset * 0.9) * ballSpeed;
        ballVY = Math.sin(hitOffset * 0.9) * ballSpeed;
        sounds.playBounce();
        spawnParticles(ballX, ballY, '#f5efe6');
      }

      // Score Check
      if (ballX < 0) {
        score2++;
        setP2Score(score2);
        sounds.playScore();
        if (score2 >= 7) {
          endMatch(mode === '2P' ? 'Player 2 Wins!' : 'AI Overlord Wins!');
          return;
        }
        resetBall(1);
      } else if (ballX > canvas.width) {
        score1++;
        setP1Score(score1);
        onScoreUpdate?.(score1 * 100);
        sounds.playScore();
        if (score1 >= 7) {
          endMatch('Player 1 Wins!');
          return;
        }
        resetBall(-1);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
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

      // Draw Ball
      ctx.fillStyle = '#ffc988';
      ctx.shadowColor = '#ffc988';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Particles
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    const spawnParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 8; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          life: 0.5,
          color,
        });
      }
    };

    const endMatch = (winnerMsg: string) => {
      setGameState('gameover');
      setWinner(winnerMsg);
      sounds.playWin();
      confetti({ particleCount: 80, spread: 60 });
      onGameOver?.(score1 * 100);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, mode, onGameOver, onScoreUpdate]);

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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>P1 (WASD)</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{p1Score}</span>
        </div>
        <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>First to 7 Wins</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{p2Score}</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {mode === '2P' ? 'P2 (Arrows)' : 'AI Bot'}
          </span>
        </div>
      </div>

      {/* Canvas */}
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
        <canvas ref={canvasRef} width={820} height={520} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />

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
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent-warm)', textShadow: '0 0 20px rgba(224, 159, 88, 0.6)' }}>
              DUAL PONG BATTLE
            </h2>
            <p style={{ maxWidth: '440px', color: '#d4beae' }}>
              Spin curves, deflect rallies, and crush your rival in fast 1P vs AI or 2-Player local arcade pong.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => startGame('1P')}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                1 Player (vs AI)
              </button>
              <button
                onClick={() => startGame('2P')}
                style={{
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: '#2d1d13',
                  color: 'var(--accent-warm)',
                  border: '1px solid var(--accent-primary)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                2 Players (Local)
              </button>
            </div>
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
            <h2 style={{ fontSize: '2.5rem', color: '#ffc988' }}>🏆 {winner}</h2>
            <p style={{ fontSize: '1.2rem', color: '#d4beae' }}>
              Final Score: {p1Score} - {p2Score}
            </p>
            <button
              onClick={() => startGame(mode)}
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
              Rematch
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DualPongGame;
