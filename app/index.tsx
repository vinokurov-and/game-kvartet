// Квартет дня: шапка с навигацией, игровое поле, после завершения — итог.
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DateTime } from 'luxon';

import { GameBoard } from '@/components/game-board';
import { HowToBody } from '@/components/how-to-body';
import { ResultPanel } from '@/components/result-panel';
import { HeaderLink, Screen } from '@/components/screen';
import { PUZZLES } from '@/content/puzzles';
import { currentPuzzleDate, puzzleForDate } from '@/lib/game/daily';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';

export default function Today() {
  const p = usePalette();
  const router = useRouter();
  const [date, setDate] = useState(currentPuzzleDate);
  const puzzle = useMemo(() => puzzleForDate(PUZZLES, date), [date]);

  // Квартет сменяется в 10:00 МСК — проверяем раз в минуту, пока экран открыт.
  useEffect(() => {
    const t = setInterval(() => setDate(currentPuzzleDate()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Первый запуск — сразу правила.
  const seenHowTo = useGameStore((s) => s.seenHowTo);
  const [hydrated, setHydrated] = useState(useGameStore.persist.hasHydrated());
  useEffect(() => useGameStore.persist.onFinishHydration(() => setHydrated(true)), []);

  const games = useGameStore((s) => s.games);
  const saveGame = useGameStore((s) => s.saveGame);
  const recordDaily = useGameStore((s) => s.recordDaily);
  const getGame = useGameStore((s) => s.getGame);
  // Только через getGame: он достраивает сохранения старых версий (иначе новые поля undefined → падение).
  const state = puzzle && games ? getGame(puzzle) : null;

  // Правила показываем на месте, без навигации: при старте корневой навигатор может быть ещё не смонтирован.
  if (hydrated && !seenHowTo) return <HowToBody onDone={() => {}} />;

  const pretty = DateTime.fromISO(date).setLocale('ru').toFormat('d MMMM');

  return (
    <Screen
      title="Квартет"
      subtitle={puzzle ? `№${puzzle.id} · ${pretty}` : pretty}
      right={
        <View style={styles.nav}>
          <HeaderLink label="?" onPress={() => router.push('/how-to')} />
          <HeaderLink label="Меню" onPress={() => router.push('/settings')} />
        </View>
      }
    >
      <View style={styles.links}>
        <HeaderLink label="Архив" onPress={() => router.push('/archive')} />
        <HeaderLink label="Тренировка" onPress={() => router.push('/training')} />
      </View>

      {!puzzle || !state ? (
        <Text style={[styles.hint, { color: p.ink }]}>
          Сегодняшний квартет ещё готовится. Загляни чуть позже.
        </Text>
      ) : (
        <>
          {state.status === 'playing' && (
            <Text style={[styles.hint, { color: p.ink }]}>Найди 4 группы по 4 слова</Text>
          )}
          <GameBoard
            puzzle={puzzle}
            state={state}
            onChange={(next) => {
              saveGame(puzzle, next);
              if (next.status !== 'playing' && puzzle.date) {
                recordDaily({ ...puzzle, date: puzzle.date }, next);
              }
            }}
          />
          {state.status !== 'playing' && (
            <ResultPanel
              puzzle={puzzle}
              state={state}
              mode="daily"
              onChange={(next) => saveGame(puzzle, next)}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', gap: 8 },
  links: { flexDirection: 'row', gap: 8 },
  hint: { fontFamily: FONT.bodySemi, fontSize: 15 },
});
