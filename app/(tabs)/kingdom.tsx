import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUILDINGS, COMPANIONS } from '@/engine/constants';
import { bestStreakAcross, nextBuilding } from '@/engine/kingdom';
import { PixelArt } from '@/sprites/PixelArt';
import { CASTLE_ART, CASTLE_COLORS, FOGGY_CASTLE_COLORS } from '@/sprites/scenes';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { ResponsiveColumns, useWideContentStyle } from '@/components/ResponsiveColumns';
import { useToast } from '@/components/ToastProvider';
import { WeeklyBossPanel } from '@/components/WeeklyBossPanel';
import { useGameStore } from '@/store/gameStore';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';

export default function KingdomScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const wideContent = useWideContentStyle();

  const kingdom = useGameStore((state) => state.kingdom);
  const habits = useGameStore((state) => state.habits);
  const hero = useGameStore((state) => state.hero);
  const buildBuilding = useGameStore((state) => state.buildBuilding);

  if (!hero) return null;

  const upcoming = nextBuilding(kingdom.buildings);
  const bestStreak = bestStreakAcross(habits);
  // The castle emerges from the fog as the kingdom is built.
  const hasBuilt = kingdom.buildings.length > 0;

  const onBuild = (): void => {
    if (!upcoming) return;

    const result = buildBuilding(upcoming.id);
    if (result.ok) {
      toast.show(t('toast.built', { building: t(`kingdom.buildings.${upcoming.id}`) }), 'success');
    } else {
      toast.show(t(`kingdom.errors.${result.reason}`), 'danger');
    }
  };

  const scene = (
    <View style={styles.scene}>
      <PixelArt
        art={CASTLE_ART}
        colors={hasBuilt ? CASTLE_COLORS : FOGGY_CASTLE_COLORS}
        scale={6}
        accessibilityLabel={t('kingdom.title')}
      />
      {!hasBuilt && <Text style={styles.fogNote}>{t('kingdom.lockedNote')}</Text>}
    </View>
  );
  const buildingPanel = (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.sectionTitle}>{t('kingdom.nextBuilding')}</Text>

      {upcoming ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>{t(`kingdom.buildings.${upcoming.id}`)}</Text>
            <Text style={styles.value}>{t('kingdom.buildCost', { cost: upcoming.cost })}</Text>
          </View>
          <PixelButton
            label={t('kingdom.build')}
            onPress={onBuild}
            disabled={hero.gold < upcoming.cost}
          />
        </>
      ) : (
        <Text style={styles.muted}>{t('kingdom.allBuilt')}</Text>
      )}

      <View style={styles.chips}>
        {BUILDINGS.map((building) => {
          const built = kingdom.buildings.includes(building.id);
          return (
            <View key={building.id} style={[styles.chip, built && styles.chipOn]}>
              <Text style={[styles.chipText, built && styles.chipTextOn]}>
                {built ? '✓ ' : ''}
                {t(`kingdom.buildings.${building.id}`)}
              </Text>
            </View>
          );
        })}
      </View>
    </PixelPanel>
  );
  const companionsPanel = (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.sectionTitle}>{t('kingdom.companions')}</Text>
      {kingdom.companions.length === 0 && (
        <Text style={styles.muted}>{t('kingdom.companionsEmpty')}</Text>
      )}
      {COMPANIONS.map((companion) => {
        const owned = kingdom.companions.includes(companion.id);
        return (
          <View key={companion.id} style={styles.row}>
            <Text style={[styles.label, !owned && styles.muted]}>
              {owned ? '✓ ' : ''}
              {t(`kingdom.companionNames.${companion.id}`)}
            </Text>
            <Text style={styles.value}>
              {owned
                ? `${bestStreak} ${t('hero.days')}`
                : t('kingdom.companionLocked', { days: companion.streakRequired })}
            </Text>
          </View>
        );
      })}
    </PixelPanel>
  );
  const trophiesPanel = (
    <PixelPanel tone="dark" style={styles.panel}>
      <Text style={styles.sectionTitle}>{t('kingdom.trophies')}</Text>
      {kingdom.trophies.length === 0 ? (
        <Text style={styles.muted}>{t('kingdom.trophiesEmpty')}</Text>
      ) : (
        kingdom.trophies.map((trophy) => (
          <View key={`${trophy.bossId}-${trophy.weekKey}`} style={styles.row}>
            <Text style={styles.label}>🏆 {t(`boss.names.${trophy.bossId}`)}</Text>
            <Text style={styles.value}>{trophy.weekKey}</Text>
          </View>
        ))
      )}
    </PixelPanel>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, wideContent]}>
      <ResponsiveColumns
        phone={
          <>
            {scene}
            <WeeklyBossPanel />
            {buildingPanel}
            {companionsPanel}
            {trophiesPanel}
          </>
        }
        main={
          <>
            {scene}
            {buildingPanel}
          </>
        }
        aside={
          <>
            <WeeklyBossPanel />
            {companionsPanel}
            {trophiesPanel}
          </>
        }
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  scene: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  fogNote: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.steel },
  panel: { gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.display, fontSize: fontSize.displayXs, color: colors.textDim },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { flex: 1, fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.text },
  value: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.gold },
  muted: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    borderWidth: 2,
    borderColor: colors.charcoal,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipOn: { borderColor: colors.xp },
  chipText: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  chipTextOn: { color: colors.xp },
}));
