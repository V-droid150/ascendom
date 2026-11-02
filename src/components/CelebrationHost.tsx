import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { HeroSprite } from '@/sprites';
import { rankForLevel } from '@/engine/ranks';
import { PixelButton } from './PixelButton';
import { PixelPanel } from './PixelPanel';
import { RisingParticles } from './RisingParticles';
import { colors, fonts, fontSize, spacing, zIndex } from '@/theme';
import type { Celebration } from '@/store/types';

/**
 * Shows queued celebrations one at a time, oldest first.
 *
 * A single completion can produce several at once — level up, rank up, boss
 * defeated, companion unlocked — so they queue in the store and drain here
 * rather than racing each other for the screen.
 */
export function CelebrationHost() {
  const celebration = useGameStore((state) => state.celebrations[0]);
  const dismiss = useGameStore((state) => state.dismissCelebration);
  const hero = useGameStore((state) => state.hero);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const { t } = useTranslation();
  const haptics = useHaptics();
  const playSound = useSound();

  useEffect(() => {
    if (!celebration) return;

    switch (celebration.kind) {
      case 'levelUp':
        haptics.success();
        playSound('levelUp');
        break;
      case 'rankUp':
        haptics.success();
        playSound('rankUp');
        break;
      case 'fall':
        haptics.error();
        playSound('fall');
        break;
      case 'bossDefeated':
      case 'companion':
        haptics.success();
        playSound('coin');
        break;
      case 'welcomeBack':
        haptics.light();
        break;
    }
  }, [celebration, haptics, playSound]);

  if (!celebration) return null;

  const content = describe(celebration, t, hero?.gender ?? 'male');
  const isFall = celebration.kind === 'fall';

  return (
    <View style={styles.backdrop}>
      {!reduceMotion && !isFall && <RisingParticles color={colors.gold} />}

      <PixelPanel tone="dark" style={styles.panel}>
        <Text style={[styles.title, isFall && styles.titleFall]}>{content.title}</Text>

        {hero && (
          <View style={styles.spriteRow}>
            <HeroSprite
              gender={hero.gender}
              rank={rankForLevel(hero.level).rank}
              skinTone={hero.appearance.skinTone}
              hairStyle={hero.appearance.hairStyle}
              hairColor={hero.appearance.hairColor}
              cosmetics={hero.equippedCosmetics}
              scale={5}
              animated={!reduceMotion}
            />
          </View>
        )}

        <Text style={styles.body}>{content.body}</Text>
        {content.detail.map((line) => (
          <Text key={line} style={styles.detail}>
            {line}
          </Text>
        ))}

        <PixelButton
          label={content.cta}
          variant={isFall ? 'danger' : 'primary'}
          onPress={dismiss}
          style={styles.cta}
        />
      </PixelPanel>
    </View>
  );
}

interface CelebrationContent {
  title: string;
  body: string;
  detail: string[];
  cta: string;
}

type Translate = ReturnType<typeof useTranslation>['t'];

function describe(
  celebration: Celebration,
  t: Translate,
  gender: 'male' | 'female',
): CelebrationContent {
  switch (celebration.kind) {
    case 'levelUp':
      return {
        title: t('celebration.levelUp.title'),
        body: t('celebration.levelUp.body'),
        detail: [t('celebration.levelUp.level', { level: celebration.level })],
        cta: t('common.ok'),
      };

    case 'rankUp':
      return {
        title: t('celebration.rankUp.title'),
        body: t('celebration.rankUp.body', {
          rank: t(`rank.${celebration.rankId}.${gender}`).toUpperCase(),
        }),
        detail: [t('celebration.levelUp.level', { level: celebration.level })],
        cta: t('celebration.rankUp.cta'),
      };

    case 'fall':
      return {
        title: t('celebration.fall.title'),
        body: t('celebration.fall.body'),
        detail: [
          t('celebration.fall.lostLevel', { level: celebration.level }),
          ...(celebration.demoted
            ? [
                t('celebration.fall.demoted', {
                  rank: t(`rank.${celebration.rankId}.${gender}`),
                }),
              ]
            : []),
          ...(celebration.goldLost > 0
            ? [t('celebration.fall.lostGold', { gold: celebration.goldLost })]
            : []),
        ],
        cta: t('celebration.fall.cta'),
      };

    case 'welcomeBack':
      return {
        title: t('celebration.welcomeBack.title'),
        body: t('celebration.welcomeBack.body', { days: celebration.days }),
        detail: [],
        cta: t('celebration.welcomeBack.cta'),
      };

    case 'companion':
      return {
        title: t('celebration.companion.title'),
        body: t('celebration.companion.body', {
          name: t(`kingdom.companionNames.${celebration.id}`),
          days: celebration.days,
        }),
        detail: [],
        cta: t('common.ok'),
      };

    case 'bossDefeated':
      return {
        title: t('boss.rewardTitle'),
        body: t('boss.rewardBody', { gold: celebration.gold }),
        detail: [],
        cta: t('common.ok'),
      };
  }
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(18, 19, 34, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: zIndex.celebration,
  },
  panel: { width: '100%', alignItems: 'center', gap: spacing.md },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: colors.gold,
    textAlign: 'center',
    letterSpacing: 1,
  },
  titleFall: { color: colors.hp },
  spriteRow: { alignItems: 'center' },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
  detail: {
    fontFamily: fonts.body,
    fontSize: fontSize.bodySm,
    color: colors.textDim,
    textAlign: 'center',
  },
  cta: { marginTop: spacing.sm },
});
