import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  deselectAll,
  grantExtraLives,
  newGame,
  remainingGroups,
  shuffled,
  submit,
  toggle,
  type GameState,
} from './engine';
import {
  currentPuzzleDate,
  formatCountdown,
  isFreeArchiveDay,
  msUntilNext,
  releasedPuzzles,
} from './daily';
import { validatePuzzle } from './validate';
import type { Puzzle } from './types';

const P: Puzzle = {
  id: 1,
  date: '2026-11-15',
  groups: [
    { level: 1, theme: 'Пьесы Чехова', words: ['ЧАЙКА', 'ИВАНОВ', 'ДЯДЯ ВАНЯ', 'ТРИ СЕСТРЫ'] },
    { level: 2, theme: '___ слово', words: ['ЧЕСТНОЕ', 'КРЕПКОЕ', 'ПОСЛЕДНЕЕ', 'ВВОДНОЕ'] },
    { level: 3, theme: 'Птицы', words: ['ВОРОНА', 'СИНИЦА', 'ГРАЧ', 'СОКОЛ'] },
    { level: 4, theme: 'Скрытые числа', words: ['СТОЛБ', 'ТРИУМФ', 'ПЯТНО', 'СЕМЬЯ'] },
  ],
};

const pick = (s: GameState, words: string[]) => words.reduce(toggle, deselectAll(s));

test('валидатор: корректная головоломка без ошибок', () => {
  assert.deepEqual(validatePuzzle(P), []);
});

test('валидатор: дубли и нижний регистр', () => {
  const bad: Puzzle = {
    ...P,
    groups: [
      P.groups[0],
      { ...P.groups[1], words: ['ЧАЙКА', 'КРЕПКОЕ', 'последнее', 'ВВОДНОЕ'] },
      P.groups[2],
      P.groups[3],
    ],
  };
  const errs = validatePuzzle(bad);
  assert.ok(errs.some((e) => e.includes('повторяются')));
  assert.ok(errs.some((e) => e.includes('верхнем регистре')));
});

test('раскладка детерминирована и содержит все 16 слов', () => {
  const a = newGame(P).board;
  const b = newGame(P).board;
  assert.deepEqual(a, b);
  assert.equal(new Set(a).size, 16);
  assert.notDeepEqual(shuffled(a, 1), shuffled(a, 2));
});

test('выбор: не больше 4, повторный тап снимает', () => {
  let s = newGame(P);
  s = pick(s, ['ЧАЙКА', 'ГРАЧ', 'СТОЛБ', 'ПЯТНО', 'СЕМЬЯ']);
  assert.equal(s.selected.length, 4);
  s = toggle(s, 'ГРАЧ');
  assert.equal(s.selected.length, 3);
});

test('верная группа схлопывается', () => {
  const { state, result } = submit(P, pick(newGame(P), ['ВОРОНА', 'СИНИЦА', 'ГРАЧ', 'СОКОЛ']));
  assert.equal(result, 'correct');
  assert.deepEqual(state.solved, [3]);
  assert.equal(state.board.length, 12);
  assert.equal(state.mistakes, 0);
});

test('«почти» — 3 из 4, ошибка засчитывается; повтор той же четвёрки — нет', () => {
  const s0 = pick(newGame(P), ['ВОРОНА', 'СИНИЦА', 'ГРАЧ', 'ЧАЙКА']);
  const r1 = submit(P, s0);
  assert.equal(r1.result, 'one-away');
  assert.equal(r1.state.mistakes, 1);
  const r2 = submit(P, pick(r1.state, ['ЧАЙКА', 'ГРАЧ', 'СИНИЦА', 'ВОРОНА']));
  assert.equal(r2.result, 'repeat');
  assert.equal(r2.state.mistakes, 1);
});

test('4 ошибки — поражение, +4 жизни возвращают в игру', () => {
  let s = newGame(P);
  const wrongs = [
    ['ЧАЙКА', 'ЧЕСТНОЕ', 'ВОРОНА', 'СТОЛБ'],
    ['ИВАНОВ', 'КРЕПКОЕ', 'СИНИЦА', 'ТРИУМФ'],
    ['ДЯДЯ ВАНЯ', 'ПОСЛЕДНЕЕ', 'ГРАЧ', 'ПЯТНО'],
    ['ТРИ СЕСТРЫ', 'ВВОДНОЕ', 'СОКОЛ', 'СЕМЬЯ'],
  ];
  for (const w of wrongs) s = submit(P, pick(s, w)).state;
  assert.equal(s.status, 'lost');
  assert.equal(remainingGroups(P, s).length, 4);
  s = grantExtraLives(s);
  assert.equal(s.status, 'playing');
  assert.equal(s.mistakes, 0);
});

test('победа после 4 групп, история попыток для шеринга', () => {
  let s = newGame(P);
  for (const g of P.groups) s = submit(P, pick(s, [...g.words])).state;
  assert.equal(s.status, 'won');
  assert.deepEqual(s.guesses, [
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    [3, 3, 3, 3],
    [4, 4, 4, 4],
  ]);
});

test('дата квартета: смена в 10:00 МСК', () => {
  assert.equal(currentPuzzleDate(new Date('2026-11-15T06:59:00Z')), '2026-11-14'); // 09:59 МСК
  assert.equal(currentPuzzleDate(new Date('2026-11-15T07:00:00Z')), '2026-11-15'); // 10:00 МСК
  assert.equal(msUntilNext(new Date('2026-11-15T06:00:00Z')), 60 * 60 * 1000);
  assert.equal(formatCountdown(3_723_000), '01:02:03');
});

test('архив: только вышедшие, бесплатны текущий и 3 предыдущих', () => {
  const now = new Date('2026-11-20T08:00:00Z'); // 11:00 МСК 20-го
  const list = releasedPuzzles(
    [
      { ...P, id: 1, date: '2026-11-15' },
      { ...P, id: 2, date: '2026-11-20' },
      { ...P, id: 3, date: '2026-11-21' },
    ],
    now,
  );
  assert.deepEqual(
    list.map((p) => p.id),
    [2, 1],
  );
  assert.equal(isFreeArchiveDay('2026-11-17', now), true);
  assert.equal(isFreeArchiveDay('2026-11-16', now), false);
});

test('подсказки: тема самой лёгкой группы, затем 2 слова, затем следующая группа', async () => {
  const { nextHint, canHint } = await import('./engine');
  let s = newGame(P);
  s = nextHint(P, s);
  assert.deepEqual(s.hintThemes, [1]);
  s = nextHint(P, nextHint(P, s));
  assert.deepEqual(s.hintWords, ['ЧАЙКА', 'ИВАНОВ']);
  assert.equal(canHint(P, s), false);
  s = submit(P, pick(s, [...P.groups[0].words])).state;
  assert.equal(canHint(P, s), true);
  s = nextHint(P, s);
  assert.deepEqual(s.hintThemes, [1, 2]);
});
