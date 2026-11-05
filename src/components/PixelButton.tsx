import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  border,
  fonts,
  fontSize,
  makeStyles,
  MIN_TOUCH_SIZE,
  spacing,
  useColors,
  type ThemeColors,
} from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

export type PixelButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface PixelButtonProps {
  label: string;
  onPress: () => void;
  variant?: PixelButtonVariant;
  disabled?: boolean;
  /** Small buttons still honour the 44px minimum touch target. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Decorative art drawn left of the label, e.g. a provider logo. */
  icon?: ReactNode;
}

interface VariantColors {
  fill: string;
  shadow: string;
  label: string;
}

function variantColors(variant: PixelButtonVariant, colors: ThemeColors): VariantColors {
  switch (variant) {
    case 'primary':
      return { fill: colors.gold, shadow: colors.goldDark, label: colors.onAccent };
    case 'secondary':
      return { fill: colors.mana, shadow: colors.xpDark, label: colors.onAccent };
    case 'danger':
      return { fill: colors.hp, shadow: colors.hpDark, label: colors.onDanger };
    case 'ghost':
      return { fill: colors.charcoal, shadow: colors.nightDeep, label: colors.text };
  }
}

/**
 * A button with a 2px hard drop shadow that presses *into* the shadow on touch,
 * which is how arcade UI communicates a press without any easing.
 */
export function PixelButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  compact = false,
  style,
  accessibilityLabel,
  icon,
}: PixelButtonProps) {
  const styles = useStyles();
  const tone = variantColors(variant, useColors());
  const [pressed, setPressed] = useState(false);
  const haptics = useHaptics();

  const offset = pressed && !disabled ? border.shadowOffset : 0;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[styles.shadow, { backgroundColor: tone.shadow }, compact && styles.shadowCompact]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={() => {
          setPressed(true);
          haptics.selection();
        }}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        style={[
          styles.face,
          compact && styles.faceCompact,
          { backgroundColor: tone.fill, transform: [{ translateY: offset }] },
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, compact && styles.labelCompact, { color: tone.label }]}>
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrapper: { position: 'relative' },
  shadow: {
    position: 'absolute',
    left: border.shadowOffset,
    top: border.shadowOffset,
    right: -border.shadowOffset,
    bottom: -border.shadowOffset,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: border.radius,
  },
  shadowCompact: { minHeight: MIN_TOUCH_SIZE },
  face: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: border.radius,
    borderWidth: border.width,
    borderColor: colors.night,
  },
  faceCompact: { paddingHorizontal: spacing.sm },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    textAlign: 'center',
  },
  labelCompact: { fontSize: fontSize.displayXs },
  disabled: { opacity: 0.45 },
}));
