/**
 * Cloud sync decisions, kept pure so every case is unit-tested.
 *
 * The device is the source of truth while playing; the cloud holds one save
 * per account. Whenever the two meet (login, app start, foreground, a failed
 * conditional write), `decideSync` says what to do. It never guesses when both
 * sides have changed: that is a conflict, and the player chooses.
 */

export type SyncAction = 'none' | 'upload' | 'download' | 'conflict';

export interface LocalSyncState {
  /** Whether this device has a hero worth keeping. */
  hasHero: boolean;
  /** Changes made on this device since the last successful sync. */
  dirty: boolean;
  /** Account this device last synced with, if any. */
  syncedUserId: string | null;
  /** The cloud save's `updated_at` as of the last successful sync. */
  lastSyncedAt: string | null;
}

export interface CloudSyncState {
  exists: boolean;
  updatedAt: string | null;
}

export function decideSync(
  userId: string,
  local: LocalSyncState,
  cloud: CloudSyncState,
): SyncAction {
  if (!cloud.exists) return local.hasHero ? 'upload' : 'none';
  if (!local.hasHero) return 'download';

  // This device has never synced with this account (first login here, or a
  // different account): two independent heroes, so the player picks one.
  if (local.syncedUserId !== userId || local.lastSyncedAt === null) return 'conflict';

  const cloudMovedOn = cloud.updatedAt !== local.lastSyncedAt;
  if (!cloudMovedOn) return local.dirty ? 'upload' : 'none';
  return local.dirty ? 'conflict' : 'download';
}

/** How long to wait after the last change before uploading. */
export const UPLOAD_DEBOUNCE_MS = 3000;
