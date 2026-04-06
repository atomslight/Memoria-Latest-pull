import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV({ id: 'memoria' });

// In-memory cache so sync reads work immediately after writes
const memoryCache = new Map<string, string>();

function readFromDisk(key: string): string | undefined {
  const v = mmkv.getString(key);
  return v === undefined ? undefined : v;
}

export const storage = {
  set: (key: string, value: string) => {
    memoryCache.set(key, value);
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error('Failed to save to MMKV:', error);
    }
  },
  getString: (key: string): string | undefined => {
    const cached = memoryCache.get(key);
    if (cached !== undefined) return cached;
    const v = readFromDisk(key);
    if (v !== undefined) memoryCache.set(key, v);
    return v;
  },
  remove: (key: string) => {
    memoryCache.delete(key);
    try {
      mmkv.delete(key);
    } catch (error) {
      console.error('Failed to delete from MMKV:', error);
    }
  },
  hydrate: async (keys: string[]) => {
    for (const key of keys) {
      const v = readFromDisk(key);
      if (v !== undefined) memoryCache.set(key, v);
    }
  },
};

export const asyncStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  getItem: async (key: string): Promise<string | null> => {
    return storage.getString(key) ?? null;
  },
  removeItem: async (key: string): Promise<void> => {
    storage.remove(key);
  },
};

export const zustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storage.remove(name);
  },
};
