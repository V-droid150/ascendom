import { TextInput } from 'react-native';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

interface AuthInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  kind: 'email' | 'password' | 'newPassword';
  onSubmitEditing?: () => void;
}

/** A pixel-styled text field for email and password, with the right autofill hints. */
export function AuthInput({ kind, placeholder, ...props }: AuthInputProps) {
  const colors = useColors();
  const styles = useStyles();
  const isEmail = kind === 'email';

  return (
    <TextInput
      {...props}
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry={!isEmail}
      keyboardType={isEmail ? 'email-address' : 'default'}
      autoComplete={
        isEmail ? 'email' : kind === 'newPassword' ? 'new-password' : 'current-password'
      }
      textContentType={
        isEmail ? 'emailAddress' : kind === 'newPassword' ? 'newPassword' : 'password'
      }
      placeholderTextColor={colors.steel}
      style={styles.input}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  input: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.nightDeep,
    borderWidth: border.width,
    borderColor: colors.charcoal,
    borderRadius: border.radius,
  },
}));
