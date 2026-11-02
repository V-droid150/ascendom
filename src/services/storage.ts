/**
 * Storage behind a narrow interface.
 *
 * The app only ever talks to `StorageAdapter`, so swapping AsyncStorage for
 * SQLite or a Supabase-backed adapter later is a one-file change. The in-memory
 * adapter exists for tests and for web contexts where storage is unavailable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const asyncStorageAdapter: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export function createMemoryAdapter(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

/**
 * Wraps an adapter so a storage failure surfaces as a rejected promise the
 * store can report, instead of a silent data loss.
 */
export function withErrorReporting(
  adapter: StorageAdapter,
  onError: (operation: string, error: unknown) => void,
): StorageAdapter {
  return {
    getItem: async (key) => {
      try {
        return await adapter.getItem(key);
      } catch (error) {
        onError('getItem', error);
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        await adapter.setItem(key, value);
      } catch (error) {
        onError('setItem', error);
        throw error;
      }
    },
    removeItem: async (key) => {
      try {
        await adapter.removeItem(key);
      } catch (error) {
        onError('removeItem', error);
        throw error;
      }
    },
  };
}

/** The adapter Zustand's persist middleware is given. */
export const storage: StorageAdapter = asyncStorageAdapter;
