import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PixelSprite } from '@/sprites';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { border, colors, duration, fonts, fontSize, spacing } from '@/theme';
import type { Gender } from '@/types';

const GENDERS: Gender[] = ['male', 'female'];

export default function PickGenderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const gender = useOnboardingStore((state) => state.gender);
  const setGender = useOnboardingStore((state) => state.setGender);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{t('onboarding.gender.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.gender.subtitle')}</Text>

      <View style={styles.choices}>
        {GENDERS.map((option) => (
          <HeroChoice
            key={option}
            option={option}
            selected={gender === option}
            label={t(`onboarding.gender.${option}`)}
            onSelect={() => setGender(option)}
          />
        ))}
      </View>

      <PixelButton
        label={t('onboarding.gender.cta')}
        onPress={() => router.push('/(onboarding)/customize')}
        style={styles.cta}
      />
    </View>
  );
}

interface HeroChoiceProps {
  option: Gender;
  selected: boolean;
  label: string;
  onSelect: () => void;
}

/** Tapping a hero makes them hop, which confirms the choice without a checkmark. */
function HeroChoice({ option, selected, label, onSelect }: HeroChoiceProps) {
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const hop = useSharedValue(0);

  useEffect(() => {
    if (selected && !reduceMotion) {
      hop.value = withSequence(
        withTiming(-8, { duration: duration.instant }),
        withTiming(0, { duration: duration.fast }),
      );
    }
  }, [selected, reduceMotion, hop]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value }] }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onSelect}
      style={styles.choice}
    >
      <PixelPanel tone="dark" style={[styles.choicePanel, selected && styles.choiceSelected]}>
        <Animated.View style={style}>
          <PixelSprite
            gender={option}
            rank={1}
            skinTone={1}
            hairStyle={0}
            hairColor={0}
            scale={4}
          />
        </Animated.View>
        <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      </PixelPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: colors.gold,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.bodySm,
    color: colors.textDim,
    textAlign: 'center',
  },
  choices: { flexDirection: 'row', gap: spacing.lg },
  choice: { flex: 1 },
  choicePanel: { alignItems: 'center', gap: spacing.sm },
  choiceSelected: { borderColor: colors.gold, borderWidth: border.widthThick },
  choiceLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.bodySm,
    color: colors.textDim,
  },
  choiceLabelSelected: { color: colors.gold },
  cta: { minWidth: 200 },
});
