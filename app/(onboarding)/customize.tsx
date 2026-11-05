import { ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppearancePicker } from '@/components/AppearancePicker';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { WardrobeScene } from '@/components/WardrobeScene';
import { WARDROBE_PLAQUE } from '@/sprites/wardrobe';
import { useSettingsStore } from '@/store/settingsStore';
import { HERO_NAME_MAX_LENGTH, useOnboardingStore } from '@/store/onboardingStore';
import { useToast } from '@/components/ToastProvider';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

/** Onboarding heroes start as peasants, so the preview shows rank 1 gear. */
const STARTING_RANK = 1;

export default function CustomizeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const { gender, appearance, name, setAppearance, setName } = useOnboardingStore();
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);

  const next = (): void => {
    if (name.trim().length === 0) {
      toast.show(t('onboarding.customize.nameRequired'), 'danger');
      return;
    }
    router.push('/(onboarding)/first-quest');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.bleed}>
        <WardrobeScene
          title={t('onboarding.customize.title')}
          hero={{
            gender,
            rank: STARTING_RANK,
            skinTone: appearance.skinTone,
            hairStyle: appearance.hairStyle,
            hairColor: appearance.hairColor,
            animated: !reduceMotion,
            accessibilityLabel: t('onboarding.customize.title'),
          }}
        />
      </View>

      <PixelPanel style={styles.panel}>
        <AppearancePicker gender={gender} appearance={appearance} onChange={setAppearance} />

        <View style={styles.group}>
          <Text style={styles.label}>{t('onboarding.customize.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={HERO_NAME_MAX_LENGTH}
            placeholder={t('onboarding.customize.namePlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            accessibilityLabel={t('onboarding.customize.nameLabel')}
            returnKeyType="done"
            onSubmitEditing={next}
          />
        </View>
      </PixelPanel>

      <PixelButton label={t('onboarding.customize.cta')} onPress={next} />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  // The wardrobe floor continues below the scene, as on the Settings wardrobe.
  screen: { flex: 1, backgroundColor: WARDROBE_PLAQUE.floor },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  // Negative margins cancel the screen padding so the scene runs edge to edge.
  bleed: { marginTop: -spacing.lg, marginHorizontal: -spacing.lg },
  panel: { gap: spacing.lg },
  group: { gap: spacing.xs },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.ink },
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.ink,
    backgroundColor: colors.parchmentDark,
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_SIZE,
  },
}));
