import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGameById, ALL_GAMES } from '../games/registry';
import { useGameStats } from '../context/GameStatsContext';
import { GameCard } from '../components/GameCard';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Share2,
  Star,
  Gamepad2,
  Info,
  Check,
  Flame,
} from 'lucide-react';

export const GamePlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const game = getGameById(id || '');

  const { recordPlay, updateHighScore, getGameStats } = useGameStats();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Key for remounting on restart

  // Record play session immediately on mounting this game
  useEffect(() => {
    if (game) {
      recordPlay(game.id);
    }
  }, [game?.id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!game) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          textAlign: 'center',
          gap: '20px',
        }}
      >
        <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>Game Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>The game you are looking for does not exist or has moved.</p>
        <Link
          to="/"
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          Return to Vibe Hub
        </Link>
      </div>
    );
  }

  const stats = getGameStats(game.id);
  const GameComponent = game.component;

  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen error', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleRestart = () => {
    setGameKey((prev) => prev + 1);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleScoreUpdate = (score: number) => {
    updateHighScore(game.id, score);
  };

  // Other related games recommendation (excluding this game)
  const relatedGames = ALL_GAMES.filter((g) => g.id !== game.id).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'clamp(8px, 2vw, 14px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/')}
            aria-label="Back to all games"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-sm)',
              height: '42px',
            }}
          >
            <ArrowLeft size={18} />
            <span className="back-btn-text">Back</span>
          </button>

          {/* Quick Game Info Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)' }}>{game.thumbnail}</span>
            <div>
              <h1 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {game.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontWeight: 700 }}>
                  <Star size={12} fill="#f59e0b" />
                  {game.rating.toFixed(1)}
                </span>
                <span>•</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                  <Flame size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {stats.playCount} plays
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Mute, Restart, Fullscreen, Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle mute"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: isMuted ? 'var(--text-muted)' : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={handleRestart}
            title="Restart Game"
            aria-label="Restart game"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle fullscreen"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={handleShare}
            title="Share Game Link"
            aria-label="Share game link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 14px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Container */}
      <div
        ref={gameContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--border-highlight)',
          padding: 'clamp(10px, 2.5vw, 24px)',
          boxShadow: 'var(--shadow-lg), 0 0 25px var(--accent-glow)',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <GameComponent
          key={gameKey}
          isMuted={isMuted}
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleScoreUpdate}
        />
      </div>

      {/* Details, Controls & Instructions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
        {/* Controls Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: 'clamp(16px, 3vw, 22px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Gamepad2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>Game Controls</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {game.controls.map((ctrl, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                }}
              >
                <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{ctrl.action}</span>
                <kbd
                  style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-main)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: 'var(--accent-primary)',
                    boxShadow: '0 2px 0 var(--border-main)',
                  }}
                >
                  {ctrl.key}
                </kbd>
              </div>
            ))}
            {/* Mobile Touch hint */}
            <div
              style={{
                marginTop: '4px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-tag-bg)',
                color: 'var(--accent-tag-text)',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              📱 Mobile Touch Enabled: Use the on-screen buttons, touch gestures, or drag directly on screen to play!
            </div>
          </div>
        </div>

        {/* How to Play & Description Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: 'clamp(16px, 3vw, 22px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Info size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>How to Play</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
            {game.description}
          </p>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {game.instructions.map((inst, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {inst}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended More Games */}
      <section style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>More Games You Might Like</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {relatedGames.map((rg) => (
            <GameCard key={rg.id} game={rg} />
          ))}
        </div>
      </section>
    </div>
  );
};
