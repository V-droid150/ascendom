/**
 * Theme hooks.
 *
 * Styles can't be built once at module load any more, because the palette
 * changes at runtime. `makeStyles` keeps the familiar `StyleSheet.create` shape
 * but builds one sheet per theme, lazily, and hands back a hook that returns
 * the sheet for the active theme. Two themes means at most two sheets per file.
 */

import { StyleSheet } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemeMode } from '@/types';
import { THEMES, type ThemeColors } from './colors';

export function useThemeMode(): ThemeMode {
  return useSettingsStore((state) => state.theme);
}

export function useColors(): ThemeColors {
  return THEMES[useThemeMode()];
}

/** Whatever `StyleSheet.create` accepts; RN 0.88 no longer exports a name for it. */
type StyleInput = Parameters<typeof StyleSheet.create>[0];

export function makeStyles<T extends StyleInput>(
  factory: (colors: ThemeColors) => T & StyleInput,
): () => Readonly<T> {
  const sheets: Partial<Record<ThemeMode, Readonly<T>>> = {};

  return function useStyles(): Readonly<T> {
    const mode = useThemeMode();
    const cached = sheets[mode];
    if (cached) return cached;

    const sheet = StyleSheet.create(factory(THEMES[mode]));
    sheets[mode] = sheet;
    return sheet;
  };
}
