import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthInput } from '@/components/AuthInput';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useToast } from '@/components/ToastProvider';
import { PASSWORD_MIN_LENGTH, updatePassword } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

type Stage = 'opening' | 'ready' | 'failed';

/**
 * Where the password-reset email lands. Exchanges the one-time code for a
 * session (which only works in the browser that asked for the reset), then
 * lets the player choose a new password.
 */
export default function ResetPasswordScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [exchange, setExchange] = useState<Stage>('opening');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const stage: Stage = code ? exchange : 'failed';

  // A code can be exchanged once; a re-render must not spend it a second time.
  const started = useRef(false);

  useEffect(() => {
    if (!code || started.current) return;
    started.current = true;
    void (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getSession();
      setExchange(error && !data.session ? 'failed' : 'ready');
    })();
  }, [code]);

  const save = async (): Promise<void> => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      toast.show(t('auth.errors.weakPassword', { count: PASSWORD_MIN_LENGTH }), 'danger');
      return;
    }
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (!result.ok) {
      toast.show(t(`auth.errors.${result.error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
      return;
    }
    toast.show(t('auth.passwordChanged'), 'success');
    router.replace('/(onboarding)/welcome');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        {t('auth.resetTitle')}
      </Text>

      {stage === 'opening' && <Text style={styles.text}>{t('auth.callback.signingIn')}</Text>}

      {stage === 'failed' && (
        <>
          <Text style={styles.text}>{t('auth.resetFailed')}</Text>
          <PixelButton
            label={t('auth.back')}
            onPress={() => router.replace('/(onboarding)/welcome')}
          />
        </>
      )}

      {stage === 'ready' && (
        <PixelPanel tone="dark" style={styles.panel}>
          <AuthInput
            kind="newPassword"
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.newPassword')}
            onSubmitEditing={() => void save()}
          />
          <Text style={styles.note}>{t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}</Text>
          <PixelButton
            label={t('auth.savePassword')}
            onPress={() => void save()}
            disabled={busy || password.length === 0}
          />
        </PixelPanel>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
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
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
  panel: { gap: spacing.sm },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
}));
