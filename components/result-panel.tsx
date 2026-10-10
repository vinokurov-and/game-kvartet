// Итог квартета: заголовок, сетка попыток, статистика, таймер до следующего, шеринг.
import { useEffect, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { BrutalBox, BrutalButton } from '@/components/brutal';
import { formatCountdown, msUntilNext } from '@/lib/game/daily';
import { grantExtraLives, type GameState } from '@/lib/game/engine';
import { shareText } from '@/lib/game/share';
import { useGameStore } from '@/lib/game/store';
import type { Puzzle } from '@/lib/game/types';
import { BORDER, FONT, usePalette } from '@/lib/theme';
import { useReward } from '@/lib/use-reward';

function title(state: GameState): [string, string] {
  if (state.status === 'lost') return ['Не в этот раз', 'Завтра будет новый квартет'];
  if (state.continued) return ['Решено!', 'Со второго захода'];
  const m = state.mistakes;
  if (m === 0) return ['Безупречно!', 'Без единой ошибки'];
  if (m === 1) return ['Отлично!', 'Решено с одной ошибкой'];
  return ['Решено!', `Ошибок: ${m}`];
}

interface Props {
  puzzle: Puzzle;
  state: GameState;
  onChange: (next: GameState) => void;
}

export function ResultPanel({ puzzle, state, onChange }: Props) {
  const p = usePalette();
  const reward = useReward();
  const stats = useGameStore((s) => s.stats);
  const [left, setLeft] = useState(msUntilNext);

  useEffect(() => {
    const t = setInterval(() => setLeft(msUntilNext()), 1000);
    return () => clearInterval(t);
  }, []);

  const [head, sub] = title(state);
  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <View style={styles.root}>
      <Text style={[styles.title, { color: p.ink }]}>{head}</Text>
      <Text style={[styles.sub, { color: p.muted }]}>{sub}</Text>

      <View style={styles.grid}>
        {state.guesses.map((row, i) => (
          <View key={i} style={styles.gridRow}>
            {row.map((lvl, j) => (
              <View
                key={j}
                style={[styles.sq, { backgroundColor: p.groups[lvl], borderColor: p.ink }]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        {[
          [String(stats.currentStreak), 'дней подряд'],
          [`${winRate}%`, 'побед'],
          [String(stats.played), 'сыграно'],
        ].map(([v, l]) => (
          <BrutalBox key={l} style={styles.flex} contentStyle={styles.stat}>
            <Text style={[styles.statValue, { color: p.ink }]}>{v}</Text>
            <Text style={[styles.statLabel, { color: p.muted }]}>{l}</Text>
          </BrutalBox>
        ))}
      </View>

      <Text style={[styles.next, { color: p.muted }]}>
        Следующий квартет через {formatCountdown(left)}
      </Text>

      {state.status === 'lost' && !state.continued && (
        <BrutalButton
          label={
            reward.busy
              ? 'Загружаем рекламу…'
              : reward.free
                ? 'Ещё 4 попытки'
                : 'Ещё 4 попытки за рекламу'
          }
          disabled={reward.busy}
          onPress={() => void reward.run(() => onChange(grantExtraLives(state)))}
        />
      )}
      <BrutalButton
        label="Поделиться"
        primary
        onPress={() => void Share.share({ message: shareText(puzzle, state) })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, marginTop: 8 },
  title: { fontFamily: FONT.display, fontSize: 26 },
  sub: { fontFamily: FONT.body, fontSize: 15, marginTop: -6 },
  grid: { alignItems: 'center', gap: 6, marginVertical: 6 },
  gridRow: { flexDirection: 'row', gap: 6 },
  sq: { width: 30, height: 30, borderRadius: 6, borderWidth: BORDER - 0.5 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { paddingVertical: 12, alignItems: 'center' },
  statValue: { fontFamily: FONT.display, fontSize: 22 },
  statLabel: { fontFamily: FONT.body, fontSize: 12 },
  next: { fontFamily: FONT.body, fontSize: 14, textAlign: 'center' },
  flex: { flex: 1 },
});
