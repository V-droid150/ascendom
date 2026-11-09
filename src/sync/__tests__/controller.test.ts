/* eslint-disable @typescript-eslint/no-require-imports -- Jest module factories must use require() */
import { makeHero } from '@/engine/__tests__/factories';
import { useGameStore } from '@/store/gameStore';
import { useSyncStore } from '@/store/syncStore';
import type { WriteResult } from '@/services/cloudSave';
import { noteLocalChange, syncNow } from '../controller';
import { UPLOAD_DEBOUNCE_MS } from '../policy';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/services/supabase', () => ({ supabase: {} }));
jest.mock('@/services/cloudSave', () => ({
  fetchCloudSave: jest.fn(),
  insertCloudSave: jest.fn(),
  updateCloudSave: jest.fn(),
  overwriteCloudSave: jest.fn(),
}));

const cloud = jest.requireMock<{
  fetchCloudSave: jest.Mock;
  updateCloudSave: jest.Mock;
}>('@/services/cloudSave');

const USER = 'user-1';

/** A promise the test resolves by hand, to hold an upload "in flight". */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useGameStore.setState({ hero: makeHero(), onboarded: true });
  useSyncStore.setState({
    userId: USER,
    syncedUserId: USER,
    lastSyncedAt: 't1',
    dirty: true,
    conflict: null,
    initialSyncDone: false,
  });
  cloud.fetchCloudSave.mockResolvedValue({ exists: true, updatedAt: 't1', data: null });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('sync controller', () => {
  it('keeps an edit made while its upload was in flight, and sends it next', async () => {
    const first = deferred<WriteResult>();
    cloud.updateCloudSave.mockReturnValueOnce(first.promise);

    const run = syncNow();
    await jest.advanceTimersByTimeAsync(0);
    expect(cloud.updateCloudSave).toHaveBeenCalledTimes(1);

    // The player finishes a quest before the server answers.
    noteLocalChange();
    first.resolve({ ok: true, updatedAt: 't2' });
    await run;

    // The save that went up predates that quest: still dirty.
    expect(useSyncStore.getState().dirty).toBe(true);
    expect(useSyncStore.getState().lastSyncedAt).toBe('t2');

    cloud.fetchCloudSave.mockResolvedValue({ exists: true, updatedAt: 't2', data: null });
    cloud.updateCloudSave.mockResolvedValueOnce({ ok: true, updatedAt: 't3' });
    await jest.advanceTimersByTimeAsync(UPLOAD_DEBOUNCE_MS);

    expect(cloud.updateCloudSave).toHaveBeenCalledTimes(2);
    expect(useSyncStore.getState().dirty).toBe(false);
    expect(useSyncStore.getState().lastSyncedAt).toBe('t3');
  });

  it('clears dirty when nothing changed during the upload', async () => {
    cloud.updateCloudSave.mockResolvedValueOnce({ ok: true, updatedAt: 't2' });
    await syncNow();
    expect(useSyncStore.getState().dirty).toBe(false);
    await jest.advanceTimersByTimeAsync(UPLOAD_DEBOUNCE_MS);
    expect(cloud.updateCloudSave).toHaveBeenCalledTimes(1);
  });

  it('marks the first sync done even when the network fails', async () => {
    cloud.fetchCloudSave.mockRejectedValueOnce(new Error('offline'));
    await syncNow();
    expect(useSyncStore.getState().status).toBe('error');
    expect(useSyncStore.getState().initialSyncDone).toBe(true);
  });
});
