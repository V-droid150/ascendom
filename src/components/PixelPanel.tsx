import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { border, makeStyles, spacing } from '@/theme';

interface PixelPanelProps {
  children: ReactNode;
  /**
   * Layout for the panel's *content* (flexDirection, gap, alignItems, …).
   * Applied to the inner surface, which always fills the frame.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Sizing for the outer frame (width, maxWidth, margin). Only needed when the
   * panel sits in a centring parent and can't simply stretch.
   */
  frameStyle?: StyleProp<ViewStyle>;
  /** `parchment` for readable content, `dark` for panels on the night surface. */
  tone?: 'parchment' | 'dark';
  padded?: boolean;
}

/**
 * The content surface.
 *
 * Imitates a 9-slice panel with two stacked hard-edged borders — an outer dark
 * frame and an inner highlight — rather than one stroke. No radius and no blur,
 * which is what keeps it reading as pixel art.
 *
 * Caller styles land on the *inner* surface, not the frame. The frame is a
 * plain column box so the inner can always stretch to fill it; putting a
 * caller's `flexDirection: 'row'` on the frame instead would make the inner
 * surface a content-sized row item, leaving the frame colour showing through
 * beside it.
 */
export function PixelPanel({
  children,
  style,
  frameStyle,
  tone = 'parchment',
  padded = true,
}: PixelPanelProps) {
  const styles = useStyles();
  const isParchment = tone === 'parchment';

  return (
    <View
      style={[styles.outer, isParchment ? styles.outerParchment : styles.outerDark, frameStyle]}
    >
      <View
        style={[
          styles.inner,
          isParchment ? styles.innerParchment : styles.innerDark,
          padded && styles.padded,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  outer: {
    borderWidth: border.width,
    borderRadius: border.radius,
  },
  outerParchment: {
    borderColor: colors.parchmentShadow,
    backgroundColor: colors.parchmentDark,
  },
  outerDark: {
    borderColor: colors.charcoal,
    backgroundColor: colors.nightDeep,
  },
  inner: {
    borderWidth: border.width,
    borderRadius: border.radius,
  },
  innerParchment: {
    borderColor: colors.parchment,
    backgroundColor: colors.parchment,
  },
  innerDark: {
    borderColor: colors.slate,
    backgroundColor: colors.nightDeep,
  },
  padded: {
    padding: spacing.md,
  },
}));
