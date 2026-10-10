// Каркас экрана: фон, отступы safe area, шапка с заголовком и кнопкой «назад» или действиями справа.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT, usePalette } from '@/lib/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children: ReactNode;
}

export function Screen({ title, subtitle, back = false, right, children }: Props) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={[
        styles.root,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
      ]}
    >
      {back && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.back}
        >
          <Text style={[styles.backText, { color: p.ink }]}>← Назад</Text>
        </Pressable>
      )}
      <View style={styles.header}>
        <Text style={[styles.title, { color: p.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: p.muted }]}>{subtitle}</Text> : null}
      {children}
    </ScrollView>
  );
}

/** Маленькая текстовая ссылка-кнопка в шапке. */
export function HeaderLink({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
      <Text style={[styles.link, { color: p.ink, borderColor: p.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 16, gap: 12, flexGrow: 1 },
  back: { alignSelf: 'flex-start' },
  backText: { fontFamily: FONT.bodySemi, fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontFamily: FONT.display, fontSize: 26, flexShrink: 1 },
  subtitle: { fontFamily: FONT.body, fontSize: 13, marginTop: -8 },
  link: {
    fontFamily: FONT.bodyBold,
    fontSize: 13,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
