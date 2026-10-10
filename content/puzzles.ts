// Квартеты дня. Источник — content/generated.ts (обфусцирован), собирается scripts/build-content.ts.
import { DAILY } from '@/content/generated';
import { decode } from '@/lib/game/codec';
import type { Puzzle } from '@/lib/game/types';

export const PUZZLES: Puzzle[] = JSON.parse(decode(DAILY)) as Puzzle[];
