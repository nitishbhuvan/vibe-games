import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { GameStatsProvider } from './context/GameStatsContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { GamePlayerPage } from './pages/GamePlayerPage';
import type { GameCategory } from './games/types';

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
          padding: '28px 24px 60px 24px',
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

      {/* Global Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-main)',
          background: 'var(--bg-subtle)',
          padding: '24px',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span>☕</span>
          <strong style={{ color: 'var(--text-primary)' }}>Vibe Games Hub</strong>
          <span>•</span>
          <span>Crafted with Coffee & Vibe Coding</span>
        </div>
        <p style={{ fontSize: '0.8rem' }}>
          Local storage tracking • Instant browser play • Modular Python & React architecture
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
