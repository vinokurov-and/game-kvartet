// Тактильный отклик с учётом настройки «Вибрация».
import * as Haptics from 'expo-haptics';

import { useGameStore } from '@/lib/game/store';

const on = () => useGameStore.getState().haptics;

export const haptic = {
  select: () => void (on() && Haptics.selectionAsync()),
  tap: () => void (on() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => void (on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => void (on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
