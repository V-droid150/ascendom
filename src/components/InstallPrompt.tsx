import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';
import { storage } from '@/services/storage';
import { fonts, fontSize, makeStyles, spacing, zIndex } from '@/theme';

const DISMISSED_KEY = 'ascendom:install-prompt-dismissed';

/** The `beforeinstallprompt` event, which isn't in the DOM lib's types. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * A custom "add to home screen" banner.
 *
 * Chrome's own mini-infobar is suppressed by calling `preventDefault` on the
 * event, which lets the prompt match the pixel UI instead of looking like a
 * browser chrome intrusion. A dismissal is remembered so it is asked once.
 */
export function InstallPrompt() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let cancelled = false;

    const onBeforeInstall = (event: Event): void => {
      event.preventDefault();

      void storage.getItem(DISMISSED_KEY).then((dismissed) => {
        if (cancelled || dismissed === 'true') return;
        setDeferred(event as InstallPromptEvent);
        setVisible(true);
      });
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  if (!visible || !deferred) return null;

  const install = async (): Promise<void> => {
    setVisible(false);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  };

  const dismiss = (): void => {
    setVisible(false);
    setDeferred(null);
    void storage.setItem(DISMISSED_KEY, 'true');
  };

  return (
    <View style={styles.host}>
      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.title}>{t('pwa.installTitle')}</Text>
        <Text style={styles.body}>{t('pwa.installBody')}</Text>

        <View style={styles.actions}>
          <PixelButton
            label={t('pwa.dismiss')}
            variant="ghost"
            compact
            onPress={dismiss}
            style={styles.action}
          />
          <PixelButton
            label={t('pwa.install')}
            compact
            onPress={() => void install()}
            style={styles.action}
          />
        </View>
      </PixelPanel>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    zIndex: zIndex.toast,
  },
  panel: { gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.gold },
  body: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
}));
