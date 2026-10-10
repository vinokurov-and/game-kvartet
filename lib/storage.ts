// Локальное хранилище: MMKV на устройстве (нужен нативный модуль — в Expo Go не работает),
// localStorage в web-превью, in-memory при статическом рендере.
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

function createWebStorage(): StateStorage {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    const mem = new Map<string, string>();
    return {
      setItem: (n, v) => void mem.set(n, v),
      getItem: (n) => mem.get(n) ?? null,
      removeItem: (n) => void mem.delete(n),
    };
  }
  return {
    setItem: (n, v) => window.localStorage.setItem(n, v),
    getItem: (n) => window.localStorage.getItem(n),
    removeItem: (n) => window.localStorage.removeItem(n),
  };
}

function createNativeStorage(): StateStorage {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv = createMMKV({ id: 'kvartet' });
  return {
    setItem: (n, v) => mmkv.set(n, v),
    getItem: (n) => mmkv.getString(n) ?? null,
    removeItem: (n) => void mmkv.remove(n),
  };
}

export const kvStorage: StateStorage =
  Platform.OS === 'web' ? createWebStorage() : createNativeStorage();
