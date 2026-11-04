import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelArt } from '@/sprites/PixelArt';
import { CROWN_ART, CROWN_COLORS } from '@/sprites/scenes';
import { PixelButton } from '@/components/PixelButton';
import { fonts, fontSize, makeStyles, spacing, useColors } from '@/theme';

/** 12px per art pixel: the 12x12 crown renders at 144px. */
const CROWN_SCALE = 12;

export default function WelcomeScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { t } = useTranslation();
  const router = useRouter();

  const crownColors = useMemo(() => ({ ...CROWN_COLORS, k: colors.outline }), [colors.outline]);

  return (
    <View style={styles.screen}>
      <View style={styles.art}>
        <PixelArt
          art={CROWN_ART}
          colors={crownColors}
          scale={CROWN_SCALE}
          accessibilityLabel={t('app.name')}
        />
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

const useStyles = makeStyles((colors) => ({
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
}));
