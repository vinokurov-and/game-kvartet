// Прогресс партий и статистика. Партия хранится по id квартета — незаконченная продолжится после перезапуска.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from '@/lib/storage';
import { newGame, type GameState } from './engine';
import { MAX_MISTAKES, type Puzzle } from './types';

export interface Stats {
  played: number;
  won: number;
  currentStreak: number;
  bestStreak: number;
  /** Победы по числу ошибок 0..4. */
  mistakesDist: [number, number, number, number, number];
  /** Дата последнего засчитанного ежедневного квартета (для серии). */
  lastDailyDate: string | null;
}

const EMPTY_STATS: Stats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  mistakesDist: [0, 0, 0, 0, 0],
  lastDailyDate: null,
};

interface GameStore {
  games: Record<string, GameState>;
  stats: Stats;
  /** id квартетов, уже учтённых в статистике (чтобы не засчитать дважды). */
  counted: number[];
  getGame: (puzzle: Puzzle) => GameState;
  saveGame: (puzzle: Puzzle, state: GameState) => void;
  /** Учесть завершённый ежедневный квартет в статистике и серии. */
  recordDaily: (puzzle: Puzzle & { date: string }, state: GameState) => void;
}

function dayBefore(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: {},
      stats: EMPTY_STATS,
      counted: [],
      getGame: (puzzle) => get().games[puzzle.id] ?? newGame(puzzle),
      saveGame: (puzzle, state) => set((s) => ({ games: { ...s.games, [puzzle.id]: state } })),
      recordDaily: (puzzle, state) => {
        const { counted, stats } = get();
        if (state.status === 'playing' || counted.includes(puzzle.id)) return;
        const won = state.status === 'won';
        const continues = stats.lastDailyDate === dayBefore(puzzle.date);
        const currentStreak = won ? (continues ? stats.currentStreak + 1 : 1) : 0;
        const dist = [...stats.mistakesDist] as Stats['mistakesDist'];
        if (won) dist[Math.min(state.mistakes, MAX_MISTAKES)] += 1;
        set({
          counted: [...counted, puzzle.id],
          stats: {
            played: stats.played + 1,
            won: stats.won + (won ? 1 : 0),
            currentStreak,
            bestStreak: Math.max(stats.bestStreak, currentStreak),
            mistakesDist: dist,
            lastDailyDate: puzzle.date,
          },
        });
      },
    }),
    { name: 'kvartet-game', storage: createJSONStorage(() => kvStorage), version: 1 },
  ),
);
