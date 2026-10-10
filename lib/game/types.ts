import type { GroupLevel } from '@/lib/theme';

export interface Group {
  level: GroupLevel;
  theme: string;
  words: readonly [string, string, string, string];
}

export interface Puzzle {
  /** Порядковый номер квартета (№ в шаринге). */
  id: number;
  /** Дата публикации по МСК, `YYYY-MM-DD`. Для наборов тренировки — отсутствует. */
  date?: string;
  groups: readonly [Group, Group, Group, Group];
}

export const MAX_MISTAKES = 4;
export const MAX_WORD_LENGTH = 12;
