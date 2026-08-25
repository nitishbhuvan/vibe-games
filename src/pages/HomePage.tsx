import React, { useMemo } from 'react';
import { ALL_GAMES } from '../games/registry';
import type { GameCategory } from '../games/types';
import { GAME_CATEGORIES, getCategoryInfo } from '../games/categories';
import { GameCard } from '../components/GameCard';
import { useGameStats } from '../context/GameStatsContext';
import { Flame, Sparkles, Coffee, Play, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HomePageProps {
  selectedCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onClearSearch,
}) => {
  const { sortGames, mostRecentGameId, stats } = useGameStats();

  // Filter games by category and search query
  const filteredGames = useMemo(() => {
    return ALL_GAMES.filter((game) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'all' || game.categories.includes(selectedCategory);

      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        game.tagline.toLowerCase().includes(q) ||
        game.categories.some((c) => c.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Apply Vibe Games Sorting (Most Recent #1, Most Played #2+, etc.)
  const sortedGames = useMemo(() => {
    return sortGames(filteredGames);
  }, [filteredGames, sortGames]);

  // Featured Game for Hero Banner
  const featuredGame = ALL_GAMES[0]; // Turbo Drift 2D
  const currentCatInfo = getCategoryInfo(selectedCategory);

  // Total games and total plays counter
  const totalUserPlays = Object.values(stats).reduce((acc, curr) => acc + curr.playCount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Banner (Shown when no search query is active) */}
      {!searchQuery && selectedCategory === 'all' && (
        <section
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
            border: '2px solid var(--border-highlight)',
            padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 32px)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md), 0 0 20px var(--accent-glow)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(18px, 3vw, 24px)',
            alignItems: 'center',
          }}
        >
          {/* Background subtle glowing pattern */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-tag-bg)',
                  color: 'var(--accent-tag-text)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={14} />
                <span>COFFEE-THEMED GAME HUB</span>
              </span>
              {totalUserPlays > 0 && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  ⚡ {totalUserPlays} plays locally
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.75rem, 5vw, 2.8rem)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Play, Vibe & Explore <br />
              <span style={{ color: 'var(--accent-primary)' }}>Browser Games</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.92rem, 2vw, 1.05rem)', maxWidth: '520px' }}>
              Instant arcade, 2-player local duels, puzzle solvers, and live Python scripts. Zero downloads, pure vibe.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
              <Link
                to={`/game/${featuredGame.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: 'var(--shadow-glow)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                <Play size={18} fill="#ffffff" />
                <span>Featured: {featuredGame.title}</span>
              </Link>
            </div>
          </div>

          {/* Quick stats coffee card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-card)',
              padding: 'clamp(16px, 3vw, 24px)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-main)',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coffee size={22} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.05rem' }}>Smart Vibe Sorting</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Your device automatically puts your <strong>Most Recently Played</strong> game at #1, followed by your{' '}
              <strong>Most Played</strong> titles!
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginTop: '4px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-main)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>AVAILABLE GAMES</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {ALL_GAMES.length}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>TAG CATEGORIES</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                  {GAME_CATEGORIES.length - 1}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Pills Bar (Smooth Touch Scroll) */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
      >
        {GAME_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.86rem',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-main)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                scrollSnapAlign: 'start',
                flexShrink: 0,
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Filter & Sorting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{currentCatInfo.icon}</span>
            <span>{searchQuery ? `Search: "${searchQuery}"` : currentCatInfo.name}</span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-tag-bg)',
                color: 'var(--accent-tag-text)',
              }}
            >
              {sortedGames.length}
            </span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {searchQuery
              ? 'Showing games matching your keywords'
              : currentCatInfo.description}
          </p>
        </div>

        {/* Sorting reminder pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Flame size={12} style={{ color: 'var(--accent-primary)' }} />
          <span>Recent & Most Played</span>
        </div>
      </div>

      {/* Games Grid (Zero horizontal overflow on narrow mobile) */}
      {sortedGames.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(16px, 3vw, 24px)',
          }}
        >
          {sortedGames.map((game, index) => {
            const isFirstRecent = index === 0 && game.id === mostRecentGameId && (stats[game.id]?.playCount ?? 0) > 0;
            return <GameCard key={game.id} game={game} isFirstRecent={isFirstRecent} />;
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-highlight)',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <Search size={40} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.3rem' }}>No games found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '380px' }}>
            We couldn't find any games matching your current search or category filter.
          </p>
          <button
            onClick={() => {
              onClearSearch();
              onSelectCategory('all');
            }}
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Clear Filters & View All
          </button>
        </div>
      )}
    </div>
  );
};
