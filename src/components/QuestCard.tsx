import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { localizedHabitTitle } from '@/i18n/starterTitles';
import { BAD_HABIT_DAMAGE } from '@/engine/constants';
import { baseReward, streakMultiplier } from '@/engine/rewards';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';
import type { Habit } from '@/types';
import { PixelPanel } from './PixelPanel';
import { QuestIcon } from './QuestIcon';

interface QuestCardProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

/**
 * One row on the quest board.
 *
 * The whole card is the tap target rather than a small checkbox, and a
 * long-press opens the editor — which keeps the primary action big and the
 * secondary action out of the way.
 */
export function QuestCard({ habit, completed, onToggle, onEdit }: QuestCardProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  const title = localizedHabitTitle(habit.title, t);
  const reward = baseReward(habit.difficulty);
  const multiplier = habit.type === 'daily' ? streakMultiplier(habit.streak + 1) : 1;
  const bonusPercent = Math.round((multiplier - 1) * 100);

  const subtitle = habit.isBad
    ? t('editor.badHabitNote', { damage: BAD_HABIT_DAMAGE })
    : t('editor.rewardPreview', {
        xp: Math.round(reward.xp * multiplier),
        gold: Math.round(reward.gold * multiplier),
      });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={
        completed ? t('a11y.undoQuest', { title }) : t('a11y.completeQuest', { title })
      }
      accessibilityHint={t('quests.editHint')}
      onPress={onToggle}
      onLongPress={onEdit}
      delayLongPress={400}
    >
      <PixelPanel style={[styles.card, completed && styles.cardDone]}>
        <QuestIcon icon={habit.icon} scale={2} />

        <View style={styles.text}>
          <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.right}>
          {habit.streak > 0 && !habit.isBad && (
            <Text style={styles.streak}>
              {habit.streak}
              <Text style={styles.streakUnit}>{t('quests.streakUnit')}</Text>
            </Text>
          )}
          {bonusPercent > 0 && !completed && !habit.isBad && (
            <Text style={styles.bonus}>+{bonusPercent}%</Text>
          )}
          {/* A stamp, not just a colour change: state must not rely on colour. */}
          <View style={[styles.stamp, completed && styles.stampOn]}>
            <Text style={[styles.stampMark, completed && styles.stampMarkOn]}>
              {completed ? '✓' : habit.isBad ? '!' : ''}
            </Text>
          </View>
        </View>
      </PixelPanel>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_SIZE },
  cardDone: { opacity: 0.62 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.ink },
  titleDone: { textDecorationLine: 'line-through', color: colors.inkSoft },
  meta: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.inkSoft },
  right: { alignItems: 'center', gap: 2, minWidth: 40 },
  streak: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.ember },
  streakUnit: { fontFamily: fonts.body, fontSize: fontSize.caption },
  bonus: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.xpDark },
  stamp: {
    width: 28,
    height: 28,
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampOn: { backgroundColor: colors.xp, borderColor: colors.xpDark },
  stampMark: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.hpDark,
  },
  stampMarkOn: { color: colors.night },
}));
