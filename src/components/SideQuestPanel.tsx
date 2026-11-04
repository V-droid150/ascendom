import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useHaptics';
import { useSideQuests, type TodaySideQuest } from '@/hooks/useSideQuests';
import { useSound } from '@/hooks/useSound';
import { useGameStore } from '@/store/gameStore';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';
import { PixelPanel } from './PixelPanel';
import { QuestIcon } from './QuestIcon';
import { useToast } from './ToastProvider';

/**
 * Today's rotating side quests.
 *
 * Shown above the user's own habits as a small, optional bonus. They change at
 * every day rollover, so the board has something new each morning.
 */
export function SideQuestPanel() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const haptics = useHaptics();
  const playSound = useSound();

  const { quests, reward } = useSideQuests();
  const completeSide = useGameStore((state) => state.completeSide);
  const undoSide = useGameStore((state) => state.undoSide);

  if (quests.length === 0) return null;

  const onToggle = (quest: TodaySideQuest): void => {
    if (quest.completed) {
      if (undoSide(quest.id).ok) {
        haptics.light();
        toast.show(t('toast.undone'));
      }
      return;
    }

    const result = completeSide(quest.id);
    if (!result.ok) return;

    haptics.success();
    playSound('coin');
    toast.show(t('toast.reward', { xp: result.xp, gold: result.gold }), 'success');
  };

  return (
    <PixelPanel tone="dark" style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('sideQuests.title')}</Text>
        <Text style={styles.subtitle}>{t('sideQuests.subtitle')}</Text>
      </View>

      {quests.map((quest) => {
        const title = t(`sideQuests.pool.${quest.id}`);
        return (
          <Pressable
            key={quest.id}
            accessibilityRole="button"
            accessibilityState={{ checked: quest.completed }}
            accessibilityLabel={
              quest.completed ? t('a11y.undoQuest', { title }) : t('a11y.completeQuest', { title })
            }
            onPress={() => onToggle(quest)}
            style={[styles.row, quest.completed && styles.rowDone]}
          >
            <QuestIcon icon={quest.icon} scale={2} />
            <View style={styles.text}>
              <Text style={[styles.questTitle, quest.completed && styles.questTitleDone]}>
                {title}
              </Text>
              <Text style={styles.meta}>
                {t('editor.rewardPreview', { xp: reward.xp, gold: reward.gold })}
              </Text>
            </View>
            {/* A stamp, not just a colour change: state must not rely on colour. */}
            <View style={[styles.stamp, quest.completed && styles.stampOn]}>
              <Text style={styles.stampMark}>{quest.completed ? '✓' : ''}</Text>
            </View>
          </Pressable>
        );
      })}
    </PixelPanel>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: { gap: spacing.sm },
  header: { gap: 2 },
  title: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.gold },
  subtitle: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
    padding: spacing.sm,
    borderWidth: border.width,
    borderColor: colors.charcoal,
    borderRadius: border.radius,
  },
  rowDone: { opacity: 0.62 },
  text: { flex: 1, gap: 2 },
  questTitle: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.text },
  questTitleDone: { textDecorationLine: 'line-through', color: colors.textDim },
  meta: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  stamp: {
    width: 28,
    height: 28,
    borderWidth: border.width,
    borderColor: colors.gold,
    borderRadius: border.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampOn: { backgroundColor: colors.gold },
  stampMark: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.onAccent },
}));
