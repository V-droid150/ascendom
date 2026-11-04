import type { ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { APP_MAX_WIDTH, border, makeStyles } from '@/theme';

/**
 * Centres the app in a fixed-width "game window" on wide screens.
 *
 * A habit tracker stretched across a 2560px monitor looks broken, and the
 * sprites are authored for a phone-width column. On desktop the app keeps its
 * 480px column with the night palette filling the surround, which also reads as
 * a deliberate arcade frame rather than an unstyled gap.
 */
export function GameWindow({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > APP_MAX_WIDTH;

  if (!isWide) {
    return <View style={styles.full}>{children}</View>;
  }

  return (
    <View style={styles.surround}>
      <View style={styles.window}>{children}</View>
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
    maxWidth: APP_MAX_WIDTH,
    backgroundColor: colors.night,
    borderLeftWidth: border.width,
    borderRightWidth: border.width,
    borderColor: colors.charcoal,
  },
}));
