import type { ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { layoutFor } from '@/hooks/useLayout';
import {
  APP_MAX_WIDTH,
  border,
  makeStyles,
  READING_MAX_WIDTH,
  WIDE_WINDOW_MAX_WIDTH,
} from '@/theme';

/**
 * Frames the app on the web, by window width:
 *
 * - phone (up to 480px): the app fills the screen.
 * - between a phone and a tablet (481-767px): the 480px phone column, centred.
 *   The sprites and panels are authored for that width.
 * - tablet and desktop (768px+): a wide window up to 1280px, where the tabs
 *   move to a side rail and screens use two columns (see `useLayout`).
 *
 * Wherever the window is narrower than the screen, the night palette fills
 * the surround and the window gets a border: a deliberate arcade frame
 * rather than an unstyled gap.
 */
export function GameWindow({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return <View style={styles.full}>{children}</View>;

  const maxWidth = layoutFor(width).isWide ? WIDE_WINDOW_MAX_WIDTH : APP_MAX_WIDTH;
  if (width <= maxWidth) return <View style={styles.full}>{children}</View>;

  return (
    <View style={styles.surround}>
      <View style={[styles.window, { maxWidth }]}>{children}</View>
    </View>
  );
}

/**
 * Keeps a form or story screen (sign-in, onboarding, the quest editor) a
 * readable column on a wide window instead of stretching it edge to edge.
 * Used as a Stack `screenLayout`; on a phone it is a plain pass-through.
 */
export function ReadingColumn({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  if (!layoutFor(width).isWide) return <>{children}</>;

  return (
    <View style={styles.readingSurround}>
      <View style={styles.reading}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  full: { flex: 1, backgroundColor: colors.night },
  surround: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.nightDeep,
  },
  window: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.night,
    borderLeftWidth: border.width,
    borderRightWidth: border.width,
    borderColor: colors.charcoal,
  },
  readingSurround: { flex: 1, alignItems: 'center', backgroundColor: colors.night },
  reading: { flex: 1, width: '100%', maxWidth: READING_MAX_WIDTH },
}));
