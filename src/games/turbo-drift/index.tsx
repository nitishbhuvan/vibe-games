import React, { useEffect, useRef, useState } from 'react';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  speed: number;
  turbo: number;
  color: string;
  name: string;
  lap: number;
  checkpoint: number;
  lapTime: number;
  bestLap: number;
}

const TurboDriftGame: React.FC<GameComponentProps> = ({ onGameOver, onScoreUpdate, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'1P' | '2P'>('1P');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [winner, setWinner] = useState<string | null>(null);
  const [p1Lap, setP1Lap] = useState<number>(0);
  const [p2Lap, setP2Lap] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Particle[]>([]);
  const nitroPicksRef = useRef<{ x: number; y: number; active: boolean; respawn: number }[]>([]);

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
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
    setGameState('playing');
    setWinner(null);
    setP1Lap(1);
    setP2Lap(1);
    setScore(0);
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

    const car1: Car = {
      x: 180,
      y: 460,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      angularVelocity: 0,
      speed: 0,
      turbo: 100,
      color: '#e09f58', // Caramel Espresso
      name: 'Player 1',
      lap: 1,
      checkpoint: 0,
      lapTime: 0,
      bestLap: 9999,
    };

    const car2: Car = {
      x: 230,
      y: 460,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      angularVelocity: 0,
      speed: 0,
      turbo: 100,
      color: '#f5efe6', // Cream Latte
      name: 'Player 2',
      lap: 1,
      checkpoint: 0,
      lapTime: 0,
      bestLap: 9999,
    };

    // Track Nitro beans
    nitroPicksRef.current = [
      { x: 200, y: 150, active: true, respawn: 0 },
      { x: 650, y: 150, active: true, respawn: 0 },
      { x: 680, y: 450, active: true, respawn: 0 },
      { x: 400, y: 300, active: true, respawn: 0 },
    ];

    // Track Checkpoints for lap validation
    const checkpoints = [
      { x: 200, y: 460, radius: 80, id: 0 }, // Start / Finish line
      { x: 200, y: 180, radius: 80, id: 1 }, // Turn 1
      { x: 450, y: 120, radius: 80, id: 2 }, // High Speed Straight
      { x: 680, y: 220, radius: 80, id: 3 }, // Chicane
      { x: 650, y: 460, radius: 80, id: 4 }, // Hairpin back
      { x: 450, y: 480, radius: 80, id: 5 }, // Final sector
    ];

    let currentScore = 0;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // 1. Physics update for Car 1
      const keys = keysRef.current;
      const p1Accel = keys['w'] || keys['W'];
      const p1Brake = keys['s'] || keys['S'];
      const p1Left = keys['a'] || keys['A'];
      const p1Right = keys['d'] || keys['D'];
      const p1Handbrake = keys[' '];

      updateCar(car1, p1Accel, p1Brake, p1Left, p1Right, p1Handbrake, dt);

      // 2. Physics update for Car 2 (2P Mode)
      if (mode === '2P') {
        const p2Accel = keys['ArrowUp'];
        const p2Brake = keys['ArrowDown'];
        const p2Left = keys['ArrowLeft'];
        const p2Right = keys['ArrowRight'];
        const p2Handbrake = keys['Shift'] || keys['Enter'];
        updateCar(car2, p2Accel, p2Brake, p2Left, p2Right, p2Handbrake, dt);
      }

      // Check Checkpoints and Laps
      checkLapProgress(car1, checkpoints, () => {
        setP1Lap(car1.lap);
        currentScore += 1000;
        setScore(currentScore);
        onScoreUpdate?.(currentScore);
        sounds.playScore();
        if (car1.lap > 3) {
          endGame(mode === '2P' ? 'Player 1 Wins!' : 'Course Completed!');
        }
      });

      if (mode === '2P') {
        checkLapProgress(car2, checkpoints, () => {
          setP2Lap(car2.lap);
          sounds.playScore();
          if (car2.lap > 3) {
            endGame('Player 2 Wins!');
          }
        });
      }

      // Nitro Pickups
      nitroPicksRef.current.forEach((pickup) => {
        if (!pickup.active) {
          pickup.respawn -= dt;
          if (pickup.respawn <= 0) pickup.active = true;
        } else {
          const d1 = Math.hypot(car1.x - pickup.x, car1.y - pickup.y);
          if (d1 < 30) {
            pickup.active = false;
            pickup.respawn = 8;
            car1.turbo = Math.min(car1.turbo + 40, 100);
            car1.speed = Math.min(car1.speed + 150, 480);
            sounds.playPop();
            currentScore += 250;
            setScore(currentScore);
            onScoreUpdate?.(currentScore);
          }

          if (mode === '2P') {
            const d2 = Math.hypot(car2.x - pickup.x, car2.y - pickup.y);
            if (d2 < 30) {
              pickup.active = false;
              pickup.respawn = 8;
              car2.turbo = Math.min(car2.turbo + 40, 100);
              car2.speed = Math.min(car2.speed + 150, 480);
              sounds.playPop();
            }
          }
        }
      });

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Clear & Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawTrack(ctx, canvas.width, canvas.height);

      // Draw Nitro pickups
      nitroPicksRef.current.forEach((pickup) => {
        if (pickup.active) {
          ctx.save();
          ctx.translate(pickup.x, pickup.y);
          ctx.fillStyle = '#ffbe76';
          ctx.shadowColor = '#f39c12';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4a2c11';
          ctx.font = '12px sans-serif';
          ctx.fillText('☕', -7, 5);
          ctx.restore();
        }
      });

      // Draw Particles (Tire Smoke / Nitro flames)
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Cars
      drawCar(ctx, car1);
      if (mode === '2P') {
        drawCar(ctx, car2);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, mode]);

  const updateCar = (
    car: Car,
    accel: boolean,
    brake: boolean,
    left: boolean,
    right: boolean,
    handbrake: boolean,
    dt: number
  ) => {
    const maxSpeed = 380;
    const accelRate = 260;
    const friction = 0.96;
    const turnSpeed = handbrake ? 3.8 : 2.8;

    if (accel) {
      car.speed = Math.min(car.speed + accelRate * dt, maxSpeed);
    } else if (brake) {
      car.speed = Math.max(car.speed - accelRate * 1.5 * dt, -120);
    } else {
      car.speed *= Math.pow(friction, dt * 60);
    }

    if (Math.abs(car.speed) > 10) {
      const dir = car.speed > 0 ? 1 : -1;
      if (left) car.angle -= turnSpeed * dt * dir;
      if (right) car.angle += turnSpeed * dt * dir;
    }

    // Velocity components
    car.vx = Math.cos(car.angle) * car.speed;
    car.vy = Math.sin(car.angle) * car.speed;

    car.x += car.vx * dt;
    car.y += car.vy * dt;

    // Track Bounds collision
    car.x = Math.max(40, Math.min(840, car.x));
    car.y = Math.max(40, Math.min(560, car.y));

    // Spawn drift smoke when turning sharply or handbraking
    if ((handbrake || (Math.abs(car.speed) > 180 && (left || right))) && Math.random() < 0.6) {
      particlesRef.current.push({
        x: car.x - Math.cos(car.angle) * 16 + (Math.random() - 0.5) * 8,
        y: car.y - Math.sin(car.angle) * 16 + (Math.random() - 0.5) * 8,
        vx: -car.vx * 0.2 + (Math.random() - 0.5) * 20,
        vy: -car.vy * 0.2 + (Math.random() - 0.5) * 20,
        life: 0.5,
        maxLife: 0.5,
        color: handbrake ? '#e09f58' : 'rgba(200, 180, 160, 0.7)',
        size: Math.random() * 5 + 3,
      });
    }
  };

  const checkLapProgress = (car: Car, checkpoints: { x: number; y: number; radius: number; id: number }[], onLap: () => void) => {
    const nextCp = (car.checkpoint + 1) % checkpoints.length;
    const cp = checkpoints[nextCp];
    const dist = Math.hypot(car.x - cp.x, car.y - cp.y);

    if (dist < cp.radius) {
      car.checkpoint = nextCp;
      if (nextCp === 0) {
        car.lap += 1;
        onLap();
      }
    }
  };

  const endGame = (msg: string) => {
    setGameState('gameover');
    setWinner(msg);
    sounds.playWin();
    onGameOver?.(score);
  };

  const drawTrack = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Asphalt Background
    ctx.fillStyle = '#221812';
    ctx.fillRect(0, 0, width, height);

    // Track asphalt path
    ctx.strokeStyle = '#38281f';
    ctx.lineWidth = 110;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(200, 460);
    ctx.lineTo(200, 180);
    ctx.arcTo(200, 100, 300, 100, 80);
    ctx.lineTo(600, 100);
    ctx.arcTo(720, 100, 720, 220, 80);
    ctx.lineTo(720, 340);
    ctx.arcTo(720, 480, 600, 480, 80);
    ctx.lineTo(200, 480);
    ctx.closePath();
    ctx.stroke();

    // Inner Curbs / Red & White Stripes
    ctx.strokeStyle = '#c87941';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Start / Finish Line Checkered Pattern
    ctx.save();
    ctx.translate(200, 460);
    for (let i = -50; i < 50; i += 10) {
      for (let j = -8; j < 8; j += 8) {
        ctx.fillStyle = (Math.floor(i / 10) + Math.floor(j / 8)) % 2 === 0 ? '#ffffff' : '#140d09';
        ctx.fillRect(j, i, 8, 10);
      }
    }
    ctx.restore();
  };

  const drawCar = (ctx: CanvasRenderingContext2D, car: Car) => {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Car Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-18, -10, 38, 22);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-14, -14, 8, 4);
    ctx.fillRect(10, -14, 8, 4);
    ctx.fillRect(-14, 10, 8, 4);
    ctx.fillRect(10, 10, 8, 4);

    // Car Body
    ctx.fillStyle = car.color;
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-16, -11, 34, 22, 5);
    ctx.fill();

    // Windshield & Roof
    ctx.fillStyle = '#1e140e';
    ctx.fillRect(-6, -8, 14, 16);

    // Headlights
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(16, -9, 3, 5);
    ctx.fillRect(16, 4, 3, 5);

    // Spoiler
    ctx.fillStyle = '#140d09';
    ctx.fillRect(-18, -12, 4, 24);

    ctx.restore();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* HUD & Scoreboard */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '880px',
          padding: '12px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>🏎️ P1 Lap: {p1Lap} / 3</span>
          {mode === '2P' && (
            <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>⚪ P2 Lap: {p2Lap} / 3</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Score: {score}</span>
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
      </div>

      {/* Main Canvas Frame */}
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
          height={600}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            aspectRatio: '880/600',
            touchAction: 'none',
          }}
        />

        {/* Menu Overlay */}
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
              gap: 'clamp(14px, 3vw, 24px)',
              color: '#fcf6ee',
              padding: '16px',
              textAlign: 'center',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--accent-warm)', textShadow: '0 0 20px rgba(224, 159, 88, 0.6)' }}>
              TURBO DRIFT 2D
            </h2>
            <p style={{ maxWidth: '460px', color: '#d4beae', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
              Master apex turns, drift corners with the handbrake, and set the fastest lap! Full mobile gamepad enabled below!
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                  transition: 'transform 0.2s',
                }}
              >
                1 Player (Time Trial)
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
                2 Players (Split Duel)
              </button>
            </div>
          </div>
        )}

        {/* GameOver Overlay */}
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
              gap: '16px',
              color: '#fcf6ee',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#ffc988' }}>🏆 {winner}</h2>
            <p style={{ fontSize: '1.1rem', color: '#d4beae' }}>Final Score: {score}</p>
            <button
              onClick={() => startGame(mode)}
              style={{
                padding: '10px 28px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Race Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile Racing Gamepad Controller */}
      {gameState === 'playing' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: '880px',
            padding: '4px 8px',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left Thumb: Steering */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onPointerDown={() => {
                keysRef.current['ArrowLeft'] = true;
                keysRef.current['a'] = true;
              }}
              onPointerUp={() => {
                keysRef.current['ArrowLeft'] = false;
                keysRef.current['a'] = false;
              }}
              onPointerLeave={() => {
                keysRef.current['ArrowLeft'] = false;
                keysRef.current['a'] = false;
              }}
              aria-label="Steer Left"
              className="virtual-btn"
              style={{ width: '56px', height: '54px', fontSize: '1.25rem' }}
            >
              ◀
            </button>
            <button
              onPointerDown={() => {
                keysRef.current['ArrowRight'] = true;
                keysRef.current['d'] = true;
              }}
              onPointerUp={() => {
                keysRef.current['ArrowRight'] = false;
                keysRef.current['d'] = false;
              }}
              onPointerLeave={() => {
                keysRef.current['ArrowRight'] = false;
                keysRef.current['d'] = false;
              }}
              aria-label="Steer Right"
              className="virtual-btn"
              style={{ width: '56px', height: '54px', fontSize: '1.25rem' }}
            >
              ▶
            </button>
          </div>

          {/* Center: Handbrake Drift */}
          <button
            onPointerDown={() => (keysRef.current[' '] = true)}
            onPointerUp={() => (keysRef.current[' '] = false)}
            onPointerLeave={() => (keysRef.current[' '] = false)}
            aria-label="Handbrake Drift"
            className="virtual-btn"
            style={{
              padding: '0 18px',
              height: '54px',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'rgba(231, 76, 60, 0.25)',
              border: '2px solid #e74c3c',
              color: '#ff7675',
            }}
          >
            ⚡ DRIFT
          </button>

          {/* Right Thumb: Gas & Brake */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onPointerDown={() => {
                keysRef.current['ArrowDown'] = true;
                keysRef.current['s'] = true;
              }}
              onPointerUp={() => {
                keysRef.current['ArrowDown'] = false;
                keysRef.current['s'] = false;
              }}
              onPointerLeave={() => {
                keysRef.current['ArrowDown'] = false;
                keysRef.current['s'] = false;
              }}
              aria-label="Brake or Reverse"
              className="virtual-btn"
              style={{
                width: '56px',
                height: '54px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#e74c3c',
              }}
            >
              BRAKE
            </button>
            <button
              onPointerDown={() => {
                keysRef.current['ArrowUp'] = true;
                keysRef.current['w'] = true;
              }}
              onPointerUp={() => {
                keysRef.current['ArrowUp'] = false;
                keysRef.current['w'] = false;
              }}
              onPointerLeave={() => {
                keysRef.current['ArrowUp'] = false;
                keysRef.current['w'] = false;
              }}
              aria-label="Accelerate"
              className="virtual-btn"
              style={{
                width: '64px',
                height: '54px',
                fontSize: '0.85rem',
                fontWeight: 800,
                background: 'var(--accent-primary)',
                color: '#ffffff',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              GAS 🔥
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurboDriftGame;
