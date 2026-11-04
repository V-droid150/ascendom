/**
 * Reading and writing the player's cloud save. Thin wrappers over the
 * `game_saves` table; every rule about *when* to call them is in `src/sync`.
 */

import type { ExportBundle } from '@/store/types';
import { supabase } from './supabase';

/** Matches `ExportBundle.version`; lets the server reject a format it can't read. */
export const SAVE_SCHEMA_VERSION = 1;

export interface CloudSave {
  exists: boolean;
  updatedAt: string | null;
  data: ExportBundle | null;
}

export async function fetchCloudSave(userId: string): Promise<CloudSave> {
  const { data, error } = await supabase
    .from('game_saves')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { exists: false, updatedAt: null, data: null };
  return {
    exists: true,
    updatedAt: data.updated_at as string,
    data: data.data as ExportBundle,
  };
}

export type WriteResult = { ok: true; updatedAt: string } | { ok: false; reason: 'conflict' };

/** Creates the first save. Fails with a conflict if another device got there first. */
export async function insertCloudSave(userId: string, bundle: ExportBundle): Promise<WriteResult> {
  const { data, error } = await supabase
    .from('game_saves')
    .insert({ user_id: userId, data: bundle, schema_version: SAVE_SCHEMA_VERSION })
    .select('updated_at')
    .single();

  if (error?.code === '23505') return { ok: false, reason: 'conflict' };
  if (error) throw error;
  return { ok: true, updatedAt: data.updated_at as string };
}

/**
 * Overwrites the save only if it is still the version this device last saw.
 * Zero rows updated means another device wrote in between: a conflict.
 */
export async function updateCloudSave(
  userId: string,
  bundle: ExportBundle,
  expectedUpdatedAt: string,
): Promise<WriteResult> {
  const { data, error } = await supabase
    .from('game_saves')
    .update({ data: bundle, schema_version: SAVE_SCHEMA_VERSION })
    .eq('user_id', userId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at');

  if (error) throw error;
  const row = data[0];
  if (!row) return { ok: false, reason: 'conflict' };
  return { ok: true, updatedAt: row.updated_at as string };
}

/** Unconditional write, used only when the player chose "keep this device". */
export async function overwriteCloudSave(userId: string, bundle: ExportBundle): Promise<string> {
  const { data, error } = await supabase
    .from('game_saves')
    .upsert(
      { user_id: userId, data: bundle, schema_version: SAVE_SCHEMA_VERSION },
      { onConflict: 'user_id' },
    )
    .select('updated_at')
    .single();

  if (error) throw error;
  return data.updated_at as string;
}

/** Reminders fire in the player's local time, so the server needs their zone. */
export async function saveTimezone(userId: string, timezone: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ timezone }).eq('id', userId);
  if (error) throw error;
}
