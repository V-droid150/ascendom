import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChronicleHeatmap } from '@/components/ChronicleHeatmap';
import { PixelBar } from '@/components/PixelBar';
import { PixelPanel } from '@/components/PixelPanel';
import { StatsDiamond } from '@/components/StatsDiamond';
import { useHero } from '@/hooks/useHero';
import { HeroSprite } from '@/sprites';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { border, fonts, fontSize, makeStyles, spacing, useColors } from '@/theme';

export default function HeroScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const view = useHero();
  const habits = useGameStore((state) => state.habits);
  const dayResults = useGameStore((state) => state.dayResults);
  const todayKey = useGameStore((state) => state.todayKey);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  if (!view) return null;
  const { hero } = view;

  const bestStreaks = [...habits]
    .filter((habit) => habit.bestStreak > 0)
    .sort((a, b) => b.bestStreak - a.bestStreak)
    .slice(0, 5);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.portrait}>
        <HeroSprite
          gender={hero.gender}
          rank={view.rankNumber}
          skinTone={hero.appearance.skinTone}
          hairStyle={hero.appearance.hairStyle}
          hairColor={hero.appearance.hairColor}
          cosmetics={hero.equippedCosmetics}
          scale={7}
          animated={!reduceMotion}
          accessibilityLabel={t('a11y.heroSprite', {
            name: hero.name,
            rank: view.rankTitle,
            level: hero.level,
          })}
        />

        <View style={styles.banner}>
          <Text style={styles.rankTitle}>{view.rankTitle}</Text>
        </View>

        <Text style={styles.name}>{hero.name}</Text>
      </View>

      <PixelPanel tone="dark" style={styles.panel}>
        <PixelBar
          ratio={view.hpRatio}
          fill={colors.hp}
          shade={colors.hpDark}
          label={`${t('common.hp')} ${hero.hp} / ${view.hpMax}`}
          accessibilityLabel={t('a11y.hpBar', { current: hero.hp, max: view.hpMax })}
        />
        <PixelBar
          ratio={view.xpRatio}
          fill={colors.xp}
          shade={colors.xpDark}
          label={t('hero.xpToNext', { current: hero.xp, needed: view.xpNeeded })}
          accessibilityLabel={t('a11y.xpBar', { current: hero.xp, needed: view.xpNeeded })}
        />
        <Text style={styles.progressNote}>
          {view.levelsToNextRank === null || view.nextRankTitle === null
            ? t('hero.atMaxRank')
            : t('hero.toNextRank', {
                count: view.levelsToNextRank,
                rank: view.nextRankTitle,
              })}
        </Text>
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.sectionTitle}>{t('hero.stats')}</Text>
        <StatsDiamond stats={hero.stats} />
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.sectionTitle}>{t('hero.bestStreaks')}</Text>
        {bestStreaks.length === 0 ? (
          <Text style={styles.muted}>{t('hero.noStreaks')}</Text>
        ) : (
          bestStreaks.map((habit) => (
            <View key={habit.id} style={styles.statRow}>
              <Text style={styles.statLabel} numberOfLines={1}>
                {habit.title}
              </Text>
              <Text style={styles.statValue}>
                {habit.bestStreak} {t('hero.days')}
              </Text>
            </View>
          ))
        )}
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('hero.fallCount')}</Text>
          <Text style={styles.statValue}>{hero.fallCount}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{t('hero.shields')}</Text>
          <Text style={styles.statValue}>{hero.shields}</Text>
        </View>
      </PixelPanel>

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={styles.sectionTitle}>{t('hero.chronicle')}</Text>
        <Text style={styles.muted}>{t('hero.chronicleLegend')}</Text>
        {dayResults.length === 0 ? (
          <Text style={styles.muted}>{t('hero.chronicleEmpty')}</Text>
        ) : (
          <ChronicleHeatmap dayResults={dayResults} todayKey={todayKey()} />
        )}
      </PixelPanel>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  portrait: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  banner: {
    backgroundColor: colors.gold,
    borderWidth: border.width,
    borderColor: colors.goldDark,
    borderRadius: border.radius,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rankTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.ink,
    letterSpacing: 1,
  },
  name: { fontFamily: fonts.bodyBold, fontSize: fontSize.title, color: colors.text },
  panel: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.textDim,
  },
  progressNote: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.mana },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  statLabel: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  statValue: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.gold },
  muted: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
}));
