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
  /** The player chose to play without an account, so the title skips the sign-in menu. */
  guest: boolean;
}

interface SyncState extends PersistedSync {
  userId: string | null;
  /** False until the stored login session has been read, so screens don't flash a sign-in prompt. */
  sessionKnown: boolean;
  email: string | null;
  status: SyncStatus;
  /** When this session last finished a sync, for the "Synced at" line. */
  lastSyncFinishedAt: string | null;
  conflict: PendingConflict | null;
  /**
   * True once this session's first sync has finished (or failed). The day
   * rollover waits for it, so a stale device never judges days that another
   * device already played.
   */
  initialSyncDone: boolean;
}

interface SyncActions {
  setSession: (session: { userId: string; email: string | null } | null) => void;
  setStatus: (status: SyncStatus) => void;
  markDirty: () => void;
  markSynced: (userId: string, cloudUpdatedAt: string) => void;
  setConflict: (conflict: PendingConflict | null) => void;
  setGuest: (guest: boolean) => void;
  markInitialSyncDone: () => void;
}

export const SYNC_STORAGE_KEY = 'ascendom:sync:v1';

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set) => ({
      syncedUserId: null,
      lastSyncedAt: null,
      dirty: false,
      guest: false,
      userId: null,
      sessionKnown: false,
      email: null,
      status: 'signedOut',
      lastSyncFinishedAt: null,
      conflict: null,
      initialSyncDone: false,

      setSession: (session) =>
        set(
          session
            ? { userId: session.userId, email: session.email, status: 'idle', sessionKnown: true }
            : {
                userId: null,
                email: null,
                status: 'signedOut',
                conflict: null,
                sessionKnown: true,
              },
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
      setGuest: (guest) => set({ guest }),
      markInitialSyncDone: () => set({ initialSyncDone: true }),
    }),
    {
      name: SYNC_STORAGE_KEY,
      storage: createJSONStorage<PersistedSync>(),
      // v2 added `guest`. Earlier devices start without it, so returning
      // players see the new sign-in menu once and can pick "play without an account".
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<PersistedSync>;
        return {
          syncedUserId: state.syncedUserId ?? null,
          lastSyncedAt: state.lastSyncedAt ?? null,
          dirty: state.dirty ?? false,
          guest: state.guest ?? false,
        };
      },
      partialize: (state): PersistedSync => ({
        syncedUserId: state.syncedUserId,
        lastSyncedAt: state.lastSyncedAt,
        dirty: state.dirty,
        guest: state.guest,
      }),
    },
  ),
);
