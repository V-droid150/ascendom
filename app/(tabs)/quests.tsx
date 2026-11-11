import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HeroStatusBar } from '@/components/HeroStatusBar';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { QuestCard } from '@/components/QuestCard';
import { ResponsiveColumns, useWideContentStyle } from '@/components/ResponsiveColumns';
import { SideQuestPanel } from '@/components/SideQuestPanel';
import { useToast } from '@/components/ToastProvider';
import { WeeklyBossPanel } from '@/components/WeeklyBossPanel';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { useTodayQuests } from '@/hooks/useTodayQuests';
import { useGameStore } from '@/store/gameStore';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import type { Habit } from '@/types';

export default function QuestsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const haptics = useHaptics();
  const playSound = useSound();
  const wideContent = useWideContentStyle();

  const quests = useTodayQuests();
  const complete = useGameStore((state) => state.complete);
  const undo = useGameStore((state) => state.undo);
  const logBad = useGameStore((state) => state.logBad);

  const onToggle = (habit: Habit): void => {
    if (habit.isBad) {
      const result = logBad(habit.id);
      if (result.ok) {
        haptics.warning();
        toast.show(t('toast.badLogged', { damage: result.damage }), 'danger');
      }
      return;
    }

    if (quests.completedIds.has(habit.id)) {
      const result = undo(habit.id);
      if (result.ok) {
        haptics.light();
        toast.show(t('toast.undone'));
      } else {
        toast.show(t('toast.undoTooLate'), 'danger');
      }
      return;
    }

    const result = complete(habit.id);
    if (!result.ok) {
      toast.show(t('toast.undoTooLate'), 'danger');
      return;
    }

    haptics.success();
    playSound('coin');

    const bonus = Math.round((result.multiplier - 1) * 100);
    toast.show(
      bonus > 0
        ? t('toast.rewardWithBonus', { xp: result.xp, gold: result.gold, bonus })
        : t('toast.reward', { xp: result.xp, gold: result.gold }),
      'success',
    );
  };

  const openEditor = (habit: Habit): void => router.push(`/quest/${habit.id}`);

  const renderSection = (title: string, habits: Habit[]) => {
    if (habits.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {habits.map((habit) => (
          <QuestCard
            key={habit.id}
            habit={habit}
            completed={quests.completedIds.has(habit.id)}
            onToggle={() => onToggle(habit)}
            onEdit={() => openEditor(habit)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <HeroStatusBar />

      <ScrollView contentContainerStyle={[styles.content, wideContent]}>
        {/* Wide windows: the day's quests on the left, boss and side quests beside them. */}
        <ResponsiveColumns
          asideFirstOnPhone
          aside={
            <>
              <WeeklyBossPanel />
              <SideQuestPanel />
            </>
          }
          main={
            quests.isEmpty ? (
              <PixelPanel style={styles.empty}>
                <Text style={styles.emptyText}>{t('quests.empty')}</Text>
              </PixelPanel>
            ) : (
              <>
                {quests.allDone && (
                  <PixelPanel tone="dark" style={styles.allDone}>
                    <Text style={styles.allDoneText}>{t('quests.allDone')}</Text>
                  </PixelPanel>
                )}

                {renderSection(t('quests.dailies'), quests.dailies)}
                {quests.dailies.length === 0 && (
                  <Text style={styles.note}>{t('quests.emptyToday')}</Text>
                )}
                {renderSection(t('quests.oneTime'), quests.oneTime)}
                {renderSection(t('quests.badHabits'), quests.bad)}
              </>
            )
          }
        />
      </ScrollView>

      <View style={styles.fab}>
        <PixelButton
          label={`+ ${t('quests.newQuest')}`}
          onPress={() => router.push('/quest/new')}
          accessibilityLabel={t('a11y.addQuest')}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 96 },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.textDim,
    marginTop: spacing.xs,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.ink,
    textAlign: 'center',
  },
  allDone: { alignItems: 'center' },
  allDoneText: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.xp },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSize.bodySm,
    color: colors.textDim,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
}));
