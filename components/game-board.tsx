// Игровое поле: разгаданные группы сверху, сетка оставшихся слов, ошибки и кнопки.
// Вся логика — в lib/game/engine; здесь только отрисовка, анимации и тактильный отклик.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrutalButton, GroupBar, Tile } from '@/components/brutal';
import {
  canHint,
  deselectAll,
  hintTarget,
  levelOf,
  nextHint,
  remainingGroups,
  shuffleBoard,
  submit,
  toggle,
  type GameState,
  type GuessResult,
} from '@/lib/game/engine';
import { MAX_MISTAKES, type Puzzle } from '@/lib/game/types';
import { haptic } from '@/lib/haptics';
import { BORDER, FONT, usePalette } from '@/lib/theme';
import { useReward } from '@/lib/use-reward';

const MESSAGES: Partial<Record<GuessResult, string>> = {
  'one-away': 'Почти! Одно слово лишнее',
  wrong: 'Не то',
  repeat: 'Эту четвёрку уже пробовали',
};

interface Props {
  puzzle: Puzzle;
  state: GameState;
  onChange: (next: GameState) => void;
}

export function GameBoard({ puzzle, state, onChange }: Props) {
  const p = usePalette();
  const reduced = useReducedMotion();
  const shake = useSharedValue(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const reward = useReward();
  const target = hintTarget(puzzle, state);
  const hintTheme = target && state.hintThemes.includes(target.level) ? target.theme : null;

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const layout = reduced ? undefined : LinearTransition.springify().damping(18);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  const onSubmit = () => {
    const { state: next, result } = submit(puzzle, state);
    if (result === 'correct') {
      haptic.success();
    } else {
      haptic.error();
      if (!reduced && result !== 'repeat') {
        shake.value = withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
      }
      const msg = MESSAGES[result];
      if (msg) showToast(msg);
    }
    onChange(next);
  };

  const solvedGroups = state.solved.map((lvl) => puzzle.groups.find((g) => g.level === lvl)!);
  const revealed = state.status === 'lost' ? remainingGroups(puzzle, state) : [];

  return (
    <View style={styles.root}>
      <View style={styles.groups}>
        {[...solvedGroups, ...revealed].map((g) => (
          <Animated.View
            key={g.level}
            entering={reduced ? undefined : ZoomIn.springify()}
            layout={layout}
          >
            <GroupBar level={g.level} theme={g.theme} words={g.words} />
          </Animated.View>
        ))}
      </View>

      {state.status === 'playing' && (
        <Animated.View style={[styles.board, shakeStyle]}>
          {state.board.map((w) => (
            <Animated.View key={w} layout={layout} style={styles.cell}>
              <Tile
                word={w}
                selected={state.selected.includes(w)}
                hint={state.hintWords.includes(w) ? p.groups[levelOf(puzzle, w)] : undefined}
                onPress={() => onChange(toggle(state, w))}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {state.status === 'playing' && (
        <>
          <View style={styles.mistakes}>
            <Text style={[styles.mistakesLabel, { color: p.ink }]}>Ошибки:</Text>
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    borderColor: p.ink,
                    backgroundColor:
                      i < MAX_MISTAKES - state.mistakes ? p.groups[4] : 'transparent',
                  },
                ]}
              />
            ))}
          </View>
          {hintTheme && (
            <Text style={[styles.hintTheme, { color: p.ink }]}>
              Подсказка: одна из групп — «{hintTheme}»
            </Text>
          )}
          <Text style={[styles.toast, { color: p.ink, opacity: toast ? 1 : 0 }]}>
            {toast ?? ' '}
          </Text>
          <View style={styles.actions}>
            <BrutalButton
              label="Перемешать"
              onPress={() => onChange(shuffleBoard(state, Date.now()))}
              style={styles.flex}
            />
            <BrutalButton
              label="Снять"
              disabled={state.selected.length === 0}
              onPress={() => onChange(deselectAll(state))}
              style={styles.flex}
            />
            <BrutalButton
              label="Проверить"
              primary
              disabled={state.selected.length !== 4}
              onPress={onSubmit}
              style={styles.flex}
            />
          </View>
          <BrutalButton
            label={
              reward.busy
                ? 'Загружаем рекламу…'
                : reward.free
                  ? 'Подсказка'
                  : 'Подсказка за рекламу'
            }
            disabled={!canHint(puzzle, state) || reward.busy}
            onPress={() => void reward.run(() => onChange(nextHint(puzzle, state)))}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  groups: { gap: 6 },
  board: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  cell: { width: '25%' },
  mistakes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  mistakesLabel: { fontFamily: FONT.bodySemi, fontSize: 14 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: BORDER - 0.5 },
  hintTheme: { fontFamily: FONT.bodySemi, fontSize: 14, textAlign: 'center' },
  toast: { fontFamily: FONT.bodyBold, fontSize: 15, textAlign: 'center', minHeight: 20 },
  actions: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
