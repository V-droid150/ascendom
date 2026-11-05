import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

interface PolicySection {
  title: string;
  body: string;
}

/**
 * The privacy policy, at /privacy. Google requires a public policy URL before
 * "Sign in with Google" can leave testing mode, and players deserve one anyway.
 * The text lives in the locale files under `privacy`.
 */
export default function PrivacyScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const sections = t('privacy.sections', { returnObjects: true }) as PolicySection[];

  const back = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace('/(onboarding)/welcome');
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        {t('privacy.title')}
      </Text>
      <Text style={styles.meta}>{t('privacy.updated')}</Text>
      <Text style={styles.body}>{t('privacy.intro')}</Text>

      {sections.map((section) => (
        <PixelPanel key={section.title} tone="dark" style={styles.panel}>
          <Text style={styles.heading} accessibilityRole="header">
            {section.title}
          </Text>
          <Text style={styles.body}>{section.body}</Text>
        </PixelPanel>
      ))}

      <View style={styles.footer}>
        <PixelButton label={t('auth.back')} variant="ghost" onPress={back} />
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
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
  meta: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textDim,
    textAlign: 'center',
  },
  panel: { gap: spacing.xs },
  heading: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.gold },
  body: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  footer: { paddingBottom: spacing.lg },
}));
