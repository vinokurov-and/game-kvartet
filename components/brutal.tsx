// Базовые элементы необрутализма: коробка с обводкой и жёсткой тенью, кнопка, плитка слова, плашка группы.
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { BORDER, FONT, PRESSED, RADIUS, SHADOW, usePalette, type GroupLevel } from '@/lib/theme';

interface BoxProps {
  children: ReactNode;
  fill?: string;
  /** «Вдавлен» постоянно (выбранная плитка). */
  sunk?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Коробка: тень — отдельный слой со сдвигом, контент поверх; при `sunk` контент сдвигается к тени. */
export function BrutalBox({ children, fill, sunk = false, style, contentStyle }: BoxProps) {
  const p = usePalette();
  const shift = sunk ? PRESSED : 0;
  return (
    <View style={[{ paddingRight: SHADOW, paddingBottom: SHADOW }, style]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { top: SHADOW, left: SHADOW, backgroundColor: p.ink, borderRadius: RADIUS },
        ]}
      />
      <View
        style={[
          {
            // flexGrow, а не flex: 1 — на iOS flex: 1 (basis 0) схлопывает коробку до нуля, если родитель
            // не растянут (кнопка, плашка группы). Плитка растягивается своим style={flex: 1}.
            flexGrow: 1,
            backgroundColor: fill ?? p.surface,
            borderColor: p.ink,
            borderWidth: BORDER,
            borderRadius: RADIUS,
            transform: [{ translateX: shift }, { translateY: shift }],
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BrutalButton({
  label,
  onPress,
  primary = false,
  disabled = false,
  style,
}: ButtonProps) {
  const p = usePalette();
  const [down, setDown] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <BrutalBox
        fill={primary ? p.accent : p.surface}
        sunk={down}
        contentStyle={styles.buttonContent}
      >
        <Text style={[styles.buttonLabel, { color: primary ? '#111111' : p.ink }]}>{label}</Text>
      </BrutalBox>
    </Pressable>
  );
}

interface TileProps {
  word: string;
  selected: boolean;
  onPress: () => void;
}

export function Tile({ word, selected, onPress }: TileProps) {
  const p = usePalette();
  const long = word.length > 7;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={word}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={styles.tileWrap}
    >
      <BrutalBox
        fill={selected ? p.ink : p.surface}
        sunk={selected}
        style={styles.flex}
        contentStyle={styles.tileContent}
      >
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[
            styles.tileText,
            { color: selected ? p.inkOnInk : p.ink, fontSize: long ? 11 : 13 },
          ]}
        >
          {word}
        </Text>
      </BrutalBox>
    </Pressable>
  );
}

interface GroupBarProps {
  level: GroupLevel;
  theme: string;
  words: readonly string[];
}

export function GroupBar({ level, theme, words }: GroupBarProps) {
  const p = usePalette();
  return (
    <BrutalBox fill={p.groups[level]} contentStyle={styles.groupContent}>
      <Text style={[styles.groupTheme, { color: p.onGroup }]}>{theme.toUpperCase()}</Text>
      <Text style={[styles.groupWords, { color: p.onGroup }]}>{words.join(' · ')}</Text>
    </BrutalBox>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  buttonContent: { paddingVertical: 13, paddingHorizontal: 10, alignItems: 'center' },
  buttonLabel: { fontFamily: FONT.bodyBold, fontSize: 15 },
  tileWrap: { width: '100%', aspectRatio: 1 / 0.92, padding: 3 },
  tileContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tileText: { fontFamily: FONT.bodyBold, textAlign: 'center', letterSpacing: 0.2 },
  groupContent: { paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', gap: 3 },
  groupTheme: { fontFamily: FONT.bodyBold, fontSize: 13, letterSpacing: 0.8 },
  groupWords: { fontFamily: FONT.body, fontSize: 13, textAlign: 'center' },
});
