import { useState } from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/services/supabase';
import { disableWebPush } from '@/services/webPush';
import { useSyncStore } from '@/store/syncStore';
import { syncNow } from '@/sync/controller';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';
import { useToast } from './ToastProvider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Supabase lets the project choose 6 to 8 digits; accept any of them. */
const CODE_LENGTH = { min: 6, max: 8 } as const;

/** Where the emailed link lands. Native has no web origin, so it relies on the code. */
function redirectUrl(): string | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  return `${window.location.origin}/auth/callback`;
}

/**
 * Login and sync status in Settings.
 *
 * Login is passwordless: an emailed link that lands on `/auth/callback`. A
 * code field is offered too, for when the email template includes one (it
 * needs custom SMTP on Supabase). The code matters for an installed PWA on
 * iOS, which opens links in Safari rather than in the app.
 */
export function AccountPanel() {
  const styles = useStyles();
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const sync = useSyncStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async (): Promise<void> => {
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      toast.show(t('account.errors.invalidEmail'), 'danger');
      return;
    }
    setBusy(true);
    const redirect = redirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, ...(redirect ? { emailRedirectTo: redirect } : {}) },
    });
    setBusy(false);
    if (error) toast.show(t('account.errors.sendFailed'), 'danger');
    else setSentTo(address);
  };

  const verify = async (): Promise<void> => {
    if (!sentTo) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: sentTo,
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) {
      toast.show(t('account.errors.verifyFailed'), 'danger');
      return;
    }
    setSentTo(null);
    setCode('');
  };

  const signOut = async (): Promise<void> => {
    // While still signed in, so the server stops pushing this account here.
    await disableWebPush().catch(() => {});
    await supabase.auth.signOut();
    toast.show(t('account.signedOut'));
  };

  const statusLine = (): string => {
    if (sync.status === 'syncing') return t('account.status.syncing');
    if (sync.status === 'error') return t('account.status.error');
    if (sync.dirty) return t('account.status.pending');
    if (sync.lastSyncFinishedAt) {
      const time = new Date(sync.lastSyncFinishedAt).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return t('account.status.synced', { time });
    }
    return t('account.status.ready');
  };

  const input = (props: {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    keyboardType: 'email-address' | 'number-pad';
    maxLength?: number;
  }) => (
    <TextInput
      {...props}
      autoCapitalize="none"
      autoCorrect={false}
      placeholderTextColor={colors.steel}
      accessibilityLabel={props.placeholder}
      style={styles.input}
    />
  );

  return (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.title}>{t('account.title')}</Text>

      {sync.userId ? (
        <>
          <Text style={styles.text}>{t('account.signedInAs', { email: sync.email ?? '' })}</Text>
          <Text style={[styles.note, sync.status === 'error' && styles.error]}>{statusLine()}</Text>
          <PixelButton
            label={t('account.syncNow')}
            variant="secondary"
            onPress={() => void syncNow()}
            disabled={sync.status === 'syncing'}
          />
          <PixelButton
            label={t('account.signOut')}
            variant="ghost"
            onPress={() => void signOut()}
          />
        </>
      ) : sentTo ? (
        <>
          <Text style={styles.text}>{t('account.codeSent', { email: sentTo })}</Text>
          <Text style={styles.note}>{t('account.codeOptional')}</Text>
          {input({
            value: code,
            onChangeText: (value) => setCode(value.replace(/\D/g, '')),
            placeholder: t('account.codePlaceholder'),
            keyboardType: 'number-pad',
            maxLength: CODE_LENGTH.max,
          })}
          <PixelButton
            label={t('account.verify')}
            onPress={() => void verify()}
            disabled={busy || code.length < CODE_LENGTH.min}
          />
          <PixelButton
            label={t('account.changeEmail')}
            variant="ghost"
            onPress={() => setSentTo(null)}
          />
        </>
      ) : (
        <>
          <Text style={styles.note}>{t('account.pitch')}</Text>
          {input({
            value: email,
            onChangeText: setEmail,
            placeholder: t('account.emailPlaceholder'),
            keyboardType: 'email-address',
          })}
          <PixelButton
            label={t('account.sendCode')}
            onPress={() => void sendCode()}
            disabled={busy || email.trim().length === 0}
          />
        </>
      )}
    </PixelPanel>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: { gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.textDim },
  text: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.text },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  error: { color: colors.danger },
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
