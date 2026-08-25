import React from 'react';
import { Link } from 'react-router-dom';
import type { GameMetadata } from '../games/types';
import { useGameStats } from '../context/GameStatsContext';
import { Star, Play, Heart, Flame, Clock } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  isFirstRecent?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game, isFirstRecent }) => {
  const { getGameStats, toggleFavorite } = useGameStats();
  const stats = getGameStats(game.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(game.id);
  };

  return (
    <div
      className="game-card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-main)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Thumbnail Area */}
      <Link
        to={`/game/${game.id}`}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          background: `radial-gradient(circle at 50% 30%, ${game.accentColor}33 0%, var(--bg-subtle) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--border-main)',
          overflow: 'hidden',
        }}
      >
        {/* Floating Big Emoji Icon */}
        <span
          style={{
            fontSize: '4.5rem',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
            transition: 'transform var(--transition-spring)',
          }}
        >
          {game.thumbnail}
        </span>

        {/* Favorite Button (44x44px for touch accessibility) */}
        <button
          onClick={handleHeartClick}
          aria-label="Toggle favorite"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(20, 13, 9, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stats.isFavorite ? '#e74c3c' : '#ffffff',
            transition: 'transform var(--transition-fast)',
            zIndex: 10,
          }}
        >
          <Heart size={20} fill={stats.isFavorite ? '#e74c3c' : 'none'} />
        </button>

        {/* Dynamic Status Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isFirstRecent && stats.lastPlayed && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--badge-recent-bg)',
                color: 'var(--badge-recent-text)',
                fontSize: '0.72rem',
                fontWeight: 800,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Clock size={12} />
              <span>LAST PLAYED</span>
            </div>
          )}

          {!isFirstRecent && stats.playCount >= 3 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--badge-top-bg)',
                color: 'var(--badge-top-text)',
                fontSize: '0.72rem',
                fontWeight: 800,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Flame size={12} />
              <span>{stats.playCount} PLAYS</span>
            </div>
          )}

          {game.badge && !isFirstRecent && stats.playCount < 3 && (
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-tag-bg)',
                color: 'var(--accent-tag-text)',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid var(--border-highlight)',
              }}
            >
              {game.badge}
            </div>
          )}
        </div>

        {/* Type Badge on bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(20, 13, 9, 0.75)',
            color: '#f5efe6',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {game.type}
        </div>
      </Link>

      {/* Card Body */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <Link to={`/game/${game.id}`}>
            <h3
              style={{
                fontSize: '1.25rem',
                color: 'var(--text-primary)',
                transition: 'color var(--transition-fast)',
              }}
            >
              {game.title}
            </h3>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700 }}>
            <Star size={14} fill="#f59e0b" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {game.tagline}
        </p>

        {/* Categories Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
          {game.categories.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-main)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer with Play Button & Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-main)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {stats.playCount > 0 ? `${stats.playCount} sessions` : 'New release'}
          </span>

          <Link
            to={`/game/${game.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
          >
            <Play size={14} fill="#ffffff" />
            <span>Play</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
