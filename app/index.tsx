// Временный экран этапа 1: проверка темы и компонентов на устройстве. Игровую логику заменит этап 2–3.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrutalButton, GroupBar, Tile } from '@/components/brutal';
import { FONT, usePalette } from '@/lib/theme';

const WORDS = [
  'ВОРОНА',
  'ЧЕСТНОЕ',
  'СТОЛБ',
  'СИНИЦА',
  'ПЯТНО',
  'КРЕПКОЕ',
  'ГРАЧ',
  'ТРИУМФ',
  'ПОСЛЕДНЕЕ',
  'СОКОЛ',
  'СЕМЬЯ',
  'ВВОДНОЕ',
];

export default function Preview() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (w: string) =>
    setSelected((s) => (s.includes(w) ? s.filter((x) => x !== w) : s.length < 4 ? [...s, w] : s));

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: p.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.logo, { color: p.ink }]}>Квартет</Text>
        <Text style={[styles.meta, { color: p.muted }]}>№1 · превью</Text>
      </View>
      <Text style={[styles.hint, { color: p.ink }]}>Найди 4 группы по 4 слова</Text>

      <GroupBar
        level={1}
        theme="Пьесы Чехова"
        words={['ЧАЙКА', 'ИВАНОВ', 'ДЯДЯ ВАНЯ', 'ТРИ СЕСТРЫ']}
      />
      <View style={styles.board}>
        {WORDS.map((w) => (
          <Tile key={w} word={w} selected={selected.includes(w)} onPress={() => toggle(w)} />
        ))}
      </View>

      <View style={styles.actions}>
        <BrutalButton label="Перемешать" onPress={() => {}} style={styles.flex} />
        <BrutalButton label="Снять" onPress={() => setSelected([])} style={styles.flex} />
        <BrutalButton
          label="Проверить"
          primary
          disabled={selected.length !== 4}
          onPress={() => {}}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  logo: { fontFamily: FONT.display, fontSize: 26 },
  meta: { fontFamily: FONT.body, fontSize: 13 },
  hint: { fontFamily: FONT.bodySemi, fontSize: 15 },
  board: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 'auto' },
  flex: { flex: 1 },
});
