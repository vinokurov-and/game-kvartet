// Текст для шеринга — без слов и тем, только цвета попыток (как сетка у Wordle).
import type { GroupLevel } from '@/lib/theme';
import type { GameState } from './engine';
import type { Puzzle } from './types';

const EMOJI: Record<GroupLevel, string> = { 1: '🟨', 2: '🟩', 3: '🟦', 4: '🟪' };

export function shareText(puzzle: Puzzle, state: GameState): string {
  const head =
    state.status === 'won'
      ? `Квартет №${puzzle.id} — ошибок: ${state.mistakes}`
      : `Квартет №${puzzle.id} — не разгадан`;
  const rows = state.guesses.map((row) => row.map((l) => EMOJI[l]).join(''));
  return [head, ...rows, '', 'Сыграй тоже: «Квартет» в App Store'].join('\n');
}
