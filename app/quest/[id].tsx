import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { QuestIcon } from '@/components/QuestIcon';
import { ToggleRow } from '@/components/SettingRow';
import { useToast } from '@/components/ToastProvider';
import { BAD_HABIT_DAMAGE, STAT_KEYS } from '@/engine/constants';
import { baseReward } from '@/engine/rewards';
import { DEFAULT_QUEST_ICON, QUEST_ICON_IDS } from '@/sprites/icons';
import { localizedHabitTitle } from '@/i18n/starterTitles';
import { useGameStore, type HabitDraft } from '@/store/gameStore';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';
import type { Difficulty, HabitType, StatKey } from '@/types';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const TYPES: HabitType[] = ['daily', 'quest'];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const EVERY_DAY = WEEKDAYS;

/**
 * Create and edit a quest.
 *
 * One screen for both: `/quest/new` creates, `/quest/<id>` edits. Keeping them
 * together means the field set, validation and reward preview can't drift apart.
 */
export default function QuestEditorScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const habits = useGameStore((state) => state.habits);
  const addHabit = useGameStore((state) => state.addHabit);
  const updateHabit = useGameStore((state) => state.updateHabit);
  const setArchived = useGameStore((state) => state.setArchived);
  const deleteHabit = useGameStore((state) => state.deleteHabit);

  const existing = useMemo(() => habits.find((habit) => habit.id === id), [habits, id]);
  const isNew = id === 'new' || !existing;

  const [title, setTitle] = useState(existing ? localizedHabitTitle(existing.title, t) : '');
  const [icon, setIcon] = useState<string>(existing?.icon ?? DEFAULT_QUEST_ICON);
  const [type, setType] = useState<HabitType>(existing?.type ?? 'daily');
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? 'medium');
  const [stat, setStat] = useState<StatKey>(existing?.stat ?? 'strength');
  const [schedule, setSchedule] = useState<number[]>(existing?.schedule ?? EVERY_DAY);
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '');
  const [isBad, setIsBad] = useState(existing?.isBad ?? false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reward = baseReward(difficulty);

  const toggleWeekday = (weekday: number): void =>
    setSchedule((current) =>
      current.includes(weekday)
        ? current.filter((day) => day !== weekday)
        : [...current, weekday].sort(),
    );

  const save = (): void => {
    if (title.trim().length === 0) {
      toast.show(t('editor.titleRequired'), 'danger');
      return;
    }
    if (type === 'daily' && !isBad && schedule.length === 0) {
      toast.show(t('editor.scheduleRequired'), 'danger');
      return;
    }

    const draft: HabitDraft = {
      title: title.trim(),
      icon,
      type,
      difficulty,
      stat,
      schedule: type === 'daily' ? schedule : [],
      isBad,
      ...(reminderTime.trim().length > 0 ? { reminderTime: reminderTime.trim() } : {}),
    };

    if (isNew) {
      addHabit(draft);
    } else {
      updateHabit(existing.id, draft);
    }

    toast.show(t('toast.questSaved'), 'success');
    router.back();
  };

  const remove = (): void => {
    if (!existing) return;
    deleteHabit(existing.id);
    setConfirmDelete(false);
    toast.show(t('toast.questDeleted'));
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isNew ? t('editor.createTitle') : t('editor.editTitle')}</Text>

      <PixelPanel style={styles.panel}>
        <Field label={t('editor.titleLabel')}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('editor.titlePlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            accessibilityLabel={t('editor.titleLabel')}
          />
        </Field>

        <Field label={t('editor.iconLabel')}>
          <View style={styles.chips}>
            {QUEST_ICON_IDS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: icon === option }}
                accessibilityLabel={option}
                onPress={() => setIcon(option)}
                style={[styles.iconOption, icon === option && styles.iconSelected]}
              >
                <QuestIcon icon={option} scale={2} />
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label={t('editor.typeLabel')}>
          <View style={styles.chips}>
            {TYPES.map((option) => (
              <Chip
                key={option}
                label={t(`habitType.${option}`)}
                selected={type === option}
                onPress={() => setType(option)}
              />
            ))}
          </View>
        </Field>

        <Field label={t('editor.difficultyLabel')}>
          <View style={styles.chips}>
            {DIFFICULTIES.map((option) => (
              <Chip
                key={option}
                label={t(`difficulty.${option}`)}
                selected={difficulty === option}
                onPress={() => setDifficulty(option)}
              />
            ))}
          </View>
          <Text style={styles.preview}>
            {t('editor.rewardPreview', { xp: reward.xp, gold: reward.gold })}
          </Text>
        </Field>

        <Field label={t('editor.statLabel')}>
          <View style={styles.chips}>
            {STAT_KEYS.map((option) => (
              <Chip
                key={option}
                label={t(`stat.${option}`)}
                selected={stat === option}
                onPress={() => setStat(option)}
              />
            ))}
          </View>
        </Field>

        {type === 'daily' && (
          <Field label={t('editor.scheduleLabel')}>
            <View style={styles.chips}>
              {WEEKDAYS.map((weekday) => (
                <Chip
                  key={weekday}
                  label={t(`weekday.short.${weekday}`)}
                  selected={schedule.includes(weekday)}
                  onPress={() => toggleWeekday(weekday)}
                  accessibilityLabel={t('a11y.selectWeekday', {
                    day: t(`weekday.long.${weekday}`),
                  })}
                />
              ))}
            </View>
            <Pressable onPress={() => setSchedule(EVERY_DAY)} accessibilityRole="button">
              <Text style={styles.link}>{t('editor.scheduleEveryDay')}</Text>
            </Pressable>
          </Field>
        )}

        <Field label={t('editor.reminderLabel')}>
          <TextInput
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="20:00"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            accessibilityLabel={t('editor.reminderLabel')}
            maxLength={5}
          />
        </Field>
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <ToggleRow
          label={t('editor.badHabitLabel')}
          note={t('editor.badHabitNote', { damage: BAD_HABIT_DAMAGE })}
          value={isBad}
          onChange={setIsBad}
        />
      </PixelPanel>

      <PixelButton label={t('common.save')} onPress={save} />

      {!isNew && (
        <>
          <PixelButton
            label={existing.archived ? t('editor.unarchive') : t('editor.archive')}
            variant="secondary"
            onPress={() => {
              setArchived(existing.id, !existing.archived);
              toast.show(t('toast.questArchived'));
              router.back();
            }}
          />
          <PixelButton
            label={t('common.delete')}
            variant="danger"
            onPress={() => setConfirmDelete(true)}
          />
        </>
      )}

      <PixelButton label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />

      <ConfirmModal
        visible={confirmDelete}
        title={t('editor.deleteConfirmTitle')}
        body={t('editor.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  title: { fontFamily: fonts.display, fontSize: fontSize.displaySm, color: colors.gold },
  panel: { gap: spacing.lg },
  field: { gap: spacing.xs },
  fieldLabel: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.ink },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.parchmentDark,
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: 36,
    minWidth: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
  },
  chipOn: { borderColor: colors.ink, backgroundColor: colors.parchmentDark },
  chipText: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.inkSoft },
  chipTextOn: { color: colors.ink },
  iconOption: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    backgroundColor: colors.night,
  },
  iconSelected: { borderColor: colors.gold, borderWidth: border.widthThick },
  preview: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.xpDark },
  link: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
    paddingVertical: spacing.xs,
  },
}));
