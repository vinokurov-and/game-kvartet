// Правила игры. Используется роутом /how-to и экраном дня при первом запуске.
import { StyleSheet, Text, View } from 'react-native';

import { BrutalButton, GroupBar } from '@/components/brutal';
import { Screen } from '@/components/screen';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';

const RULES = [
  'Каждый день в 10:00 по Москве выходит новый квартет — один на всех.',
  'Среди 16 слов спрятаны 4 группы по 4 слова с общим признаком.',
  'Выбери 4 слова и нажми «Проверить». Ошибиться можно 4 раза.',
  'Будь внимателен: некоторые слова подходят сразу к нескольким группам.',
  'Застрял — возьми подсказку: сначала откроется тема группы, потом её слова.',
];

export function HowToBody({ onDone }: { onDone: () => void }) {
  const p = usePalette();
  const setSeen = useGameStore((s) => s.setSeenHowTo);

  return (
    <Screen title="Как играть">
      {RULES.map((r, i) => (
        <View key={i} style={styles.rule}>
          <Text style={[styles.num, { color: p.ink }]}>{i + 1}</Text>
          <Text style={[styles.text, { color: p.ink }]}>{r}</Text>
        </View>
      ))}
      <Text style={[styles.example, { color: p.muted }]}>Пример разгаданной группы:</Text>
      <GroupBar level={2} theme="Шахматные фигуры" words={['ЛАДЬЯ', 'ФЕРЗЬ', 'СЛОН', 'КОНЬ']} />
      <Text style={[styles.text, { color: p.muted }]}>
        Цвет показывает сложность: жёлтая группа — самая простая, розовая — самая хитрая.
      </Text>
      <BrutalButton
        label="Понятно, играть"
        primary
        onPress={() => {
          setSeen();
          onDone();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rule: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: { fontFamily: FONT.display, fontSize: 18, width: 20 },
  text: { fontFamily: FONT.body, fontSize: 15, lineHeight: 21, flex: 1 },
  example: { fontFamily: FONT.bodySemi, fontSize: 14, marginTop: 6 },
});
