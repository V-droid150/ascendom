import { Pressable, Text, View } from 'react-native';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';

interface SwatchPickerProps {
  label: string;
  /** One colour per option. */
  swatches: readonly string[];
  value: number;
  onChange: (index: number) => void;
  /** Accessible name per option, e.g. "porcelain". */
  optionLabels: readonly string[];
}

/**
 * A row of colour swatches.
 *
 * The selected swatch gets a thick gold frame *and* a tick glyph, because the
 * accessibility rules forbid communicating state through colour alone — and
 * here the options themselves are colours.
 */
export function SwatchPicker({
  label,
  swatches,
  value,
  onChange,
  optionLabels,
}: SwatchPickerProps) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {swatches.map((color, index) => {
          const selected = index === value;
          return (
            <Pressable
              key={`${color}-${index}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={optionLabels[index] ?? `${index + 1}`}
              onPress={() => onChange(index)}
              style={[styles.swatch, { backgroundColor: color }, selected && styles.selected]}
            >
              {selected && <Text style={styles.tick}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  group: { gap: spacing.xs },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.bodySm,
    color: colors.ink,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: border.radius,
    borderWidth: border.width,
    borderColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: border.widthThick,
    borderColor: colors.gold,
  },
  tick: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.night,
    // Light outline so the tick survives on both dark and pale swatches.
    textShadowColor: colors.parchment,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
}));
