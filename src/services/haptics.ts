/**
 * Haptics. No-ops on web, where expo-haptics has no implementation.
 *
 * These are the raw calls with no notion of user preference — `useHaptics`
 * gates them on the settings toggle.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export const rawHaptics = {
  selection(): void {
    if (supported) void Haptics.selectionAsync();
  },
  light(): void {
    if (supported) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium(): void {
    if (supported) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy(): void {
    if (supported) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success(): void {
    if (supported) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning(): void {
    if (supported) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error(): void {
    if (supported) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
} as const;

export type HapticsApi = typeof rawHaptics;
export const HAPTICS_SUPPORTED = supported;
