import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelArt } from '@/sprites/PixelArt';
import { CASTLE_ART, CASTLE_COLORS } from '@/sprites/scenes';
import { PixelButton } from '@/components/PixelButton';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.art}>
        <PixelArt art={CASTLE_ART} colors={CASTLE_COLORS} scale={7} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>

      <PixelButton
        label={t('onboarding.welcome.cta')}
        onPress={() => router.push('/(onboarding)/pick-gender')}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  art: { alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', gap: spacing.sm },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    color: colors.gold,
    letterSpacing: 3,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textDim,
    textAlign: 'center',
  },
  cta: { minWidth: 220 },
});
