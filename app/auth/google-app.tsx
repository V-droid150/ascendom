import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthInput } from '@/components/AuthInput';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useGoogleHandoff } from '@/hooks/useGoogleHandoff';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

/**
 * Google sign-in inside the app installed on an iPhone home screen.
 *
 * Google can't finish inside that app, so the player signs in in Safari and
 * brings back a 6-digit code (see `services/googleHandoff.ts`). Reached from
 * the title screen (`?from=title`) or Settings (`?from=settings`).
 */
export default function GoogleAppSignIn() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const returnTo = from === 'settings' ? 'settings' : 'title';
  const handoff = useGoogleHandoff(returnTo);

  const leave = (): void => {
    if (returnTo === 'settings') router.replace('/(tabs)/settings');
    else router.replace('/(onboarding)/welcome');
  };

  const submit = async (): Promise<void> => {
    if (await handoff.submit()) leave();
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t('auth.withGoogle')}
      </Text>
      <Text style={styles.subtitle}>{t('auth.handoff.appPitch')}</Text>

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.step}>{t('auth.handoff.step1')}</Text>
        <PixelButton
          label={t('auth.handoff.openSafari')}
          onPress={() => void handoff.openSafari()}
          disabled={!handoff.ready}
        />
        <PixelButton
          label={t('auth.handoff.copyLink')}
          variant="ghost"
          compact
          onPress={() => void handoff.copyLink()}
          disabled={!handoff.ready}
        />
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.step}>{t('auth.handoff.step2')}</Text>
        <AuthInput
          kind="code"
          value={handoff.code}
          onChangeText={handoff.setCode}
          placeholder={t('auth.handoff.codePlaceholder')}
          onSubmitEditing={() => void submit()}
        />
        <PixelButton
          label={t('auth.signIn')}
          onPress={() => void submit()}
          disabled={!handoff.canSubmit}
        />
      </PixelPanel>

      <View style={styles.footer}>
        <Text style={styles.note}>{t('auth.handoff.expiryNote')}</Text>
        <PixelButton
          label={t('auth.handoff.newLink')}
          variant="ghost"
          compact
          onPress={() => void handoff.restart()}
          disabled={handoff.busy}
        />
        <PixelButton label={t('auth.back')} variant="ghost" onPress={leave} />
      </View>
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
  step: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.text },
  footer: { gap: spacing.sm },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textDim,
    textAlign: 'center',
  },
}));
