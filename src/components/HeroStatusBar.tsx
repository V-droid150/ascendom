import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeroSprite } from '@/sprites';
import { useHero } from '@/hooks/useHero';
import { useSettingsStore } from '@/store/settingsStore';
import { PixelBar } from './PixelBar';
import { colors, fonts, fontSize, spacing } from '@/theme';

/**
 * The persistent status strip: mini hero, HP, XP and gold.
 *
 * Every number here is derived from the engine via `useHero`, so the bar can
 * never disagree with the Hero screen.
 */
export function HeroStatusBar() {
  const view = useHero();
  const { t } = useTranslation();
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  if (!view) return null;

  const { hero } = view;

  return (
    <View style={styles.bar}>
      <HeroSprite
        gender={hero.gender}
        rank={view.rankNumber}
        skinTone={hero.appearance.skinTone}
        hairStyle={hero.appearance.hairStyle}
        hairColor={hero.appearance.hairColor}
        cosmetics={hero.equippedCosmetics}
        scale={2}
        animated={!reduceMotion}
        accessibilityLabel={t('a11y.heroSprite', {
          name: hero.name,
          rank: view.rankTitle,
          level: hero.level,
        })}
      />

      <View style={styles.bars}>
        <PixelBar
          ratio={view.hpRatio}
          fill={colors.hp}
          shade={colors.hpDark}
          label={`${hero.hp} / ${view.hpMax}`}
          accessibilityLabel={t('a11y.hpBar', { current: hero.hp, max: view.hpMax })}
          height={14}
        />
        <PixelBar
          ratio={view.xpRatio}
          fill={colors.xp}
          shade={colors.xpDark}
          label={`${t('common.levelShort')}${hero.level} · ${hero.xp}/${view.xpNeeded}`}
          accessibilityLabel={t('a11y.xpBar', { current: hero.xp, needed: view.xpNeeded })}
          height={14}
        />
      </View>

      <View style={styles.gold}>
        <Text
          style={styles.goldValue}
          accessibilityLabel={t('a11y.goldAmount', { gold: hero.gold })}
        >
          {hero.gold}
        </Text>
        <Text style={styles.goldGlyph}>◈</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.nightDeep,
    borderBottomWidth: 2,
    borderBottomColor: colors.charcoal,
  },
  bars: { flex: 1, gap: spacing.xs },
  gold: { alignItems: 'center', minWidth: 44 },
  goldValue: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.gold,
  },
  goldGlyph: { fontSize: fontSize.caption, color: colors.goldDark },
});
