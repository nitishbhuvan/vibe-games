import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { GameStatsProvider } from './context/GameStatsContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { GamePlayerPage } from './pages/GamePlayerPage';
import type { GameCategory } from './games/types';
import { Home, Grid, Sun, Moon } from 'lucide-react';

const MobileBottomNav: React.FC<{
  onToggleSidebar: () => void;
}> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isHome = location.pathname === '/';

  return (
    <nav className="mobile-bottom-nav">
      <Link
        to="/"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          color: isHome ? 'var(--accent-primary)' : 'var(--text-secondary)',
          fontSize: '0.72rem',
          fontWeight: isHome ? 700 : 500,
          padding: '6px 12px',
        }}
      >
        <Home size={20} />
        <span>Home</span>
      </Link>

      <button
        onClick={onToggleSidebar}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          color: 'var(--text-secondary)',
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '6px 12px',
        }}
      >
        <Grid size={20} />
        <span>Categories</span>
      </button>

      <button
        onClick={toggleTheme}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          color: 'var(--text-secondary)',
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '6px 12px',
        }}
      >
        {theme === 'dark' ? <Sun size={20} style={{ color: 'var(--accent-warm)' }} /> : <Moon size={20} />}
        <span>{theme === 'dark' ? 'Cream' : 'Espresso'}</span>
      </button>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSelectCategory = (cat: GameCategory) => {
    setSelectedCategory(cat);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Collapsible Categories Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: 'clamp(14px, 3vw, 28px) clamp(12px, 3vw, 24px) clamp(60px, 10vw, 80px) clamp(12px, 3vw, 24px)',
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          transition: 'padding var(--transition-normal)',
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                searchQuery={searchQuery}
                onClearSearch={handleClearSearch}
              />
            }
          />
          <Route path="/game/:id" element={<GamePlayerPage />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onToggleSidebar={toggleSidebar} />

      {/* Global Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-main)',
          background: 'var(--bg-subtle)',
          padding: '24px 16px calc(28px + env(safe-area-inset-bottom, 0px)) 16px',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>☕</span>
          <strong style={{ color: 'var(--text-primary)' }}>Vibe Games Hub</strong>
          <span>•</span>
          <span>Crafted with Coffee & Vibe Coding</span>
        </div>
        <p style={{ fontSize: '0.8rem' }}>
          Local storage tracking • Instant browser play • Touch & mobile optimized
        </p>

        {/* Subtle GitHub Contribute Link */}
        <a
          href="https://github.com/nitishbhuvan/vibe-games"
          target="_blank"
          rel="noopener noreferrer"
          title="Contribute on GitHub"
          aria-label="Contribute on GitHub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            transition: 'all var(--transition-fast)',
            opacity: 0.85,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-main)';
            e.currentTarget.style.opacity = '0.85';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ display: 'block' }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>Contribute on GitHub</span>
        </a>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <GameStatsProvider>
        <Router>
          <AppContent />
        </Router>
      </GameStatsProvider>
    </ThemeProvider>
  );
}
