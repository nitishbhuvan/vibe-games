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
          gap: '12px',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <ArrowLeft size={18} />
          <span>All Games</span>
        </button>

        {/* Quick Game Info Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>{game.thumbnail}</span>
          <div>
            <h1 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>{game.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>by {game.author}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontWeight: 700 }}>
                <Star size={13} fill="#f59e0b" />
                {game.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                <Flame size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {stats.playCount} plays
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Mute, Restart, Fullscreen, Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: isMuted ? 'var(--text-muted)' : 'var(--accent-primary)',
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={handleRestart}
            title="Restart Game"
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-secondary)',
            }}
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-secondary)',
            }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={handleShare}
            title="Share Game Link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
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
          padding: '24px',
          boxShadow: 'var(--shadow-lg), 0 0 25px var(--accent-glow)',
          minHeight: '520px',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Controls Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '22px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Gamepad2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.15rem' }}>Game Controls</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{ctrl.action}</span>
                <kbd
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-main)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'var(--accent-primary)',
                    boxShadow: '0 2px 0 var(--border-main)',
                  }}
                >
                  {ctrl.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* How to Play & Description Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '22px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Info size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.15rem' }}>How to Play</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            {game.description}
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {game.instructions.map((inst, i) => (
              <li key={i} style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                {inst}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended More Games */}
      <section style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>More Games You Might Like</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {relatedGames.map((rg) => (
            <GameCard key={rg.id} game={rg} />
          ))}
        </div>
      </section>
    </div>
  );
};
