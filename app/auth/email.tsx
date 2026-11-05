import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthInput } from '@/components/AuthInput';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useEmailAuth, type EmailAuthMode } from '@/hooks/useEmailAuth';
import { PASSWORD_MIN_LENGTH } from '@/services/auth';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

/**
 * Sign in or create an account with email and password.
 *
 * Reached from the title screen (`?from=title`) or from Settings
 * (`?from=settings`); a successful sign-in goes back where it came from.
 */
export default function EmailAuthScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { from, mode: initialMode } = useLocalSearchParams<{ from?: string; mode?: string }>();
  const auth = useEmailAuth(initialMode === 'signUp' ? 'signUp' : 'signIn');
  const signingUp = auth.mode === 'signUp';

  const leave = (): void => {
    if (from === 'settings') router.replace('/(tabs)/settings');
    else router.replace('/(onboarding)/welcome');
  };

  const submit = async (): Promise<void> => {
    if (await auth.submit()) leave();
  };

  const tab = (mode: EmailAuthMode, label: string) => (
    <View style={styles.tab}>
      <PixelButton
        label={label}
        variant={auth.mode === mode ? 'primary' : 'ghost'}
        onPress={() => auth.setMode(mode)}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t(signingUp ? 'auth.signUpTitle' : 'auth.signInTitle')}
      </Text>
      <Text style={styles.subtitle}>{t('auth.emailPitch')}</Text>

      <PixelPanel tone="dark" style={styles.panel}>
        <View style={styles.tabs}>
          {tab('signIn', t('auth.signIn'))}
          {tab('signUp', t('auth.signUp'))}
        </View>

        <AuthInput
          kind="email"
          value={auth.email}
          onChangeText={auth.setEmail}
          placeholder={t('auth.email')}
        />
        <AuthInput
          kind={signingUp ? 'newPassword' : 'password'}
          value={auth.password}
          onChangeText={auth.setPassword}
          placeholder={t('auth.password')}
          onSubmitEditing={() => void submit()}
        />
        {signingUp && (
          <Text style={styles.note}>{t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}</Text>
        )}

        <PixelButton
          label={t(signingUp ? 'auth.createAccount' : 'auth.signIn')}
          onPress={() => void submit()}
          disabled={!auth.canSubmit}
        />
        {!signingUp && (
          <PixelButton
            label={t('auth.forgotPassword')}
            variant="ghost"
            onPress={() => void auth.forgotPassword()}
            disabled={auth.busy}
          />
        )}
      </PixelPanel>

      <PixelButton label={t('auth.back')} variant="ghost" onPress={leave} />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.night,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    color: colors.gold,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textDim,
    textAlign: 'center',
  },
  panel: { gap: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1 },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
}));
