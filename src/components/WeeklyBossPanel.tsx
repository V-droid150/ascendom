import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { bossDefById, bossForToday, bossHpRatio, daysLeftInBossWeek } from '@/engine/boss';
import { BOSS_ART } from '@/sprites/bosses';
import { PixelArt } from '@/sprites/PixelArt';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { PixelBar } from './PixelBar';
import { PixelPanel } from './PixelPanel';
import { duration, fonts, fontSize, makeStyles, spacing, useColors } from '@/theme';

/** 32px art at 2x: a 64px portrait beside the boss's name. */
const PORTRAIT_SCALE = 2;
/** A defeated boss stays on the board, faded, until the week ends. */
const DEFEATED_OPACITY = 0.35;

/**
 * The weekly boss banner on the quest board: portrait, name, lore and HP.
 *
 * Read-only: the boss is damaged as a side effect of completing quests, never
 * by tapping it. That keeps the incentive pointed at the habits rather than at
 * a combat minigame.
 */
export function WeeklyBossPanel() {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const storedBoss = useGameStore((state) => state.kingdom.boss);
  const todayKey = useGameStore((state) => state.todayKey);
  const hero = useGameStore((state) => state.hero);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const [bobUp, setBobUp] = useState(false);

  const boss = hero ? bossForToday(storedBoss, todayKey()) : null;
  const idle = !!boss && !boss.defeated && !reduceMotion;

  useEffect(() => {
    if (!idle) return;
    const timer = setInterval(() => setBobUp((up) => !up), duration.idleFrame);
    return () => clearInterval(timer);
  }, [idle]);

  if (!boss) return null;

  const def = bossDefById(boss.id);
  const daysLeft = daysLeftInBossWeek(boss, todayKey());
  const portrait = BOSS_ART[boss.id];
  const name = t(`boss.names.${boss.id}`);

  return (
    <PixelPanel tone="dark" style={styles.panel}>
      <View style={styles.top}>
        <View
          style={[
            styles.portrait,
            boss.defeated && { opacity: DEFEATED_OPACITY },
            { transform: [{ translateY: idle && bobUp ? -PORTRAIT_SCALE : 0 }] },
          ]}
        >
          <PixelArt
            art={portrait.art}
            colors={portrait.colors}
            scale={PORTRAIT_SCALE}
            accessibilityLabel={name}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name}>{name}</Text>
            <Text style={[styles.deadline, daysLeft === 0 && styles.deadlineUrgent]}>
              {daysLeft === 0 ? t('boss.lastDay') : t('boss.daysLeft', { count: daysLeft })}
            </Text>
          </View>
          <Text style={styles.lore}>{t(`boss.lore.${boss.id}`)}</Text>
        </View>
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
        <Text style={styles.weakness}>{t('boss.weakTo', { stat: t(`stat.${def.weakTo}`) })}</Text>
      )}
    </PixelPanel>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: { gap: spacing.sm },
  top: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  portrait: { flexShrink: 0 },
  info: { flex: 1, gap: spacing.xs },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  name: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.ember },
  deadline: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  deadlineUrgent: { color: colors.hp },
  lore: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.text },
  weakness: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.mana },
}));
