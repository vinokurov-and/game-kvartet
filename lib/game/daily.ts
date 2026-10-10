// «Какой квартет сегодня»: новый выходит в 10:00 по Москве для всех, независимо от часового пояса устройства.
import { DateTime } from 'luxon';

import type { Puzzle } from './types';

const ZONE = 'Europe/Moscow';
const RELEASE_HOUR = 10;

/** Дата текущего квартета `YYYY-MM-DD`: до 10:00 МСК — ещё вчерашний. */
export function currentPuzzleDate(now: Date = new Date()): string {
  const msk = DateTime.fromJSDate(now).setZone(ZONE);
  const day = msk.hour < RELEASE_HOUR ? msk.minus({ days: 1 }) : msk;
  return day.toISODate() as string;
}

/** Миллисекунды до выхода следующего квартета. */
export function msUntilNext(now: Date = new Date()): number {
  const msk = DateTime.fromJSDate(now).setZone(ZONE);
  let next = msk.set({ hour: RELEASE_HOUR, minute: 0, second: 0, millisecond: 0 });
  if (next <= msk) next = next.plus({ days: 1 });
  return next.toMillis() - msk.toMillis();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Квартет на дату или null (контент кончился / дата раньше запуска). */
export function puzzleForDate(puzzles: readonly Puzzle[], date: string): Puzzle | null {
  return puzzles.find((p) => p.date === date) ?? null;
}

/** Архив: вышедшие квартеты до текущего включительно, новые сверху. */
export function releasedPuzzles(
  puzzles: readonly Puzzle[],
  now: Date = new Date(),
): (Puzzle & { date: string })[] {
  const today = currentPuzzleDate(now);
  return puzzles
    .filter((p): p is Puzzle & { date: string } => !!p.date && p.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Бесплатен ли архивный день: текущий и 3 предыдущих (спека 2.4). */
export function isFreeArchiveDay(date: string, now: Date = new Date()): boolean {
  const today = DateTime.fromISO(currentPuzzleDate(now), { zone: ZONE });
  const d = DateTime.fromISO(date, { zone: ZONE });
  const diff = today.diff(d, 'days').days;
  return diff >= 0 && diff <= 3;
}
