import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from './persistAdapter';
import type { ExportBundle } from './types';

export type SyncStatus = 'signedOut' | 'idle' | 'syncing' | 'error';

/** A cloud save that disagrees with this device, waiting for the player to pick. */
export interface PendingConflict {
  cloud: ExportBundle;
  cloudUpdatedAt: string;
}

interface PersistedSync {
  /** Account this device last synced with. */
  syncedUserId: string | null;
  /** The cloud save's `updated_at` as of the last successful sync. */
  lastSyncedAt: string | null;
  /** Local changes not yet uploaded. */
  dirty: boolean;
}

interface SyncState extends PersistedSync {
  userId: string | null;
  email: string | null;
  status: SyncStatus;
  /** When this session last finished a sync, for the "Synced at" line. */
  lastSyncFinishedAt: string | null;
  conflict: PendingConflict | null;
}

interface SyncActions {
  setSession: (session: { userId: string; email: string | null } | null) => void;
  setStatus: (status: SyncStatus) => void;
  markDirty: () => void;
  markSynced: (userId: string, cloudUpdatedAt: string) => void;
  setConflict: (conflict: PendingConflict | null) => void;
}

export const SYNC_STORAGE_KEY = 'ascendom:sync:v1';

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set) => ({
      syncedUserId: null,
      lastSyncedAt: null,
      dirty: false,
      userId: null,
      email: null,
      status: 'signedOut',
      lastSyncFinishedAt: null,
      conflict: null,

      setSession: (session) =>
        set(
          session
            ? { userId: session.userId, email: session.email, status: 'idle' }
            : { userId: null, email: null, status: 'signedOut', conflict: null },
        ),
      setStatus: (status) => set({ status }),
      markDirty: () => set({ dirty: true }),
      markSynced: (userId, cloudUpdatedAt) =>
        set({
          syncedUserId: userId,
          lastSyncedAt: cloudUpdatedAt,
          dirty: false,
          status: 'idle',
          lastSyncFinishedAt: new Date().toISOString(),
          conflict: null,
        }),
      setConflict: (conflict) => set({ conflict, status: 'idle' }),
    }),
    {
      name: SYNC_STORAGE_KEY,
      storage: createJSONStorage<PersistedSync>(),
      version: 1,
      partialize: (state): PersistedSync => ({
        syncedUserId: state.syncedUserId,
        lastSyncedAt: state.lastSyncedAt,
        dirty: state.dirty,
      }),
    },
  ),
);
