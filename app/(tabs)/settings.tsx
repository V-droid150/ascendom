import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { InstallPanel } from '@/components/InstallPanel';
import { AccountPanel } from '@/components/AccountPanel';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { ResponsiveColumns, useWideContentStyle } from '@/components/ResponsiveColumns';
import { SettingRow, ToggleRow } from '@/components/SettingRow';
import { useToast } from '@/components/ToastProvider';
import {
  disableReminders,
  requestPermission,
  NOTIFICATIONS_SUPPORTED,
} from '@/services/notifications';
import { SOUND_SUPPORTED } from '@/services/sound';
import { HAPTICS_SUPPORTED } from '@/services/haptics';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';
import type { Language, ThemeMode } from '@/types';

const LANGUAGES: Language[] = ['en', 'id'];
const THEME_MODES: ThemeMode[] = ['dark', 'light'];
const DAY_START_HOURS = [0, 2, 3, 4, 5, 6];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const TIME_TRAVEL_STEP = 1;

export default function SettingsScreen() {
  const styles = useStyles();
  const wideContent = useWideContentStyle();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const settings = useSettingsStore();
  const game = useGameStore();

  const [resetStage, setResetStage] = useState<0 | 1 | 2>(0);

  const onNotificationsChange = async (value: boolean): Promise<void> => {
    if (!value) {
      settings.setNotificationsOn(false);
      disableReminders().catch(() => toast.show(t('settings.notificationsOffFailed'), 'danger'));
      return;
    }

    const outcome = await requestPermission();
    if (outcome === 'granted') {
      settings.setNotificationsOn(true);
      return;
    }

    settings.setNotificationsOn(false);
    toast.show(
      outcome === 'denied'
        ? t('settings.notificationsDenied')
        : outcome === 'signedOut'
          ? t('settings.notificationsSignIn')
          : t('settings.notificationsUnsupported'),
      'danger',
    );
  };

  const onReset = (): void => {
    game.reset();
    settings.reset();
    setResetStage(0);
    router.replace('/(onboarding)/welcome');
  };

  const generalPanel = (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.sectionTitle}>{t('settings.sectionGeneral')}</Text>

      <SettingRow label={t('settings.language')}>
        <View style={styles.chips}>
          {LANGUAGES.map((language) => (
            <Chip
              key={language}
              label={language.toUpperCase()}
              selected={settings.language === language}
              onPress={() => settings.setLanguage(language)}
            />
          ))}
        </View>
      </SettingRow>

      <SettingRow label={t('settings.theme')}>
        <View style={styles.chips}>
          {THEME_MODES.map((mode) => (
            <Chip
              key={mode}
              label={t(mode === 'dark' ? 'settings.themeDark' : 'settings.themeLight')}
              selected={settings.theme === mode}
              onPress={() => settings.setTheme(mode)}
            />
          ))}
        </View>
      </SettingRow>

      {/* Options with many chips sit under their label, not beside it, so the
          label and note keep the full width instead of being squeezed. */}
      <SettingRow label={t('settings.dayStartHour')} note={t('settings.dayStartHourNote')} />
      <View style={styles.chips}>
        {DAY_START_HOURS.map((hour) => (
          <Chip
            key={hour}
            label={`${hour}:00`}
            selected={settings.dayStartHour === hour}
            onPress={() => settings.setDayStartHour(hour)}
          />
        ))}
      </View>

      <SettingRow label={t('settings.restDay')} note={t('settings.restDayNote')} />
      <View style={styles.chips}>
        <Chip
          label={t('settings.restDayNone')}
          selected={settings.restDays.length === 0}
          onPress={() => settings.setRestDay(null)}
        />
        {WEEKDAYS.map((weekday) => (
          <Chip
            key={weekday}
            label={t(`weekday.short.${weekday}`)}
            selected={settings.restDays.includes(weekday)}
            onPress={() => settings.setRestDay(weekday)}
          />
        ))}
      </View>

      <ToggleRow
        label={t('settings.notifications')}
        value={settings.notificationsOn}
        onChange={(value) => void onNotificationsChange(value)}
        disabled={!NOTIFICATIONS_SUPPORTED}
        {...(NOTIFICATIONS_SUPPORTED ? {} : { note: t('settings.notificationsUnsupported') })}
      />
      <ToggleRow
        label={t('settings.sound')}
        value={settings.soundOn}
        onChange={settings.setSoundOn}
        disabled={!SOUND_SUPPORTED}
      />
      <ToggleRow
        label={t('settings.haptics')}
        value={settings.hapticsOn}
        onChange={settings.setHapticsOn}
        disabled={!HAPTICS_SUPPORTED}
      />
      <ToggleRow
        label={t('settings.reduceMotion')}
        value={settings.reduceMotion}
        onChange={settings.setReduceMotion}
      />
    </PixelPanel>
  );
  const heroPanel = (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.sectionTitle}>{t('settings.sectionHero')}</Text>
      <PixelButton
        label={t('settings.changeAppearance')}
        variant="secondary"
        onPress={() => router.push('/wardrobe')}
      />
      <PixelButton label={t('settings.reset')} variant="danger" onPress={() => setResetStage(1)} />
    </PixelPanel>
  );
  const devPanel =
    __DEV__ || game.devDayOffset > 0 ? (
      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.sectionTitle}>{t('settings.sectionDev')}</Text>
        <Text style={styles.note}>{t('settings.timeTravelNote')}</Text>

        {game.devDayOffset > 0 && (
          <Text style={styles.active}>
            {t('settings.timeTravelActive', { days: game.devDayOffset })}
          </Text>
        )}

        <PixelButton
          label={t('settings.timeTravel', { days: TIME_TRAVEL_STEP })}
          variant="secondary"
          onPress={() => {
            game.setDevDayOffset(game.devDayOffset + TIME_TRAVEL_STEP);
            game.runRollover();
          }}
        />
        <PixelButton
          label={t('settings.timeTravelReset')}
          variant="ghost"
          onPress={() => game.setDevDayOffset(0)}
        />
        <PixelButton
          label={t('settings.spriteLab')}
          variant="ghost"
          onPress={() => router.push('/dev/sprites')}
        />
      </PixelPanel>
    ) : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, wideContent]}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <ResponsiveColumns
        phone={
          <>
            <AccountPanel />
            {generalPanel}
            <InstallPanel />
            {heroPanel}
            {devPanel}
          </>
        }
        main={generalPanel}
        aside={
          <>
            <AccountPanel />
            <InstallPanel />
            {heroPanel}
            {devPanel}
          </>
        }
      />

      <ConfirmModal
        visible={resetStage === 1}
        title={t('settings.resetConfirm1Title')}
        body={t('settings.resetConfirm1Body')}
        destructive
        onCancel={() => setResetStage(0)}
        onConfirm={() => setResetStage(2)}
      />
      <ConfirmModal
        visible={resetStage === 2}
        title={t('settings.resetConfirm2Title')}
        body={t('settings.resetConfirm2Body')}
        confirmLabel={t('settings.reset')}
        destructive
        onCancel={() => setResetStage(0)}
        onConfirm={onReset}
      />
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { fontFamily: fonts.display, fontSize: fontSize.displaySm, color: colors.gold },
  panel: { gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.textDim },
  note: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  active: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.ember },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border.width,
    borderColor: colors.charcoal,
    borderRadius: border.radius,
  },
  chipOn: { borderColor: colors.gold, backgroundColor: colors.charcoal },
  chipText: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.textDim },
  chipTextOn: { color: colors.gold },
}));
