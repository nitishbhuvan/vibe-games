import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AllGameStats, GameMetadata, GameSessionStats } from '../games/types';

interface GameStatsContextType {
  stats: AllGameStats;
  recordPlay: (gameId: string) => void;
  updateHighScore: (gameId: string, score: number) => void;
  toggleFavorite: (gameId: string) => void;
  getGameStats: (gameId: string) => GameSessionStats;
  sortGames: (games: GameMetadata[]) => GameMetadata[];
  mostRecentGameId: string | null;
}

const STORAGE_KEY = 'vibe_game_stats_v1';

const defaultStats: GameSessionStats = {
  playCount: 0,
  lastPlayed: null,
  highScore: 0,
  isFavorite: false,
};

const GameStatsContext = createContext<GameStatsContextType | undefined>(undefined);

export const GameStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<AllGameStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save vibe game stats', e);
    }
  }, [stats]);

  const recordPlay = (gameId: string) => {
    setStats((prev) => {
      const current = prev[gameId] || { ...defaultStats };
      return {
        ...prev,
        [gameId]: {
          ...current,
          playCount: current.playCount + 1,
          lastPlayed: Date.now(),
        },
      };
    });
  };

  const updateHighScore = (gameId: string, score: number) => {
    setStats((prev) => {
      const current = prev[gameId] || { ...defaultStats };
      if (score > current.highScore) {
        return {
          ...prev,
          [gameId]: {
            ...current,
            highScore: score,
          },
        };
      }
      return prev;
    });
  };

  const toggleFavorite = (gameId: string) => {
    setStats((prev) => {
      const current = prev[gameId] || { ...defaultStats };
      return {
        ...prev,
        [gameId]: {
          ...current,
          isFavorite: !current.isFavorite,
        },
      };
    });
  };

  const getGameStats = (gameId: string): GameSessionStats => {
    return stats[gameId] || defaultStats;
  };

  // Find the single most recently played game across all games
  const mostRecentGameId = React.useMemo(() => {
    let latestId: string | null = null;
    let latestTime = 0;

    Object.entries(stats).forEach(([id, gameStat]) => {
      if (gameStat.lastPlayed && gameStat.lastPlayed > latestTime) {
        latestTime = gameStat.lastPlayed;
        latestId = id;
      }
    });

    return latestId;
  }, [stats]);

  // Vibe Games Custom Sorting Algorithm:
  // Card 1: The most recently played game.
  // Card 2+: The games played the most (playCount descending), followed by remaining unplayed games.
  const sortGames = (games: GameMetadata[]): GameMetadata[] => {
    if (games.length === 0) return [];

    // Identify if the most recent game is present in this filtered list
    const mostRecentInList = games.find((g) => g.id === mostRecentGameId && (stats[g.id]?.playCount ?? 0) > 0);

    const remainingGames = games.filter((g) => g.id !== mostRecentInList?.id);

    // Sort remaining games by play count descending, then by rating or default index
    remainingGames.sort((a, b) => {
      const aPlays = stats[a.id]?.playCount || 0;
      const bPlays = stats[b.id]?.playCount || 0;

      if (bPlays !== aPlays) {
        return bPlays - aPlays;
      }

      // Tie breaker: Favorites first, then rating
      const aFav = stats[a.id]?.isFavorite ? 1 : 0;
      const bFav = stats[b.id]?.isFavorite ? 1 : 0;
      if (bFav !== aFav) {
        return bFav - aFav;
      }

      return b.rating - a.rating;
    });

    if (mostRecentInList) {
      return [mostRecentInList, ...remainingGames];
    }

    return remainingGames;
  };

  return (
    <GameStatsContext.Provider
      value={{
        stats,
        recordPlay,
        updateHighScore,
        toggleFavorite,
        getGameStats,
        sortGames,
        mostRecentGameId,
      }}
    >
      {children}
    </GameStatsContext.Provider>
  );
};

export const useGameStats = (): GameStatsContextType => {
  const context = useContext(GameStatsContext);
  if (!context) {
    throw new Error('useGameStats must be used within a GameStatsProvider');
  }
  return context;
};
