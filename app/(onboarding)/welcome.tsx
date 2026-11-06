import { useEffect, useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TitleBackdrop } from '@/components/TitleBackdrop';
import { TitleMenu, type TitleMenuItem } from '@/components/TitleMenu';
import { useToast } from '@/components/ToastProvider';
import { useDaytime } from '@/hooks/useDaytime';
import { useGameHydrated, useSyncHydrated } from '@/hooks/useGameHydrated';
import { useHero } from '@/hooks/useHero';
import { GOOGLE_SUPPORTED, PASSWORD_MIN_LENGTH, signInWithGoogle } from '@/services/auth';
import { PixelArt } from '@/sprites/PixelArt';
import { CROWN_ART, CROWN_COLORS } from '@/sprites/scenes';
import { TITLE_SKY, titleCourtyardClearance } from '@/sprites/titleScene';
import { useSettingsStore } from '@/store/settingsStore';
import { useSyncStore } from '@/store/syncStore';
import { duration, fonts, fontSize, makeStyles, spacing, useColors, useThemeMode } from '@/theme';

/** Below this window height the crown and title shrink so the menu still fits. */
const COMPACT_HEIGHT = 700;
const CROWN_SCALE = { compact: 6, roomy: 9 } as const;

/**
 * The title screen, opened on every launch.
 *
 * Built like a pixel RPG's: a bobbing crown and a drop-shadowed logo above a
 * JRPG menu window, centred together over a fairy-tale castle, with townsfolk
 * strolling through the courtyard below. The castle is night or day by the
 * device's real clock, and is painted to stop just under the logo, so the
 * title and tagline always sit on plain sky.
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
  const toast = useToast();
  const { userId, guest, sessionKnown, setGuest } = useSyncStore();
  // Wait for the stored session and guest choice, so neither menu flashes.
  const accountKnown = useSyncHydrated() && sessionKnown;
  // A first visit (no account, no guest choice yet) offers sign-in before play.
  const choosingAccount = accountKnown && !userId && !guest;

  const daytime = useDaytime();
  const sky = daytime ? TITLE_SKY.day : TITLE_SKY.night;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [logoBottom, setLogoBottom] = useState(0);
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

  const onLogoLayout = (event: LayoutChangeEvent): void => {
    const { y, height } = event.nativeEvent.layout;
    const bottom = Math.round(y + height);
    if (bottom !== logoBottom) setLogoBottom(bottom);
  };

  const crownColors = useMemo(() => ({ ...CROWN_COLORS, k: colors.sceneTextShadow }), [colors]);
  const compact = size.height > 0 && size.height < COMPACT_HEIGHT;
  const crownScale = compact ? CROWN_SCALE.compact : CROWN_SCALE.roomy;

  const hero = view?.hero ?? null;

  const start = (): void => {
    // A returning player skips character creation; `replace` so the back
    // gesture doesn't land them on the title screen again.
    if (hero) router.replace('/(tabs)/quests');
    else router.push('/(onboarding)/pick-gender');
  };

  const google = async (): Promise<void> => {
    const result = await signInWithGoogle('title');
    if (!result.ok)
      toast.show(t(`auth.errors.${result.error}`, { count: PASSWORD_MIN_LENGTH }), 'danger');
  };

  const accountItems: TitleMenuItem[] = [
    ...(GOOGLE_SUPPORTED
      ? [
          {
            key: 'google',
            label: t('auth.withGoogle'),
            onPress: () => void google(),
          },
        ]
      : []),
    {
      key: 'email',
      label: t('auth.withEmail'),
      onPress: () => router.push('/auth/email?from=title'),
    },
    { key: 'guest', label: t('auth.asGuest'), onPress: () => setGuest(true) },
  ];

  const startItems: TitleMenuItem[] = [
    {
      key: 'start',
      label: hero ? t('onboarding.welcome.continue') : t('onboarding.welcome.cta'),
      onPress: start,
      // Disabled while the save loads, so an early tap can't send a returning
      // player into character creation.
      disabled: !hydrated || !accountKnown,
    },
    // A guest can always go back to the account choice from the title.
    ...(guest && !userId
      ? [{ key: 'account', label: t('auth.backToAccount'), onPress: () => setGuest(false) }]
      : []),
  ];

  const items: TitleMenuItem[] = [
    ...(choosingAccount ? accountItems : startItems),
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
    <View style={[styles.screen, { backgroundColor: sky.sky }]} onLayout={onLayout}>
      <TitleBackdrop
        width={size.width}
        height={size.height}
        daytime={daytime}
        skyBottom={logoBottom}
        reduceMotion={settings.reduceMotion}
      />
      <View
        style={[
          styles.content,
          { paddingBottom: titleCourtyardClearance(size.height) + spacing.sm },
        ]}
      >
        <View style={styles.logo} onLayout={onLogoLayout}>
          <View style={{ transform: [{ translateY: bobUp ? -crownScale : 0 }] }}>
            <PixelArt
              art={CROWN_ART}
              colors={crownColors}
              scale={crownScale}
              accessibilityLabel={t('app.name')}
            />
          </View>
          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              { textShadowColor: sky.titleShadow },
            ]}
            accessibilityRole="header"
          >
            {t('app.name')}
          </Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        <TitleMenu
          overScene
          items={items}
          {...(choosingAccount
            ? { header: t('auth.titleHeader') }
            : hero
              ? { header: t('onboarding.welcome.welcomeBack', { name: hero.name }) }
              : {})}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, overflow: 'hidden' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  logo: { alignItems: 'center', gap: spacing.sm },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayLg,
    color: colors.sceneTitle,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  titleCompact: { fontSize: fontSize.display },
  tagline: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.sceneText,
    textAlign: 'center',
    maxWidth: 320,
    textShadowColor: colors.sceneTextShadow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
}));
