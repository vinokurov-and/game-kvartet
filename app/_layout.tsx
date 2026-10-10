import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Unbounded_700Bold, Unbounded_800ExtraBold } from '@expo-google-fonts/unbounded';
import { Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';

import { initAds } from '@/lib/ads';
import { useGameStore } from '@/lib/game/store';
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

  // Счётчик сессий (первая — без рекламы). Со второй сессии заранее спрашиваем ATT и поднимаем SDK.
  useEffect(() => {
    const start = () => {
      useGameStore.getState().startSession();
      if (useGameStore.getState().sessions > 1) void initAds();
    };
    if (useGameStore.persist.hasHydrated()) start();
    else return useGameStore.persist.onFinishHydration(start);
  }, []);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}>
        <Stack.Screen name="how-to" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
