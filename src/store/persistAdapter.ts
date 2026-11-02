/**
 * Bridges Zustand's `persist` middleware to our `StorageAdapter`.
 *
 * Everything that touches storage goes through this one file, so moving from
 * AsyncStorage to SQLite or a synced backend later is a single change here
 * rather than an edit in every store.
 */

import { createJSONStorage as createZustandJSONStorage } from 'zustand/middleware';
import type { PersistStorage } from 'zustand/middleware';
import { storage, type StorageAdapter } from '@/services/storage';

let reportError: (operation: string, error: unknown) => void = () => {};

/**
 * Lets the UI layer register a toast reporter. Storage failures must be
 * visible — a silently failed write looks exactly like lost progress.
 */
export function onStorageError(handler: (operation: string, error: unknown) => void): void {
  reportError = handler;
}

export function createJSONStorage<T>(adapter: StorageAdapter = storage): PersistStorage<T> {
  const persistStorage = createZustandJSONStorage<T>(() => ({
    getItem: async (name) => {
      try {
        return await adapter.getItem(name);
      } catch (error) {
        reportError('load', error);
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await adapter.setItem(name, value);
      } catch (error) {
        reportError('save', error);
      }
    },
    removeItem: async (name) => {
      try {
        await adapter.removeItem(name);
      } catch (error) {
        reportError('remove', error);
      }
    },
  }));

  // createJSONStorage only returns undefined when the getter throws, which the
  // wrapper above prevents.
  return persistStorage as PersistStorage<T>;
}
