import { useSyncExternalStore } from 'react';
import { installMode, subscribeInstall, type InstallMode } from '@/services/install';

/** How this device can install Ascendom, kept live as the browser's events arrive. */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribeInstall, installMode, installMode);
}
