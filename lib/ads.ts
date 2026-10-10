// Реклама Yandex Mobile Ads. Правила (спека 2.6): первая сессия без рекламы; ATT — до инициализации SDK;
// если реклама не загрузилась, награду всё равно выдаём — игрок не должен застрять из-за отсутствия показа.
import { Platform } from 'react-native';

type YandexAds = typeof import('yandex-mobile-ads');

/** Боевые блоки РСЯ (приложение 20213371). В dev-режиме — демо-блоки Яндекса. */
const UNITS = __DEV__
  ? { rewarded: 'demo-rewarded-yandex', interstitial: 'demo-interstitial-yandex' }
  : { rewarded: 'R-M-20213371-1', interstitial: 'R-M-20213371-2' };

let sdk: YandexAds | null = null;
let initPromise: Promise<boolean> | null = null;

function loadSdk(): YandexAds | null {
  if (Platform.OS === 'web') return null;
  if (!sdk) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      sdk = require('yandex-mobile-ads') as YandexAds;
    } catch {
      sdk = null; // сборка без нативного модуля (старый TestFlight-билд)
    }
  }
  return sdk;
}

/** ATT (iOS) → инициализация SDK. Вызывается один раз, не раньше второй сессии. */
export function initAds(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const ads = loadSdk();
    if (!ads) return false;
    if (Platform.OS === 'ios') {
      try {
        const att = await import('expo-tracking-transparency');
        await att.requestTrackingPermissionsAsync();
      } catch {
        /* нет модуля или отказ — реклама будет неперсонализированной */
      }
    }
    try {
      await ads.MobileAds.initialize();
      return true;
    } catch {
      return false;
    }
  })();
  return initPromise;
}

export type RewardOutcome = 'rewarded' | 'skipped' | 'unavailable';

/**
 * Показать rewarded-рекламу. `rewarded` — досмотрел; `skipped` — закрыл раньше (награды нет);
 * `unavailable` — реклама не загрузилась (вызывающий выдаёт награду бесплатно).
 */
export async function showRewarded(): Promise<RewardOutcome> {
  const ready = await initAds();
  const ads = loadSdk();
  if (!ready || !ads) return 'unavailable';
  try {
    const loader = await ads.RewardedAdLoader.create();
    const ad = await loader.loadAd({ adUnitId: UNITS.rewarded });
    return await new Promise<RewardOutcome>((resolve) => {
      let rewarded = false;
      ad.onRewarded = () => {
        rewarded = true;
      };
      ad.onAdFailedToShow = () => resolve('unavailable');
      ad.onAdDismissed = () => resolve(rewarded ? 'rewarded' : 'skipped');
      ad.show();
    });
  } catch {
    return 'unavailable';
  }
}

export async function showInterstitial(): Promise<void> {
  const ready = await initAds();
  const ads = loadSdk();
  if (!ready || !ads) return;
  try {
    const loader = await ads.InterstitialAdLoader.create();
    const ad = await loader.loadAd({ adUnitId: UNITS.interstitial });
    await new Promise<void>((resolve) => {
      ad.onAdDismissed = () => resolve();
      ad.onAdFailedToShow = () => resolve();
      ad.show();
    });
  } catch {
    /* без показа */
  }
}
