// Выдача награды «за рекламу»: в первую сессию — бесплатно, дальше — после rewarded-показа.
// Если реклама не загрузилась, награда тоже выдаётся (игрок не должен застревать).
import { useState } from 'react';

import { showRewarded } from '@/lib/ads';
import { useGameStore } from '@/lib/game/store';

export function useReward() {
  const sessions = useGameStore((s) => s.sessions);
  const [busy, setBusy] = useState(false);
  const free = sessions <= 1;

  const run = async (grant: () => void) => {
    if (busy) return;
    if (free) {
      grant();
      return;
    }
    setBusy(true);
    try {
      const outcome = await showRewarded();
      if (outcome !== 'skipped') grant();
    } finally {
      setBusy(false);
    }
  };

  return { run, busy, free };
}
