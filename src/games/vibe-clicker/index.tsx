import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { GameComponentProps } from '../types';
import { sounds } from '../../utils/audio';

interface Upgrade {
  id: string;
  name: string;
  cost: number;
  cps: number; // Coffee beans per second
  count: number;
  icon: string;
  description: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

const STORAGE_KEY = 'vibe_coffee_clicker_save_v1';

const INITIAL_UPGRADES: Upgrade[] = [
  { id: 'grinder', name: 'Manual Burr Grinder', cost: 15, cps: 1, count: 0, icon: '⚙️', description: 'Crushes beans steadily' },
  { id: 'french_press', name: 'French Press', cost: 100, cps: 5, count: 0, icon: '🫖', description: 'Rich, steeped goodness' },
  { id: 'espresso_machine', name: 'Italian Espresso Machine', cost: 1100, cps: 40, count: 0, icon: '⚡', description: 'High pressure 9-bar extraction' },
  { id: 'cold_brew', name: 'Nitro Cold Brew Tower', cost: 12000, cps: 260, count: 0, icon: '🧊', description: 'Smooth cascading nitro bubbles' },
  { id: 'ai_barista', name: 'AI Robot Barista', cost: 130000, cps: 1400, count: 0, icon: '🤖', description: 'Perfection in every micro-droplet' },
  { id: 'quantum_roast', name: 'Quantum Solar Roaster', cost: 1400000, cps: 8500, count: 0, icon: '☀️', description: 'Roasts with photon lasers' },
];

interface SaveData {
  beans: number;
  upgrades: { id: string; count: number; cost: number }[];
  lastSaved: number;
}

const VibeClickerGame: React.FC<GameComponentProps> = ({ onScoreUpdate, isMuted }) => {
  // Load saved state from LocalStorage
  const [beans, setBeans] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SaveData = JSON.parse(saved);
        return typeof parsed.beans === 'number' ? parsed.beans : 0;
      }
    } catch (e) {
      console.warn('Failed to parse clicker save', e);
    }
    return 0;
  });

  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SaveData = JSON.parse(saved);
        if (parsed.upgrades && Array.isArray(parsed.upgrades)) {
          return INITIAL_UPGRADES.map((def) => {
            const found = parsed.upgrades.find((u) => u.id === def.id);
            if (found) {
              return {
                ...def,
                count: found.count || 0,
                cost: found.cost || def.cost,
              };
            }
            return def;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse upgrades save', e);
    }
    return INITIAL_UPGRADES;
  });

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [combo, setCombo] = useState<number>(1);
  const [mugScale, setMugScale] = useState<number>(1);

  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sounds.setMuted(!!isMuted);
  }, [isMuted]);

  // Persist to LocalStorage whenever beans or upgrades change
  useEffect(() => {
    try {
      const saveData: SaveData = {
        beans,
        upgrades: upgrades.map((u) => ({ id: u.id, count: u.count, cost: u.cost })),
        lastSaved: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.error('Failed to save clicker state', e);
    }
  }, [beans, upgrades]);

  // Beans per second calculation
  const totalBps = upgrades.reduce((acc, u) => acc + u.cps * u.count, 0);

  // Background Tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalBps > 0) {
        setBeans((prev) => {
          const next = prev + totalBps / 10;
          onScoreUpdate?.(Math.floor(next));
          return next;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [totalBps, onScoreUpdate]);

  const handleMugClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Increment combo
    setCombo((prev) => Math.min(prev + 0.1, 5));
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setCombo(1), 1200);

    const gained = Math.round(1 * combo);
    setBeans((prev) => {
      const next = prev + gained;
      onScoreUpdate?.(Math.floor(next));
      return next;
    });

    sounds.playPop();
    setMugScale(0.92);
    setTimeout(() => setMugScale(1), 100);

    // Floating text
    const newId = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id: newId, x, y, text: `+${gained}` }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newId));
    }, 800);
  };

  const buyUpgrade = (upgradeId: string) => {
    const upg = upgrades.find((u) => u.id === upgradeId);
    if (!upg || beans < upg.cost) return;

    sounds.playScore();
    setBeans((prev) => prev - upg.cost);

    setUpgrades((prev) =>
      prev.map((u) => {
        if (u.id === upgradeId) {
          return {
            ...u,
            count: u.count + 1,
            cost: Math.round(u.cost * 1.15),
          };
        }
        return u;
      })
    );

    if (upgradeId === 'quantum_roast') {
      confetti({ particleCount: 60, spread: 50 });
    }
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset your Coffee Clicker empire to start fresh?')) {
      localStorage.removeItem(STORAGE_KEY);
      setBeans(0);
      setUpgrades(INITIAL_UPGRADES);
      sounds.playPop();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* Top Save & Info Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '900px',
          padding: '10px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>💾 Auto-Saved to Device:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {Math.floor(beans).toLocaleString()} Beans • {upgrades.reduce((a, b) => a + b.count, 0)} Items Owned
          </span>
        </div>
        <button
          onClick={resetProgress}
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-main)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reset Save
        </button>
      </div>

      {/* Main Game Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.2fr)',
          gap: '24px',
          width: '100%',
          maxWidth: '900px',
        }}
      >
        {/* Left Column: Big Mug & Stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL BEANS ROASTED</span>
            <h2
              style={{
                fontSize: '2.4rem',
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                margin: '4px 0',
              }}
            >
              {Math.floor(beans).toLocaleString()}
            </h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ⚡ {totalBps.toLocaleString()} beans / sec
            </span>
            {combo > 1 && (
              <div
                style={{
                  marginTop: '6px',
                  display: 'inline-block',
                  background: 'var(--accent-tag-bg)',
                  color: 'var(--accent-tag-text)',
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                🔥 Combo: {combo.toFixed(1)}x
              </div>
            )}
          </div>

          {/* Giant Clickable Mug */}
          <div
            onClick={handleMugClick}
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent-warm) 0%, var(--accent-primary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 35px var(--accent-glow)',
              transform: `scale(${mugScale})`,
              transition: 'transform 0.1s ease',
              userSelect: 'none',
              position: 'relative',
              margin: '20px 0',
            }}
          >
            <span style={{ fontSize: '5rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>☕</span>

            {/* Floating click scores */}
            {floatingTexts.map((ft) => (
              <span
                key={ft.id}
                style={{
                  position: 'absolute',
                  left: `${ft.x}px`,
                  top: `${ft.y}px`,
                  fontWeight: 800,
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  pointerEvents: 'none',
                  animation: 'float 0.8s ease-out forwards',
                }}
              >
                {ft.text}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto' }}>
            Click faster to increase your brew combo boost! Progress is auto-saved.
          </p>
        </div>

        {/* Right Column: Roastery Upgrades Shop */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-md)',
            maxHeight: '520px',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--accent-primary)' }}>
            🏪 Roastery Equipment Shop
          </h3>

          {upgrades.map((u) => {
            const canAfford = beans >= u.cost;
            return (
              <div
                key={u.id}
                onClick={() => canAfford && buyUpgrade(u.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: canAfford ? 'var(--bg-subtle)' : 'transparent',
                  border: `1px solid ${canAfford ? 'var(--border-highlight)' : 'var(--border-main)'}`,
                  opacity: canAfford ? 1 : 0.6,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{u.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      +{u.cps} bps • {u.description}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      color: canAfford ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                    }}
                  >
                    ☕ {u.cost.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Owned: {u.count}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VibeClickerGame;
