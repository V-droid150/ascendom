import { useEffect, useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LandscapeScene, landscapeScaleFor, type SceneHero } from '@/components/LandscapeScene';
import { TitleMenu, type TitleMenuItem } from '@/components/TitleMenu';
import { useGameHydrated } from '@/hooks/useGameHydrated';
import { useHero } from '@/hooks/useHero';
import {
  LANDSCAPE_BRIGHT_COLORS,
  LANDSCAPE_HEIGHT,
  LANDSCAPE_HERO_ANCHOR,
  LANDSCAPE_NIGHT_COLORS,
} from '@/sprites/landscape';
import { PixelArt } from '@/sprites/PixelArt';
import { CROWN_ART, CROWN_COLORS } from '@/sprites/scenes';
import { useSettingsStore } from '@/store/settingsStore';
import { duration, fonts, fontSize, makeStyles, spacing, useColors, useThemeMode } from '@/theme';

/** Below this window height the crown and title shrink so the menu still fits. */
const COMPACT_HEIGHT = 700;
const CROWN_SCALE = { compact: 6, roomy: 9 } as const;

/**
 * The title screen, opened on every launch.
 *
 * Built like a pixel RPG's: a bobbing crown and a drop-shadowed logo above a
 * JRPG menu window, over the kingdom's landscape — at night in the dark theme,
 * in bright daylight in the light one, its sky fading into the page so there
 * is no seam. A returning player's hero is already standing in the meadow.
 */
export default function WelcomeScreen() {
  const styles = useStyles();
  const colors = useColors();
  const themeMode = useThemeMode();
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useGameHydrated();
  const view = useHero();
  const settings = useSettingsStore();

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [bobUp, setBobUp] = useState(false);

  useEffect(() => {
    if (settings.reduceMotion) return;
    const timer = setInterval(() => setBobUp((up) => !up), duration.idleFrame);
    return () => clearInterval(timer);
  }, [settings.reduceMotion]);

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const crownColors = useMemo(() => ({ ...CROWN_COLORS, k: colors.outline }), [colors.outline]);
  const compact = size.height > 0 && size.height < COMPACT_HEIGHT;
  const crownScale = compact ? CROWN_SCALE.compact : CROWN_SCALE.roomy;

  // The content column stops where the hero's head would be, so the menu only
  // ever overlaps empty sky, never the hero or the castles.
  const sceneClearance =
    (LANDSCAPE_HEIGHT - LANDSCAPE_HERO_ANCHOR.y) * landscapeScaleFor(size.width);

  const hero = view?.hero ?? null;

  const sceneHero: SceneHero | null =
    view && hero
      ? {
          gender: hero.gender,
          rank: view.rankNumber,
          skinTone: hero.appearance.skinTone,
          hairStyle: hero.appearance.hairStyle,
          hairColor: hero.appearance.hairColor,
          cosmetics: hero.equippedCosmetics,
          animated: !settings.reduceMotion,
          accessibilityLabel: t('a11y.heroSprite', {
            name: hero.name,
            rank: view.rankTitle,
            level: hero.level,
          }),
        }
      : null;

  const start = (): void => {
    // A returning player skips character creation; `replace` so the back
    // gesture doesn't land them on the title screen again.
    if (hero) router.replace('/(tabs)/quests');
    else router.push('/(onboarding)/pick-gender');
  };

  const items: TitleMenuItem[] = [
    {
      key: 'start',
      label: hero ? t('onboarding.welcome.continue') : t('onboarding.welcome.cta'),
      onPress: start,
      // Disabled while the save loads, so an early tap can't send a returning
      // player into character creation.
      disabled: !hydrated,
    },
    {
      key: 'language',
      label: t('onboarding.welcome.menuLanguage'),
      value: t(`onboarding.welcome.languageName.${settings.language}`),
      onPress: () => settings.setLanguage(settings.language === 'en' ? 'id' : 'en'),
    },
    {
      key: 'theme',
      label: t('onboarding.welcome.menuTheme'),
      value: themeMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight'),
      onPress: () => settings.setTheme(themeMode === 'dark' ? 'light' : 'dark'),
    },
  ];

  return (
    <View style={styles.screen} onLayout={onLayout}>
      <View style={styles.scene}>
        <LandscapeScene
          palette={themeMode === 'dark' ? LANDSCAPE_NIGHT_COLORS : LANDSCAPE_BRIGHT_COLORS}
          hero={sceneHero}
        />
      </View>

      <View style={[styles.content, { paddingBottom: sceneClearance }]}>
        <View style={styles.logo}>
          <View style={{ transform: [{ translateY: bobUp ? -crownScale : 0 }] }}>
            <PixelArt
              art={CROWN_ART}
              colors={crownColors}
              scale={crownScale}
              accessibilityLabel={t('app.name')}
            />
          </View>
          <Text style={[styles.title, compact && styles.titleCompact]} accessibilityRole="header">
            {t('app.name')}
          </Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        <TitleMenu
          items={items}
          {...(hero ? { header: t('onboarding.welcome.welcomeBack', { name: hero.name }) } : {})}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night, overflow: 'hidden' },
  scene: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  logo: { alignItems: 'center', gap: spacing.sm },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayLg,
    color: colors.gold,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: colors.titleShadow,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  titleCompact: { fontSize: fontSize.display },
  tagline: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textDim,
    textAlign: 'center',
    maxWidth: 320,
  },
}));
