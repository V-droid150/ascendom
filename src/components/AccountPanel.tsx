import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GOOGLE_SUPPORTED, PASSWORD_MIN_LENGTH, signInWithGoogle } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { disableWebPush } from '@/services/webPush';
import { useSyncStore } from '@/store/syncStore';
import { syncNow } from '@/sync/controller';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';
import { useToast } from './ToastProvider';

/**
 * Account and sync status in Settings.
 *
 * Signed out, it offers the same two ways in as the title screen: Google, or
 * email + password on `/auth/email`. Signed in, it shows sync status.
 */
export function AccountPanel() {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const sync = useSyncStore();

  const google = async (): Promise<void> => {
    const result = await signInWithGoogle('settings');
    if (!result.ok)
      toast.show(t(`auth.errors.${result.error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
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
      ) : (
        <>
          <Text style={styles.note}>{t('account.pitch')}</Text>
          {GOOGLE_SUPPORTED && (
            <PixelButton label={t('auth.withGoogle')} onPress={() => void google()} />
          )}
          <PixelButton
            label={t('auth.withEmail')}
            variant={GOOGLE_SUPPORTED ? 'secondary' : 'primary'}
            onPress={() => router.push('/auth/email?from=settings')}
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
}));
