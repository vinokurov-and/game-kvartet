// Движок партии: чистые функции над неизменяемым состоянием. UI только вызывает их и рисует результат.
import type { GroupLevel } from '@/lib/theme';
import { MAX_MISTAKES, type Puzzle } from './types';

export type GuessResult = 'correct' | 'one-away' | 'wrong' | 'repeat';

export interface GameState {
  /** Неразгаданные слова в порядке показа. */
  board: string[];
  selected: string[];
  /** Уровни разгаданных групп в порядке разгадывания. */
  solved: GroupLevel[];
  mistakes: number;
  /** История попыток — уровни групп выбранных слов (для сетки шеринга). */
  guesses: GroupLevel[][];
  /** Те же попытки словами — чтобы не засчитать ошибку за повтор уже проверенной четвёрки. */
  attempts: string[][];
  /** Подсказки: открытые темы групп и открытые слова. */
  hintThemes: GroupLevel[];
  hintWords: string[];
  /** Брал «+4 попытки» после поражения — в статистике партия остаётся проигранной. */
  continued?: boolean;
  status: 'playing' | 'won' | 'lost';
}

/** Сколько слов группы можно открыть подсказками (четвёртое игрок находит сам). */
export const MAX_HINT_WORDS = 2;

export function levelOf(puzzle: Puzzle, word: string): GroupLevel {
  const g = puzzle.groups.find((x) => x.words.includes(word));
  if (!g) throw new Error(`слово «${word}» не из этой головоломки`);
  return g.level;
}

/** Детерминированный PRNG (mulberry32) — одинаковая раскладка у всех игроков дня. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newGame(puzzle: Puzzle): GameState {
  const words = puzzle.groups.flatMap((g) => g.words);
  return {
    board: shuffled(words, puzzle.id * 7919),
    selected: [],
    solved: [],
    mistakes: 0,
    guesses: [],
    attempts: [],
    hintThemes: [],
    hintWords: [],
    status: 'playing',
  };
}

/** Сохранённые партии старых версий — без новых полей. */
export function withDefaults(state: GameState): GameState {
  return { ...state, hintThemes: state.hintThemes ?? [], hintWords: state.hintWords ?? [] };
}

/** Группа, к которой относится следующая подсказка: самая лёгкая неразгаданная. */
export function hintTarget(puzzle: Puzzle, state: GameState) {
  return (
    puzzle.groups
      .filter((g) => !state.solved.includes(g.level))
      .sort((a, b) => a.level - b.level)[0] ?? null
  );
}

/** Есть ли что подсказать. */
export function canHint(puzzle: Puzzle, state: GameState): boolean {
  return state.status === 'playing' && nextHint(puzzle, state) !== state;
}

/** Следующая подсказка: сначала тема целевой группы, затем по одному её слову (до MAX_HINT_WORDS). */
export function nextHint(puzzle: Puzzle, state: GameState): GameState {
  const g = hintTarget(puzzle, state);
  if (!g || state.status !== 'playing') return state;
  if (!state.hintThemes.includes(g.level)) {
    return { ...state, hintThemes: [...state.hintThemes, g.level] };
  }
  const open = g.words.filter((w) => state.hintWords.includes(w));
  if (open.length >= MAX_HINT_WORDS) return state;
  const word = g.words.find((w) => !state.hintWords.includes(w));
  return word ? { ...state, hintWords: [...state.hintWords, word] } : state;
}

export function toggle(state: GameState, word: string): GameState {
  if (state.status !== 'playing' || !state.board.includes(word)) return state;
  if (state.selected.includes(word)) {
    return { ...state, selected: state.selected.filter((w) => w !== word) };
  }
  if (state.selected.length >= 4) return state;
  return { ...state, selected: [...state.selected, word] };
}

export function deselectAll(state: GameState): GameState {
  return { ...state, selected: [] };
}

export function shuffleBoard(state: GameState, seed: number): GameState {
  return { ...state, board: shuffled(state.board, seed) };
}

const key = (words: readonly string[]) => [...words].sort().join('|');

export function submit(
  puzzle: Puzzle,
  state: GameState,
): { state: GameState; result: GuessResult } {
  if (state.status !== 'playing' || state.selected.length !== 4) return { state, result: 'repeat' };

  const levels = state.selected.map((w) => levelOf(puzzle, w));
  const attempt = key(state.selected);
  if (state.attempts.some((a) => key(a) === attempt)) return { state, result: 'repeat' };

  const counts = new Map<GroupLevel, number>();
  for (const l of levels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const best = Math.max(...counts.values());
  const attempts = [...state.attempts, [...state.selected]];

  if (best === 4) {
    const level = levels[0];
    const solved = [...state.solved, level];
    const board = state.board.filter((w) => !state.selected.includes(w));
    return {
      result: 'correct',
      state: {
        ...state,
        board,
        selected: [],
        solved,
        guesses: [...state.guesses, levels],
        attempts,
        status: solved.length === 4 ? 'won' : 'playing',
      },
    };
  }

  const mistakes = state.mistakes + 1;
  return {
    result: best === 3 ? 'one-away' : 'wrong',
    state: {
      ...state,
      mistakes,
      guesses: [...state.guesses, levels],
      attempts,
      status: mistakes >= MAX_MISTAKES ? 'lost' : 'playing',
    },
  };
}

/** Rewarded «+4 ошибки» после проигрыша. */
export function grantExtraLives(state: GameState): GameState {
  if (state.status !== 'lost') return state;
  return { ...state, mistakes: 0, continued: true, status: 'playing' };
}

/** Раскрыть неразгаданные группы (после поражения) — по возрастанию сложности. */
export function remainingGroups(puzzle: Puzzle, state: GameState) {
  return puzzle.groups
    .filter((g) => !state.solved.includes(g.level))
    .sort((a, b) => a.level - b.level);
}
