// Проверка головоломки на корректность. Используется и скриптом контента, и тестами бандла.
import { MAX_WORD_LENGTH, type Puzzle } from './types';

export function validatePuzzle(p: Puzzle): string[] {
  const errors: string[] = [];
  if (p.groups.length !== 4) errors.push(`групп ${p.groups.length}, нужно 4`);

  const levels = new Set(p.groups.map((g) => g.level));
  if (levels.size !== 4) errors.push('уровни групп должны быть 1, 2, 3, 4 без повторов');

  const all: string[] = [];
  for (const g of p.groups) {
    if (!g.theme.trim()) errors.push(`у группы уровня ${g.level} нет темы`);
    if (g.words.length !== 4) errors.push(`в группе «${g.theme}» ${g.words.length} слов`);
    for (const w of g.words) {
      const word = w.trim();
      if (!word) errors.push(`пустое слово в «${g.theme}»`);
      if (word !== word.toUpperCase()) errors.push(`слово «${w}» не в верхнем регистре`);
      if (word.length > MAX_WORD_LENGTH) errors.push(`слово «${w}» длиннее ${MAX_WORD_LENGTH}`);
      all.push(word);
    }
  }
  const dupes = all.filter((w, i) => all.indexOf(w) !== i);
  if (dupes.length) errors.push(`повторяются слова: ${[...new Set(dupes)].join(', ')}`);
  return errors;
}
