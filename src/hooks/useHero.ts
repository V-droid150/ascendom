import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HP_MAX } from '@/engine/constants';
import { levelsToNextRank, nextRank, rankForLevel } from '@/engine/ranks';
import { levelProgressRatio, xpToNext } from '@/engine/xp';
import { useGameStore } from '@/store/gameStore';
import type { Hero } from '@/types';

export interface HeroView {
  hero: Hero;
  rankId: string;
  rankNumber: number;
  rankTitle: string;
  nextRankTitle: string | null;
  levelsToNextRank: number | null;
  xpNeeded: number;
  xpRatio: number;
  hpRatio: number;
  hpMax: number;
}

/**
 * Everything a screen needs to render the hero, derived rather than stored.
 *
 * Rank, titles and progress are all computed from level and XP by the engine,
 * so there is no second copy that can drift out of sync.
 */
export function useHero(): HeroView | null {
  const hero = useGameStore((state) => state.hero);
  const { t } = useTranslation();

  return useMemo(() => {
    if (!hero) return null;

    const rank = rankForLevel(hero.level);
    const upcoming = nextRank(hero.level);
    const xpNeeded = xpToNext(hero.level);

    return {
      hero,
      rankId: rank.id,
      rankNumber: rank.rank,
      rankTitle: t(`rank.${rank.id}.${hero.gender}`),
      nextRankTitle: upcoming ? t(`rank.${upcoming.id}.${hero.gender}`) : null,
      levelsToNextRank: levelsToNextRank(hero.level),
      xpNeeded,
      xpRatio: levelProgressRatio({ level: hero.level, xp: hero.xp }),
      hpRatio: Math.min(1, Math.max(0, hero.hp / HP_MAX)),
      hpMax: HP_MAX,
    };
  }, [hero, t]);
}
