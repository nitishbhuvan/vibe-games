import React from 'react';
import { GAME_CATEGORIES } from '../games/categories';
import type { GameCategory } from '../games/types';
import { ALL_GAMES } from '../games/registry';
import { X, Sparkles } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  selectedCategory: GameCategory;
  onSelectCategory: (category: GameCategory) => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  selectedCategory,
  onSelectCategory,
  onClose,
}) => {
  // Count games in each category
  const getGameCount = (catId: GameCategory) => {
    if (catId === 'all') return ALL_GAMES.length;
    return ALL_GAMES.filter((g) => g.categories.includes(catId)).length;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 35,
            display: 'block',
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(320px, 86vw)',
          zIndex: 60,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-spring)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-main)',
          padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)) 16px',
          overflowY: 'auto',
          boxShadow: isOpen ? 'var(--shadow-lg), 0 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '0 8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
              Categories
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            style={{
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category List Buttons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {GAME_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = getGameCount(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  // On small screens, close sidebar upon selection
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--accent-tag-bg)' : 'transparent',
                  color: isSelected ? 'var(--accent-tag-text)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.92rem',
                  border: isSelected ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600,
                    border: '1px solid var(--border-main)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            marginTop: 'auto',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            ☕ Vibe Coding Powered
          </p>
          <p>Instant play • Direct shareable links • No installs</p>
        </div>
      </aside>
    </>
  );
};
