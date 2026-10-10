// Архив: вышедшие квартеты, кроме сегодняшнего. Последние 3 дня бесплатно, старше — за rewarded.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DateTime } from 'luxon';

import { BrutalBox } from '@/components/brutal';
import { Screen } from '@/components/screen';
import { PUZZLES } from '@/content/puzzles';
import { currentPuzzleDate, isFreeArchiveDay, releasedPuzzles } from '@/lib/game/daily';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';
import { useReward } from '@/lib/use-reward';

export default function Archive() {
  const p = usePalette();
  const router = useRouter();
  const games = useGameStore((s) => s.games);
  const unlocked = useGameStore((s) => s.unlocked);
  const unlock = useGameStore((s) => s.unlock);
  const reward = useReward();

  const today = currentPuzzleDate();
  const list = releasedPuzzles(PUZZLES).filter((x) => x.date !== today);

  const open = (id: number, date: string) => {
    const available = isFreeArchiveDay(date) || unlocked.includes(id) || !!games[id];
    if (available) {
      router.push(`/play/${id}`);
      return;
    }
    void reward.run(() => {
      unlock(id);
      router.push(`/play/${id}`);
    });
  };

  return (
    <Screen title="Архив" subtitle="Прошлые квартеты" back>
      {list.length === 0 && (
        <Text style={[styles.empty, { color: p.muted }]}>
          Здесь появятся прошлые квартеты. Возвращайся завтра.
        </Text>
      )}
      {list.map((x) => {
        const g = games[x.id];
        const status =
          g?.status === 'won' ? 'решён' : g?.status === 'lost' ? 'не решён' : g ? 'начат' : null;
        const locked = !isFreeArchiveDay(x.date) && !unlocked.includes(x.id) && !g;
        return (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            disabled={reward.busy}
            onPress={() => open(x.id, x.date)}
          >
            <BrutalBox contentStyle={styles.row}>
              <View style={styles.flex}>
                <Text style={[styles.num, { color: p.ink }]}>№{x.id}</Text>
                <Text style={[styles.date, { color: p.muted }]}>
                  {DateTime.fromISO(x.date).setLocale('ru').toFormat('d MMMM, cccc')}
                </Text>
              </View>
              <Text style={[styles.badge, { color: p.ink }]}>
                {locked ? (reward.free ? 'открыть' : 'за рекламу') : (status ?? 'играть')}
              </Text>
            </BrutalBox>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: FONT.body, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  flex: { flex: 1 },
  num: { fontFamily: FONT.displayBold, fontSize: 17 },
  date: { fontFamily: FONT.body, fontSize: 13 },
  badge: { fontFamily: FONT.bodyBold, fontSize: 13 },
});
