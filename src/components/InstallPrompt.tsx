import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInstallMode } from '@/hooks/useInstallMode';
import { promptInstall } from '@/services/install';
import { storage } from '@/services/storage';
import { fonts, fontSize, makeStyles, spacing, zIndex } from '@/theme';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';

const DISMISSED_KEY = 'ascendom:install-prompt-dismissed';

/**
 * A one-time "add to home screen" banner.
 *
 * Where the browser can install (Chrome, Edge, Samsung Internet) it opens the
 * real dialog. On iPhone, which has no install API, it names the Share ->
 * Add to Home Screen steps instead. Either way a dismissal is remembered, and
 * Settings keeps a permanent Install section for anyone who changes their mind.
 */
export function InstallPrompt() {
  const styles = useStyles();
  const { t } = useTranslation();
  const mode = useInstallMode();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void storage.getItem(DISMISSED_KEY).then((value) => {
      if (!cancelled) setDismissed(value === 'true');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || (mode !== 'prompt' && mode !== 'ios')) return null;

  const dismiss = (): void => {
    setDismissed(true);
    void storage.setItem(DISMISSED_KEY, 'true');
  };

  const install = async (): Promise<void> => {
    dismiss();
    await promptInstall().catch(() => false);
  };

  return (
    <View style={styles.host}>
      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.title}>{t('pwa.installTitle')}</Text>
        <Text style={styles.body}>{t(mode === 'ios' ? 'pwa.iosBanner' : 'pwa.installBody')}</Text>

        <View style={styles.actions}>
          <PixelButton
            label={t(mode === 'ios' ? 'pwa.gotIt' : 'pwa.dismiss')}
            variant="ghost"
            compact
            onPress={dismiss}
            style={styles.action}
          />
          {mode === 'prompt' && (
            <PixelButton
              label={t('pwa.install')}
              compact
              onPress={() => void install()}
              style={styles.action}
            />
          )}
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
