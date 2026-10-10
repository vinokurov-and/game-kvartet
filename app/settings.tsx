// Настройки: вибрация, правила, политика, поддержка, версия.
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { BrutalBox } from '@/components/brutal';
import { Screen } from '@/components/screen';
import { useGameStore } from '@/lib/game/store';
import { FONT, usePalette } from '@/lib/theme';

const SITE = 'https://vinokurov-and.github.io/game-kvartet';

export default function Settings() {
  const p = usePalette();
  const router = useRouter();
  const haptics = useGameStore((s) => s.haptics);
  const setHaptics = useGameStore((s) => s.setHaptics);

  const rows: { label: string; onPress: () => void }[] = [
    { label: 'Как играть', onPress: () => router.push('/how-to') },
    {
      label: 'Политика конфиденциальности',
      onPress: () => void Linking.openURL(`${SITE}/privacy`),
    },
    { label: 'Поддержка и обратная связь', onPress: () => void Linking.openURL(`${SITE}/support`) },
  ];

  return (
    <Screen title="Настройки" back>
      <BrutalBox contentStyle={styles.row}>
        <Text style={[styles.label, { color: p.ink }]}>Вибрация</Text>
        <Switch
          value={haptics}
          onValueChange={setHaptics}
          trackColor={{ true: p.groups[2], false: p.muted }}
        />
      </BrutalBox>
      {rows.map((r) => (
        <Pressable key={r.label} accessibilityRole="button" onPress={r.onPress}>
          <BrutalBox contentStyle={styles.row}>
            <Text style={[styles.label, { color: p.ink }]}>{r.label}</Text>
            <Text style={[styles.label, { color: p.ink }]}>→</Text>
          </BrutalBox>
        </Pressable>
      ))}
      <View style={styles.footer}>
        <Text style={[styles.version, { color: p.muted }]}>
          Квартет {Constants.expoConfig?.version ?? ''}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  label: { fontFamily: FONT.bodySemi, fontSize: 15 },
  footer: { alignItems: 'center', marginTop: 8 },
  version: { fontFamily: FONT.body, fontSize: 12 },
});
