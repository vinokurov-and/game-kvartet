// Игра в архивный день или головоломку тренировки. Статистику и серию не трогает.
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DateTime } from 'luxon';

import { GameBoard } from '@/components/game-board';
import { ResultPanel, type PlayMode } from '@/components/result-panel';
import { Screen } from '@/components/screen';
import { PUZZLES } from '@/content/puzzles';
import { TRAINING } from '@/content/training';
import { showInterstitial } from '@/lib/ads';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';

/** Межстраничная реклама в тренировке — не чаще раза в 3 головоломки и не раньше второй сессии. */
const INTERSTITIAL_EVERY = 3;

export default function Play() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const num = Number(id);
  const mode: PlayMode = num >= 10000 ? 'training' : 'archive';
  const puzzle = useMemo(
    () => (mode === 'training' ? TRAINING : PUZZLES).find((x) => x.id === num) ?? null,
    [mode, num],
  );

  const games = useGameStore((s) => s.games);
  const getGame = useGameStore((s) => s.getGame);
  const saveGame = useGameStore((s) => s.saveGame);
  const finishTraining = useGameStore((s) => s.finishTraining);

  if (!puzzle) {
    return (
      <Screen title="Квартет" back>
        <Text style={[styles.text, { color: p.ink }]}>Такой головоломки нет.</Text>
      </Screen>
    );
  }

  const state = getGame(puzzle);
  const nextTraining = TRAINING.find((t) => t.id > puzzle.id && !games[t.id]);

  const title = mode === 'training' ? 'Тренировка' : `Квартет №${puzzle.id}`;
  const subtitle =
    mode === 'archive' && puzzle.date
      ? DateTime.fromISO(puzzle.date).setLocale('ru').toFormat('d MMMM')
      : undefined;

  const onNext = async () => {
    const { trainingDone, sessions } = useGameStore.getState();
    finishTraining();
    if (sessions > 1 && (trainingDone + 1) % INTERSTITIAL_EVERY === 0) await showInterstitial();
    if (nextTraining) router.replace(`/play/${nextTraining.id}`);
    else router.back();
  };

  return (
    <Screen title={title} subtitle={subtitle} back>
      <GameBoard puzzle={puzzle} state={state} onChange={(next) => saveGame(puzzle, next)} />
      {state.status !== 'playing' && (
        <ResultPanel
          puzzle={puzzle}
          state={state}
          mode={mode}
          onChange={(next) => saveGame(puzzle, next)}
          onNext={mode === 'training' ? () => void onNext() : undefined}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: FONT.body, fontSize: 15 },
});
