import type { ReactNode } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts, fontSize, MIN_TOUCH_SIZE, spacing } from '@/theme';

interface SettingRowProps {
  label: string;
  note?: string;
  children?: ReactNode;
}

export function SettingRow({ label, note, children }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {note !== undefined && <Text style={styles.note}>{note}</Text>}
      </View>
      {children}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  note?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({ label, note, value, onChange, disabled = false }: ToggleRowProps) {
  return (
    <SettingRow label={label} {...(note === undefined ? {} : { note })}>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ false: colors.charcoal, true: colors.xpDark }}
        thumbColor={value ? colors.xp : colors.steel}
      />
    </SettingRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
});
