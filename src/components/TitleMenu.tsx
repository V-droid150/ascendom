import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settingsStore';
import { border, duration, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';

export interface TitleMenuItem {
  key: string;
  label: string;
  /** Right-aligned current value, for option rows like Language. */
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Decorative art between the cursor and the label. */
  icon?: ReactNode;
}

interface TitleMenuProps {
  items: TitleMenuItem[];
  /** Optional line above the options, e.g. "Welcome back, Ayu." */
  header?: string;
}

/**
 * A classic JRPG menu window: navy fill, a white frame with an inner blue
 * bevel, and a blinking ▶ cursor beside the highlighted option.
 *
 * The cursor follows the pointer on web and the finger on touch, so it always
 * points at what the next tap will do. It holds still under reduced motion.
 */
export function TitleMenu({ items, header }: TitleMenuProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  const [cursor, setCursor] = useState(0);
  const [blinkOn, setBlinkOn] = useState(true);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setBlinkOn((on) => !on), duration.idleFrame);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <View style={styles.frame}>
      <View style={styles.inner}>
        {header !== undefined && <Text style={styles.header}>{header}</Text>}

        {items.map((item, index) => {
          const active = index === cursor;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.value ? `${item.label}: ${item.value}` : item.label}
              accessibilityState={{ disabled: item.disabled ?? false }}
              disabled={item.disabled}
              onHoverIn={() => setCursor(index)}
              onPressIn={() => setCursor(index)}
              onPress={item.onPress}
              style={[styles.row, item.disabled && styles.disabled]}
            >
              <Text style={styles.cursor}>{active && (blinkOn || reduceMotion) ? '▶' : ' '}</Text>
              {item.icon}
              <Text style={[styles.label, index === 0 && styles.primary]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.value !== undefined && <Text style={styles.value}>{item.value}</Text>}
            </Pressable>
          );
        })}

        <Text style={styles.hint}>{t('onboarding.welcome.menuHint')}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  frame: {
    width: '100%',
    maxWidth: 360,
    borderWidth: border.width,
    borderColor: colors.windowFrame,
    backgroundColor: colors.windowFill,
    borderRadius: border.radius,
  },
  inner: {
    margin: border.width,
    borderWidth: border.width,
    borderColor: colors.windowInner,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  header: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.windowAccent,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
  },
  cursor: {
    width: 16,
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.windowAccent,
  },
  label: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.windowText,
    letterSpacing: 1,
  },
  primary: { color: colors.windowAccent },
  value: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.windowTextDim },
  disabled: { opacity: 0.5 },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.windowTextDim,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
}));
