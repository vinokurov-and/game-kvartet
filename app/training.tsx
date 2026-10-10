// Тренировка: бесконечные головоломки без влияния на статистику дня. Ведёт на первую несыгранную.
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { BrutalButton } from '@/components/brutal';
import { Screen } from '@/components/screen';
import { TRAINING } from '@/content/training';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';

export default function Training() {
  const p = usePalette();
  const router = useRouter();
  const games = useGameStore((s) => s.games);

  const next = TRAINING.find((t) => !games[t.id] || games[t.id].status === 'playing');
  const done = TRAINING.filter((t) => games[t.id] && games[t.id].status !== 'playing').length;

  return (
    <Screen title="Тренировка" subtitle={`Пройдено ${done} из ${TRAINING.length}`} back>
      <Text style={[styles.text, { color: p.ink }]}>
        Головоломки без счёта и серии — чтобы набить руку между квартетами дня.
      </Text>
      {next ? (
        <BrutalButton
          label={games[next.id] ? 'Продолжить' : 'Играть'}
          primary
          onPress={() => router.push(`/play/${next.id}`)}
        />
      ) : (
        <Text style={[styles.text, { color: p.muted }]}>
          Все головоломки тренировки пройдены. Новые появятся с обновлением.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: FONT.body, fontSize: 15, lineHeight: 21 },
});
