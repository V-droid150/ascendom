import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { bossDefById, bossForToday, bossHpRatio, daysLeftInBossWeek } from '@/engine/boss';
import { useGameStore } from '@/store/gameStore';
import { PixelBar } from './PixelBar';
import { PixelPanel } from './PixelPanel';
import { colors, fonts, fontSize, spacing } from '@/theme';

/**
 * The weekly boss banner on the quest board.
 *
 * Read-only: the boss is damaged as a side effect of completing quests, never
 * by tapping it. That keeps the incentive pointed at the habits rather than at
 * a combat minigame.
 */
export function WeeklyBossPanel() {
  const { t } = useTranslation();
  const storedBoss = useGameStore((state) => state.kingdom.boss);
  const todayKey = useGameStore((state) => state.todayKey);
  const hero = useGameStore((state) => state.hero);

  if (!hero) return null;

  const boss = bossForToday(storedBoss, todayKey());
  const def = bossDefById(boss.id);
  const daysLeft = daysLeftInBossWeek(boss, todayKey());

  return (
    <PixelPanel tone="dark" style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.name}>{t(`boss.names.${boss.id}`)}</Text>
        <Text style={[styles.deadline, daysLeft === 0 && styles.deadlineUrgent]}>
          {daysLeft === 0 ? t('boss.lastDay') : t('boss.daysLeft', { count: daysLeft })}
        </Text>
      </View>

      <PixelBar
        ratio={bossHpRatio(boss)}
        fill={colors.hp}
        shade={colors.hpDark}
        label={boss.defeated ? t('boss.defeated') : `${boss.hp} / ${boss.maxHp}`}
        accessibilityLabel={t('a11y.bossHpBar', { current: boss.hp, max: boss.maxHp })}
        segments={12}
      />

      {def && (
        <Text style={styles.weakness}>
          {t('boss.weakTo', { stat: t(`stat.${def.weakTo}`) })}
        </Text>
      )}
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.ember },
  deadline: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  deadlineUrgent: { color: colors.hp },
  weakness: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.mana },
});
