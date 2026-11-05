import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInstallMode } from '@/hooks/useInstallMode';
import { promptInstall } from '@/services/install';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';
import { useToast } from './ToastProvider';

/**
 * Settings section: put Ascendom on the home screen like a normal app.
 *
 * Shows the real install button where the browser offers one, the Share ->
 * Add to Home Screen steps on iPhone, and generic menu steps elsewhere. Hidden
 * in the native app, which is already installed by definition.
 */
export function InstallPanel() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const mode = useInstallMode();

  if (mode === 'native') return null;

  const install = async (): Promise<void> => {
    try {
      if (await promptInstall()) toast.show(t('pwa.installed'), 'success');
    } catch {
      toast.show(t('pwa.installFailed'), 'danger');
    }
  };

  const steps =
    mode === 'ios'
      ? (t('pwa.iosSteps', { returnObjects: true }) as string[])
      : mode === 'manual'
        ? (t('pwa.manualSteps', { returnObjects: true }) as string[])
        : [];

  return (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.sectionTitle}>{t('pwa.sectionTitle')}</Text>

      {mode === 'installed' && <Text style={styles.body}>{t('pwa.alreadyInstalled')}</Text>}

      {mode === 'prompt' && (
        <>
          <Text style={styles.body}>{t('pwa.installBody')}</Text>
          <PixelButton label={t('pwa.install')} onPress={() => void install()} />
        </>
      )}

      {steps.map((step, index) => (
        <Text key={step} style={styles.body}>
          {`${index + 1}. ${step}`}
        </Text>
      ))}

      {mode === 'ios' && <Text style={styles.note}>{t('pwa.iosNote')}</Text>}
    </PixelPanel>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: { gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.textDim },
  body: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.mana },
}));
