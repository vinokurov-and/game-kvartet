// Сборка контента: content/source/{daily,training}.json (вне git) → content/generated.ts (обфусцировано, в git).
// Проверяет каждую головоломку валидатором и повторы слов в окне 30 дней.
//   npx tsx scripts/build-content.ts            — собрать
//   npx tsx scripts/build-content.ts --decode   — восстановить исходники из generated.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { decode, encode } from '../lib/game/codec';
import type { Puzzle } from '../lib/game/types';
import { validatePuzzle } from '../lib/game/validate';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'content/source');
const OUT = join(ROOT, 'content/generated.ts');
/** Дата первого квартета (№1). */
const START = '2026-10-10';
const REPEAT_WINDOW = 30;

type Raw = Pick<Puzzle, 'groups'>;

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function check(list: Puzzle[], label: string): string[] {
  const errors: string[] = [];
  list.forEach((p, i) => {
    for (const e of validatePuzzle(p)) errors.push(`${label} №${p.id}: ${e}`);
    const words = new Set(p.groups.flatMap((g) => g.words));
    for (let j = Math.max(0, i - REPEAT_WINDOW); j < i; j++) {
      const rep = list[j].groups.flatMap((g) => g.words).filter((w) => words.has(w));
      if (rep.length) errors.push(`${label} №${p.id}: повтор с №${list[j].id}: ${rep.join(', ')}`);
    }
  });
  return errors;
}

if (process.argv.includes('--decode')) {
  const text = readFileSync(OUT, 'utf8');
  const pick = (name: string) => {
    const m = text.match(new RegExp(`${name} = '([^']*)'`));
    return JSON.parse(decode(m?.[1] ?? '')) as Puzzle[];
  };
  if (!existsSync(SRC)) mkdirSync(SRC, { recursive: true });
  const strip = (l: Puzzle[]) => l.map((p) => ({ groups: p.groups }));
  writeFileSync(join(SRC, 'daily.json'), JSON.stringify(strip(pick('DAILY')), null, 1));
  writeFileSync(join(SRC, 'training.json'), JSON.stringify(strip(pick('TRAINING')), null, 1));
  console.log('исходники восстановлены в content/source/');
  process.exit(0);
}

const daily: Puzzle[] = (JSON.parse(readFileSync(join(SRC, 'daily.json'), 'utf8')) as Raw[]).map(
  (r, i) => ({ id: i + 1, date: addDays(START, i), groups: r.groups }),
);
const training: Puzzle[] = (
  JSON.parse(readFileSync(join(SRC, 'training.json'), 'utf8')) as Raw[]
).map((r, i) => ({ id: 10001 + i, groups: r.groups }));

const errors = [...check(daily, 'день'), ...check(training, 'тренировка')];
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

writeFileSync(
  OUT,
  [
    '// СГЕНЕРИРОВАНО scripts/build-content.ts — не править руками. Обфусцировано (lib/game/codec.ts).',
    `export const DAILY = '${encode(JSON.stringify(daily))}';`,
    `export const TRAINING = '${encode(JSON.stringify(training))}';`,
    '',
  ].join('\n'),
);
console.log(
  `дней: ${daily.length} (${daily[0]?.date} … ${daily.at(-1)?.date}), тренировка: ${training.length}`,
);
