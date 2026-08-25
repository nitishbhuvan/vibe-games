import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Sun, Moon, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
}) => {
  const { theme, toggleTheme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setMobileSearchActive(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px clamp(12px, 3vw, 24px)',
        borderBottom: '1px solid var(--border-main)',
        minHeight: '60px',
      }}
    >
      {/* If Mobile Search is Active, show full-width search input */}
      {mobileSearchActive ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games, tags, modes..."
              style={{
                width: '100%',
                height: '42px',
                padding: '0 38px 0 38px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-input)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none',
                boxShadow: '0 0 0 3px var(--accent-glow)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileSearchActive(false)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Left: Sidebar Toggle + Logo in rounded highlighted box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle categories menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: sidebarOpen ? 'var(--accent-tag-bg)' : 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                color: 'var(--accent-primary)',
                transition: 'all var(--transition-fast)',
                flexShrink: 0,
              }}
            >
              <Menu size={22} />
            </button>

            {/* Highlighted Rounded Logo Box */}
            <Link
              to="/"
              className="brand-logo-container"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px clamp(10px, 2vw, 16px)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                border: '2px solid var(--border-highlight)',
                boxShadow: 'var(--shadow-sm), 0 0 12px var(--accent-glow)',
                userSelect: 'none',
                transition: 'transform var(--transition-spring), box-shadow var(--transition-normal), border-color var(--transition-normal)',
                flexShrink: 0,
              }}
            >
              {/* Coffee Cup Icon */}
              <span style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}>☕</span>

              {/* VIBE GA[M]ES Text with Controller 'M' */}
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(1.05rem, 2.8vw, 1.35rem)',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                VIBE&nbsp;GA
                {/* Stylized Controller 'M' */}
                <span className="controller-m-box" title="Game Controller M">
                  <svg
                    className="controller-m-svg"
                    width="22"
                    height="18"
                    viewBox="0 0 32 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 19C2.5 17 2 13 2 9C2 5 5 2 9 2C12 2 14.5 4.5 16 7C17.5 4.5 20 2 23 2C27 2 30 5 30 9C30 13 29.5 17 28 19C26.5 21 24 22 22 20C19.5 17.5 18 15 16 15C14 15 12.5 17.5 10 20C8 22 5.5 21 4 19Z"
                      fill="var(--accent-primary)"
                      stroke="var(--accent-warm)"
                      strokeWidth="1.5"
                    />
                    <path d="M7 8H11M9 6V10" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="21" cy="7" r="1.2" fill="#ffffff" />
                    <circle cx="24" cy="9" r="1.2" fill="#ffffff" />
                    <circle cx="21" cy="11" r="1.2" fill="#ffffff" />
                    <circle cx="16" cy="11" r="1" fill="#f5efe6" />
                  </svg>
                </span>
                ES
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar (Hidden on narrow mobile screens < 640px) */}
          <div
            style={{
              position: 'relative',
              maxWidth: '380px',
              width: '100%',
              margin: '0 12px',
              display: 'flex',
              alignItems: 'center',
            }}
            className="desktop-search-container"
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games or tags... ('/')"
              style={{
                width: '100%',
                height: '40px',
                padding: '0 36px 0 40px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-main)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-main)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Right: Mobile Search Trigger + Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Mobile Search Icon Button */}
            <button
              onClick={() => {
                setMobileSearchActive(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              aria-label="Open search"
              className="mobile-search-btn"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              <Search size={18} />
            </button>

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle light and dark coffee mode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)',
                height: '42px',
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={18} style={{ color: 'var(--accent-warm)' }} />
                  <span className="theme-text" style={{ color: 'var(--text-primary)' }}>Light</span>
                </>
              ) : (
                <>
                  <Moon size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span className="theme-text" style={{ color: 'var(--text-primary)' }}>Dark</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </header>
  );
};
