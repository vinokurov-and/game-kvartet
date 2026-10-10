import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Unbounded_700Bold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';

import { usePalette } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const p = usePalette();
  const [loaded] = useFonts({
    Unbounded_700Bold,
    Unbounded_800ExtraBold,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }} />
    </>
  );
}
