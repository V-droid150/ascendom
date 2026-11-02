import { StyleSheet, Text, View } from 'react-native';
import { border, colors, fonts, fontSize, spacing } from '@/theme';

interface PixelBarProps {
  /** 0..1 */
  ratio: number;
  fill: string;
  shade: string;
  /** Shown inside the bar. Required: colour alone must never carry meaning. */
  label: string;
  accessibilityLabel: string;
  /** Number of visible notches. Segmenting reads as a game bar, not a slider. */
  segments?: number;
  height?: number;
}

/**
 * A segmented HP/XP bar.
 *
 * The numeric label is not optional by design: the accessibility rules forbid
 * relying on colour alone, so an HP bar always states its own value.
 */
export function PixelBar({
  ratio,
  fill,
  shade,
  label,
  accessibilityLabel,
  segments = 10,
  height = 16,
}: PixelBarProps) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const filledSegments = Math.round(clamped * segments);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height }]}
    >
      <View style={styles.segments}>
        {Array.from({ length: segments }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              { backgroundColor: index < filledSegments ? fill : colors.nightDeep },
              index < filledSegments && { borderBottomColor: shade },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: border.width,
    borderColor: colors.night,
    borderRadius: border.radius,
    backgroundColor: colors.nightDeep,
    justifyContent: 'center',
  },
  segments: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    gap: 1,
    padding: 1,
  },
  segment: {
    flex: 1,
    borderRadius: border.radius,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    // A dark outline keeps the number legible over both filled and empty parts.
    textShadowColor: colors.night,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
