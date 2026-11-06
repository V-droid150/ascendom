import { useEffect, useState } from 'react';
import { isDaytimeHour } from '@/sprites/titleScene';

/** How often the title screen rechecks the clock. */
const CHECK_EVERY_MS = 60_000;

/**
 * Whether it is daytime on the device's own clock, so in its own time zone.
 * Rechecked every minute, so the title scene turns at 06:00 and 18:00 even if
 * the screen stays open across the change.
 */
export function useDaytime(): boolean {
  const [daytime, setDaytime] = useState(() => isDaytimeHour(new Date().getHours()));

  useEffect(() => {
    const timer = setInterval(
      () => setDaytime(isDaytimeHour(new Date().getHours())),
      CHECK_EVERY_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return daytime;
}
