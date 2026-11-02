import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { border, colors, spacing } from '@/theme';

interface PixelPanelProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `parchment` for readable content, `dark` for panels on the night surface. */
  tone?: 'parchment' | 'dark';
  padded?: boolean;
}

/**
 * The content surface.
 *
 * Imitates a 9-slice panel with stacked hard-edged borders instead of a single
 * stroke: an outer dark frame, an inner highlight, then the fill. No radius and
 * no blur anywhere, which is what keeps it reading as pixel art.
 */
export function PixelPanel({ children, style, tone = 'parchment', padded = true }: PixelPanelProps) {
  const isParchment = tone === 'parchment';

  return (
    <View style={[styles.outer, isParchment ? styles.outerParchment : styles.outerDark, style]}>
      <View
        style={[
          styles.inner,
          isParchment ? styles.innerParchment : styles.innerDark,
          padded && styles.padded,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
