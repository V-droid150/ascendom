import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { SettingRow, ToggleRow } from '@/components/SettingRow';
import { useToast } from '@/components/ToastProvider';
import { requestPermission, NOTIFICATIONS_SUPPORTED } from '@/services/notifications';
import { SOUND_SUPPORTED } from '@/services/sound';
import { HAPTICS_SUPPORTED } from '@/services/haptics';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { border, colors, fonts, fontSize, MIN_TOUCH_SIZE, spacing } from '@/theme';
import type { Language } from '@/types';

const LANGUAGES: Language[] = ['id', 'en'];
const DAY_START_HOURS = [0, 2, 3, 4, 5, 6];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const TIME_TRAVEL_STEP = 1;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const settings = useSettingsStore();
  const game = useGameStore();

  const [importText, setImportText] = useState('');
  const [resetStage, setResetStage] = useState<0 | 1 | 2>(0);

  const onNotificationsChange = async (value: boolean): Promise<void> => {
    if (!value) {
      settings.setNotificationsOn(false);
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
        : t('settings.notificationsUnsupported'),
      'danger',
    );
  };

  const onExport = (): void => {
    const json = JSON.stringify(game.exportBundle(), null, 2);
    setImportText(json);
    toast.show(t('settings.exportCopied'), 'success');
  };

  const onImport = (): void => {
    const result = game.importBundle(importText);
    if (result.ok) {
      toast.show(t('settings.importSuccess'), 'success');
      setImportText('');
    } else {
      toast.show(t('settings.importFailed'), 'danger');
    }
  };

  const onReset = (): void => {
    game.reset();
    settings.reset();
    setResetStage(0);
    router.replace('/(onboarding)/welcome');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.title')}</Text>

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

        <SettingRow label={t('settings.dayStartHour')} note={t('settings.dayStartHourNote')}>
          <View style={styles.chips}>
            {DAY_START_HOURS.map((hour) => (
              <Chip
                key={hour}
                label={`${hour}`}
                selected={settings.dayStartHour === hour}
                onPress={() => settings.setDayStartHour(hour)}
              />
            ))}
          </View>
        </SettingRow>

        <SettingRow label={t('settings.restDay')} note={t('settings.restDayNote')}>
          <View />
        </SettingRow>
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

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.sectionTitle}>{t('settings.sectionHero')}</Text>
        <PixelButton
          label={t('settings.changeAppearance')}
          variant="secondary"
          onPress={() => router.push('/(onboarding)/customize')}
        />
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.sectionTitle}>{t('settings.sectionData')}</Text>

        <PixelButton label={t('settings.exportData')} variant="secondary" onPress={onExport} />

        <TextInput
          value={importText}
          onChangeText={setImportText}
          placeholder={t('settings.importPlaceholder')}
          placeholderTextColor={colors.steel}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          accessibilityLabel={t('settings.importData')}
        />

        <PixelButton
          label={t('settings.importData')}
          variant="secondary"
          onPress={onImport}
          disabled={importText.trim().length === 0}
        />

        <PixelButton
          label={t('settings.reset')}
          variant="danger"
          onPress={() => setResetStage(1)}
        />
      </PixelPanel>

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

const styles = StyleSheet.create({
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
  textArea: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.text,
    backgroundColor: colors.nightDeep,
    borderWidth: border.width,
    borderColor: colors.charcoal,
    borderRadius: border.radius,
    padding: spacing.sm,
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
