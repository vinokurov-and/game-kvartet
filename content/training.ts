// Головоломки тренировки (id ≥ 10000). Источник — content/generated.ts.
import { TRAINING as DATA } from '@/content/generated';
import { decode } from '@/lib/game/codec';
import type { Puzzle } from '@/lib/game/types';

export const TRAINING: Puzzle[] = JSON.parse(decode(DATA)) as Puzzle[];
