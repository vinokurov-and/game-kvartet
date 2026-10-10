// Прогресс партий и статистика. Партия хранится по id квартета — незаконченная продолжится после перезапуска.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from '@/lib/storage';
import { matchesPuzzle, newGame, withDefaults, type GameState } from './engine';
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
  /** Число запусков приложения — первая сессия без рекламы. */
  sessions: number;
  startSession: () => void;
  games: Record<string, GameState>;
  stats: Stats;
  /** id квартетов, уже учтённых в статистике (чтобы не засчитать дважды). */
  counted: number[];
  getGame: (puzzle: Puzzle) => GameState;
  saveGame: (puzzle: Puzzle, state: GameState) => void;
  /** Учесть завершённый ежедневный квартет в статистике и серии. */
  recordDaily: (puzzle: Puzzle & { date: string }, state: GameState) => void;
  /** Архивные дни, открытые за рекламу. */
  unlocked: number[];
  unlock: (id: number) => void;
  /** Сыгранные головоломки тренировки — для частоты межстраничной рекламы. */
  trainingDone: number;
  finishTraining: () => void;
  seenHowTo: boolean;
  setSeenHowTo: () => void;
  haptics: boolean;
  setHaptics: (on: boolean) => void;
}

function dayBefore(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      sessions: 0,
      startSession: () => set((s) => ({ sessions: s.sessions + 1 })),
      games: {},
      stats: EMPTY_STATS,
      counted: [],
      unlocked: [],
      unlock: (id) => set((s) => ({ unlocked: [...new Set([...s.unlocked, id])] })),
      trainingDone: 0,
      finishTraining: () => set((s) => ({ trainingDone: s.trainingDone + 1 })),
      seenHowTo: false,
      setSeenHowTo: () => set({ seenHowTo: true }),
      haptics: true,
      setHaptics: (on) => set({ haptics: on }),
      getGame: (puzzle) => {
        const saved = get().games[puzzle.id];
        if (!saved) return newGame(puzzle);
        const state = withDefaults(saved);
        return matchesPuzzle(puzzle, state) ? state : newGame(puzzle);
      },
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
