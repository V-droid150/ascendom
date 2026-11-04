import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelBar } from '@/components/PixelBar';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { STARTER_QUESTS } from '@/data/starterQuests';
import { HP_MAX } from '@/engine/constants';
import { useGameStore } from '@/store/gameStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { fonts, fontSize, makeStyles, spacing, useColors } from '@/theme';

/**
 * The expectations screen.
 *
 * Shown before the hero is created, not after, because the Fall is the one
 * mechanic that can make someone quit in anger. Stating it up front — and
 * immediately naming the three protections — turns a nasty surprise into an
 * accepted rule of the game.
 */
export default function PenaltyScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();

  const { gender, appearance, name, selectedQuests, reset } = useOnboardingStore();
  const createHero = useGameStore((state) => state.createHero);
  const addHabit = useGameStore((state) => state.addHabit);

  const begin = (): void => {
    createHero({ name: name.trim(), gender, appearance });

    for (const key of selectedQuests) {
      const quest = STARTER_QUESTS.find((starter) => starter.key === key);
      if (!quest) continue;

      addHabit({
        title: t(`onboarding.firstQuest.suggestions.${quest.key}`),
        icon: quest.icon,
        type: 'daily',
        difficulty: quest.difficulty,
        stat: quest.stat,
        schedule: quest.schedule,
      });
    }

    reset();
    router.replace('/(tabs)/quests');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{t('onboarding.penalty.title')}</Text>

      <PixelPanel tone="dark" style={styles.panel}>
        <PixelBar
          ratio={0.4}
          fill={colors.hp}
          shade={colors.hpDark}
          label={`40 / ${HP_MAX}`}
          accessibilityLabel={t('a11y.hpBar', { current: 40, max: HP_MAX })}
        />
        <Text style={styles.body}>{t('onboarding.penalty.body')}</Text>
        <Text style={styles.reassure}>{t('onboarding.penalty.reassure')}</Text>
      </PixelPanel>

      <PixelButton label={t('onboarding.penalty.cta')} onPress={begin} style={styles.cta} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: colors.hp,
    textAlign: 'center',
  },
  panel: { gap: spacing.md },
  body: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  reassure: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.textDim },
  cta: { alignSelf: 'center', minWidth: 200 },
}));
