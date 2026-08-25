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
          padding: '24px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span>☕</span>
          <strong style={{ color: 'var(--text-primary)' }}>Vibe Games Hub</strong>
          <span>•</span>
          <span>Crafted with Coffee & Vibe Coding</span>
        </div>
        <p style={{ fontSize: '0.8rem' }}>
          Local storage tracking • Instant browser play • Touch & mobile optimized
        </p>
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
