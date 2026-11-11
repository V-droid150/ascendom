import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useHandoffApproval } from '@/hooks/useHandoffApproval';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

/**
 * Opened in Safari by the app installed on an iPhone home screen: the player
 * signs in with Google here, approves, and takes the 6-digit code back to the
 * app (see `services/googleHandoff.ts`). Cloud sync stays off in this tab.
 */
export default function HandoffApproval() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { id, h } = useLocalSearchParams<{ id?: string; h?: string }>();
  const approval = useHandoffApproval(id, h);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        {t('auth.handoff.safariTitle')}
      </Text>

      <PixelPanel tone="dark" style={styles.panel}>
        {approval.phase === 'invalid' && (
          <>
            <Text style={styles.text}>{t('auth.handoff.invalid')}</Text>
            <PixelButton
              label={t('auth.callback.back')}
              onPress={() => router.replace('/(onboarding)/welcome')}
            />
          </>
        )}

        {approval.phase === 'signedOut' && (
          <>
            <Text style={styles.text}>{t('auth.handoff.safariPitch')}</Text>
            <PixelButton label={t('auth.withGoogle')} onPress={() => void approval.signIn()} />
          </>
        )}

        {approval.phase === 'confirm' && (
          <>
            <Text style={styles.text}>
              {t('account.signedInAs', { email: approval.email ?? '' })}
            </Text>
            <Text style={styles.note}>{t('auth.handoff.confirmPitch')}</Text>
            <PixelButton
              label={t('auth.handoff.approve')}
              onPress={() => void approval.approve()}
              disabled={approval.busy}
            />
            <PixelButton
              label={t('auth.handoff.switchAccount')}
              variant="ghost"
              compact
              onPress={() => void approval.switchAccount()}
              disabled={approval.busy}
            />
          </>
        )}

        {approval.phase === 'code' && (
          <>
            <Text style={styles.text}>{t('auth.handoff.codeIntro')}</Text>
            <Text
              style={styles.code}
              accessibilityLabel={t('auth.handoff.codeA11y', {
                digits: (approval.code ?? '').split('').join(' '),
              })}
              selectable
            >
              {approval.code}
            </Text>
            <Text style={styles.note}>{t('auth.handoff.codeNote')}</Text>
          </>
        )}
      </PixelPanel>
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
  panel: { gap: spacing.md },
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  code: {
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    color: colors.gold,
    textAlign: 'center',
    letterSpacing: spacing.sm,
    paddingVertical: spacing.md,
  },
}));
