import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PixelSprite } from '@/sprites';
import { HAIR_COLORS, SKIN_TONES } from '@/sprites/palette';
import { HAIR_STYLE_COUNT, HAIR_STYLE_IDS } from '@/sprites/layers/hair';
import { border, fonts, fontSize, makeStyles, MIN_TOUCH_SIZE, spacing } from '@/theme';
import type { Appearance, Gender } from '@/types';
import { SwatchPicker } from './SwatchPicker';

/** Hair style thumbnails: 32px art at 2x. */
const THUMB_SCALE = 2;

interface AppearancePickerProps {
  gender: Gender;
  appearance: Appearance;
  onChange: (changes: Partial<Appearance>) => void;
}

/**
 * Skin tone, hair colour and hair style. Shared by onboarding and the royal
 * wardrobe, so a new hero and a veteran pick from exactly the same options.
 */
export function AppearancePicker({ gender, appearance, onChange }: AppearancePickerProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <>
      <SwatchPicker
        label={t('onboarding.customize.skinTone')}
        swatches={SKIN_TONES.map((ramp) => ramp.base)}
        optionLabels={SKIN_TONES.map((ramp) => ramp.id)}
        value={appearance.skinTone}
        onChange={(skinTone) => onChange({ skinTone })}
      />

      <SwatchPicker
        label={t('onboarding.customize.hairColor')}
        swatches={HAIR_COLORS.map((ramp) => ramp.base)}
        optionLabels={HAIR_COLORS.map((ramp) => ramp.id)}
        value={appearance.hairColor}
        onChange={(hairColor) => onChange({ hairColor })}
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
                accessibilityLabel={t(`hairStyles.${HAIR_STYLE_IDS[gender][style]}`)}
                onPress={() => onChange({ hairStyle: style })}
                style={[styles.styleOption, selected && styles.styleSelected]}
              >
                <PixelSprite
                  gender={gender}
                  rank={1}
                  skinTone={appearance.skinTone}
                  hairStyle={style}
                  hairColor={appearance.hairColor}
                  withWeapon={false}
                  scale={THUMB_SCALE}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  group: { gap: spacing.xs },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  styleOption: {
    padding: spacing.xs,
    borderWidth: border.width,
    borderColor: colors.parchmentShadow,
    borderRadius: border.radius,
    backgroundColor: colors.parchmentDark,
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleSelected: { borderColor: colors.gold, borderWidth: border.widthThick },
}));
