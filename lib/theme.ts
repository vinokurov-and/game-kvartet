// Дизайн-токены «необрутализма» (спека, раздел 2.8). Плоские цвета, толстая обводка, жёсткая тень.
import { useColorScheme } from 'react-native';

export type GroupLevel = 1 | 2 | 3 | 4;

export interface Palette {
  bg: string;
  surface: string;
  ink: string;
  inkOnInk: string;
  muted: string;
  accent: string;
  groups: Record<GroupLevel, string>;
  /** Текст на цветной плашке группы — всегда тёмный, цвета групп светлые в обеих темах. */
  onGroup: string;
}

const GROUPS: Record<GroupLevel, string> = {
  1: '#FFD23F',
  2: '#3DDC97',
  3: '#4D96FF',
  4: '#FF6B9A',
};

export const LIGHT: Palette = {
  bg: '#FFF6E5',
  surface: '#FFFFFF',
  ink: '#111111',
  inkOnInk: '#FFF6E5',
  muted: '#5C574D',
  accent: '#FFD23F',
  groups: GROUPS,
  onGroup: '#111111',
};

export const DARK: Palette = {
  bg: '#161513',
  surface: '#22201C',
  ink: '#F4EBDA',
  inkOnInk: '#161513',
  muted: '#A79F8F',
  accent: '#FFD23F',
  groups: GROUPS,
  onGroup: '#111111',
};

export const BORDER = 2.5;
export const RADIUS = 10;
export const SHADOW = 3;
/** Сдвиг «вдавленного» элемента: тень почти исчезает. */
export const PRESSED = 2;

export const FONT = {
  display: 'Unbounded_800ExtraBold',
  displayBold: 'Unbounded_700Bold',
  body: 'Onest_500Medium',
  bodySemi: 'Onest_600SemiBold',
  bodyBold: 'Onest_700Bold',
} as const;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? DARK : LIGHT;
}
