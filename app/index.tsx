// Квартет дня: шапка, игровое поле, после завершения — итог.
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';

import { GameBoard } from '@/components/game-board';
import { ResultPanel } from '@/components/result-panel';
import { PUZZLES } from '@/content/puzzles';
import { currentPuzzleDate, puzzleForDate } from '@/lib/game/daily';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';

export default function Today() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(currentPuzzleDate);
  const puzzle = useMemo(() => puzzleForDate(PUZZLES, date), [date]);

  // Квартет сменяется в 10:00 МСК — проверяем раз в минуту, пока экран открыт.
  useEffect(() => {
    const t = setInterval(() => setDate(currentPuzzleDate()), 60_000);
    return () => clearInterval(t);
  }, []);

  const games = useGameStore((s) => s.games);
  const saveGame = useGameStore((s) => s.saveGame);
  const recordDaily = useGameStore((s) => s.recordDaily);
  const getGame = useGameStore((s) => s.getGame);
  const state = puzzle ? (games[puzzle.id] ?? getGame(puzzle)) : null;

  const pretty = DateTime.fromISO(date).setLocale('ru').toFormat('d MMMM');

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={[
        styles.root,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.logo, { color: p.ink }]}>Квартет</Text>
        <Text style={[styles.meta, { color: p.muted }]}>
          {puzzle ? `№${puzzle.id} · ${pretty}` : pretty}
        </Text>
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
          {state.status !== 'playing' && <ResultPanel puzzle={puzzle} state={state} />}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 16, gap: 12, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  logo: { fontFamily: FONT.display, fontSize: 26 },
  meta: { fontFamily: FONT.body, fontSize: 13 },
  hint: { fontFamily: FONT.bodySemi, fontSize: 15 },
});
