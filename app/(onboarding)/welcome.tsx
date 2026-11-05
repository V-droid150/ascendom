import { useEffect, useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TitleMenu, type TitleMenuItem } from '@/components/TitleMenu';
import { useToast } from '@/components/ToastProvider';
import { useGameHydrated, useSyncHydrated } from '@/hooks/useGameHydrated';
import { useHero } from '@/hooks/useHero';
import { GOOGLE_SUPPORTED, PASSWORD_MIN_LENGTH, signInWithGoogle } from '@/services/auth';
import { PixelArt } from '@/sprites/PixelArt';
import { CROWN_ART, CROWN_COLORS } from '@/sprites/scenes';
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
 * JRPG menu window, centred on a plain background so nothing crowds the menu.
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
    <View style={styles.screen} onLayout={onLayout}>
      <View style={styles.content}>
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
  screen: { flex: 1, backgroundColor: colors.night, overflow: 'hidden' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xl,
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
