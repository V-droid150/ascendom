import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { border, colors, fonts, fontSize, MIN_TOUCH_SIZE, spacing } from '@/theme';
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
}

const FILL: Record<PixelButtonVariant, string> = {
  primary: colors.gold,
  secondary: colors.mana,
  danger: colors.hp,
  ghost: colors.charcoal,
};

const SHADOW: Record<PixelButtonVariant, string> = {
  primary: colors.goldDark,
  secondary: colors.xpDark,
  danger: colors.hpDark,
  ghost: colors.nightDeep,
};

const LABEL: Record<PixelButtonVariant, string> = {
  primary: colors.ink,
  secondary: colors.ink,
  danger: colors.text,
  ghost: colors.text,
};

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
}: PixelButtonProps) {
  const [pressed, setPressed] = useState(false);
  const haptics = useHaptics();

  const offset = pressed && !disabled ? border.shadowOffset : 0;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.shadow,
          { backgroundColor: SHADOW[variant] },
          compact && styles.shadowCompact,
        ]}
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
          { backgroundColor: FILL[variant], transform: [{ translateY: offset }] },
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.label, compact && styles.labelCompact, { color: LABEL[variant] }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  label: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    textAlign: 'center',
  },
  labelCompact: { fontSize: fontSize.displayXs },
  disabled: { opacity: 0.45 },
});
