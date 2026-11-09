/**
 * Runs cloud sync: asks `decideSync` what to do, then does it.
 *
 * Plain functions over the stores rather than a hook, so the same code runs
 * from a login, an app-start, a foreground event, a debounced edit, or the
 * "Sync now" button without any of them knowing about the others.
 */

import {
  fetchCloudSave,
  insertCloudSave,
  overwriteCloudSave,
  updateCloudSave,
  type WriteResult,
} from '@/services/cloudSave';
import { useGameStore } from '@/store/gameStore';
import { useSyncStore } from '@/store/syncStore';
import type { ExportBundle } from '@/store/types';
import { decideSync, UPLOAD_DEBOUNCE_MS } from './policy';

/**
 * True while a cloud save is being applied locally. The change listeners
 * ignore that write, or downloading would mark the device dirty and upload the
 * same save straight back.
 */
let applying = false;
let uploadTimer: ReturnType<typeof setTimeout> | null = null;
let running: Promise<void> | null = null;
/**
 * Bumped on every local edit. An upload remembers the value it exported at; if
 * the player edited while the request was in flight, the save it sent is
 * already stale, so the device stays dirty and uploads again.
 */
let changeSeq = 0;

export function isApplyingCloudSave(): boolean {
  return applying;
}

function hasHero(): boolean {
  const { onboarded, hero } = useGameStore.getState();
  return onboarded && hero !== null;
}

function applyCloudSave(bundle: ExportBundle): boolean {
  applying = true;
  try {
    return useGameStore.getState().importBundle(JSON.stringify(bundle)).ok;
  } finally {
    applying = false;
  }
}

/** Marks the sync done, unless edits arrived after `exportedAt`: those still need uploading. */
function settleUpload(userId: string, updatedAt: string, exportedAt: number): void {
  useSyncStore.getState().markSynced(userId, updatedAt);
  if (changeSeq !== exportedAt) {
    useSyncStore.getState().markDirty();
    scheduleUpload();
  }
}

/**
 * A downloaded save may have been last played days ago. Settle those days now,
 * as a normal local change, so the result is uploaded like any other edit.
 */
function settleDownloadedDays(): void {
  if (hasHero()) useGameStore.getState().runRollover();
}

async function upload(userId: string, cloudExists: boolean): Promise<void> {
  const sync = useSyncStore.getState();
  const exportedAt = changeSeq;
  const bundle = useGameStore.getState().exportBundle();

  const result: WriteResult =
    cloudExists && sync.lastSyncedAt !== null
      ? await updateCloudSave(userId, bundle, sync.lastSyncedAt)
      : await insertCloudSave(userId, bundle);

  if (result.ok) {
    settleUpload(userId, result.updatedAt, exportedAt);
    return;
  }

  // Another device wrote first. Fetch what it wrote and let the player choose.
  const cloud = await fetchCloudSave(userId);
  if (cloud.data && cloud.updatedAt) {
    useSyncStore.getState().setConflict({ cloud: cloud.data, cloudUpdatedAt: cloud.updatedAt });
  }
}

async function runSync(): Promise<void> {
  const { userId } = useSyncStore.getState();
  if (!userId) return;

  useSyncStore.getState().setStatus('syncing');
  try {
    const cloud = await fetchCloudSave(userId);
    const sync = useSyncStore.getState();
    const action = decideSync(
      userId,
      {
        hasHero: hasHero(),
        dirty: sync.dirty,
        syncedUserId: sync.syncedUserId,
        lastSyncedAt: sync.lastSyncedAt,
      },
      { exists: cloud.exists, updatedAt: cloud.updatedAt },
    );

    switch (action) {
      case 'upload':
        await upload(userId, cloud.exists);
        break;
      case 'download':
        if (cloud.data && cloud.updatedAt && applyCloudSave(cloud.data)) {
          useSyncStore.getState().markSynced(userId, cloud.updatedAt);
          settleDownloadedDays();
        } else {
          useSyncStore.getState().setStatus('error');
        }
        break;
      case 'conflict':
        if (cloud.data && cloud.updatedAt) {
          useSyncStore
            .getState()
            .setConflict({ cloud: cloud.data, cloudUpdatedAt: cloud.updatedAt });
        }
        break;
      case 'none':
        if (cloud.updatedAt) useSyncStore.getState().markSynced(userId, cloud.updatedAt);
        else useSyncStore.getState().setStatus('idle');
        break;
    }
  } catch {
    // Offline or a server error. Local play is unaffected and `dirty` is still
    // set, so the next sync picks the changes up.
    useSyncStore.getState().setStatus('error');
  } finally {
    useSyncStore.getState().markInitialSyncDone();
  }
}

/** Syncs now. Concurrent calls share one run instead of racing each other. */
export function syncNow(): Promise<void> {
  if (!running) {
    running = runSync().finally(() => {
      running = null;
    });
  }
  return running;
}

function scheduleUpload(): void {
  if (!useSyncStore.getState().userId) return;
  if (uploadTimer) clearTimeout(uploadTimer);
  uploadTimer = setTimeout(() => {
    uploadTimer = null;
    // A run already in flight would swallow this one, so wait for it first.
    void (running ?? Promise.resolve()).then(() => syncNow());
  }, UPLOAD_DEBOUNCE_MS);
}

/** Records a local change and uploads it shortly after the edits settle. */
export function noteLocalChange(): void {
  if (applying) return;
  changeSeq += 1;
  useSyncStore.getState().markDirty();
  scheduleUpload();
}

/** Settles a conflict with the player's choice. */
export async function resolveConflict(choice: 'cloud' | 'device'): Promise<void> {
  const { userId, conflict } = useSyncStore.getState();
  if (!userId || !conflict) return;

  useSyncStore.getState().setStatus('syncing');
  try {
    if (choice === 'cloud') {
      if (applyCloudSave(conflict.cloud)) {
        useSyncStore.getState().markSynced(userId, conflict.cloudUpdatedAt);
        settleDownloadedDays();
      } else {
        useSyncStore.getState().setStatus('error');
      }
      return;
    }

    const exportedAt = changeSeq;
    const updatedAt = await overwriteCloudSave(userId, useGameStore.getState().exportBundle());
    settleUpload(userId, updatedAt, exportedAt);
  } catch {
    useSyncStore.getState().setStatus('error');
  }
}
