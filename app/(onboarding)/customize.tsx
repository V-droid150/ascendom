import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelSprite } from '@/sprites';
import { HAIR_COLORS, SKIN_TONES } from '@/sprites/palette';
import { HAIR_STYLE_COUNT, HAIR_STYLE_IDS } from '@/sprites/layers/hair';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { SwatchPicker } from '@/components/SwatchPicker';
import { HERO_NAME_MAX_LENGTH, useOnboardingStore } from '@/store/onboardingStore';
import { useToast } from '@/components/ToastProvider';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

export default function CustomizeScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const { gender, appearance, name, setAppearance, setName } = useOnboardingStore();

  const next = (): void => {
    if (name.trim().length === 0) {
      toast.show(t('onboarding.customize.nameRequired'), 'danger');
      return;
    }
    router.push('/(onboarding)/first-quest');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('onboarding.customize.title')}</Text>

      <View style={styles.preview}>
        <PixelSprite
          gender={gender}
          rank={1}
          skinTone={appearance.skinTone}
          hairStyle={appearance.hairStyle}
          hairColor={appearance.hairColor}
          scale={6}
          accessibilityLabel={t('onboarding.customize.title')}
        />
      </View>

      <PixelPanel style={styles.panel}>
        <SwatchPicker
          label={t('onboarding.customize.skinTone')}
          swatches={SKIN_TONES.map((ramp) => ramp.base)}
          optionLabels={SKIN_TONES.map((ramp) => ramp.id)}
          value={appearance.skinTone}
          onChange={(skinTone) => setAppearance({ skinTone })}
        />

        <SwatchPicker
          label={t('onboarding.customize.hairColor')}
          swatches={HAIR_COLORS.map((ramp) => ramp.base)}
          optionLabels={HAIR_COLORS.map((ramp) => ramp.id)}
          value={appearance.hairColor}
          onChange={(hairColor) => setAppearance({ hairColor })}
        />

        <View style={styles.group}>
          <Text style={styles.label}>{t('onboarding.customize.hairStyle')}</Text>
          <View style={styles.row}>
            {Array.from({ length: HAIR_STYLE_COUNT }, (_, style) => {
              const selected = style === appearance.hairStyle;
              return (
                <Pressable
                  key={style}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={HAIR_STYLE_IDS[gender][style]}
                  onPress={() => setAppearance({ hairStyle: style })}
                  style={[styles.styleOption, selected && styles.styleSelected]}
                >
                  <PixelSprite
                    gender={gender}
                    rank={1}
                    skinTone={appearance.skinTone}
                    hairStyle={style}
                    hairColor={appearance.hairColor}
                    scale={2}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

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
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: colors.gold,
    textAlign: 'center',
  },
  preview: { alignItems: 'center' },
  panel: { gap: spacing.lg },
  group: { gap: spacing.xs },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  styleOption: {
    padding: spacing.xs,
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    backgroundColor: colors.night,
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleSelected: { borderColor: colors.gold, borderWidth: border.widthThick },
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
