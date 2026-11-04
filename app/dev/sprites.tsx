import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RANKS } from '@/engine/ranks';
import { PixelSprite } from '@/sprites';
import { HAIR_COLOR_COUNT, HAIR_COLORS, SKIN_TONES, SKIN_TONE_COUNT } from '@/sprites/palette';
import { HAIR_STYLE_COUNT, HAIR_STYLE_IDS } from '@/sprites/layers/hair';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import type { Gender } from '@/types';

const GENDERS: Gender[] = ['male', 'female'];

/**
 * Dev-only sprite lab.
 *
 * Previews every gender x rank x skin x hair combination so visual regressions
 * are obvious. Rendering all 1,728 at once would be pointless to look at and
 * slow, so the grid is sliced: pick a skin tone and hair colour, see all ranks
 * and styles for both genders.
 */
export default function SpriteLabScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [skinTone, setSkinTone] = useState(0);
  const [hairColor, setHairColor] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const combinations = useMemo(
    () => GENDERS.length * RANKS.length * SKIN_TONE_COUNT * HAIR_STYLE_COUNT * HAIR_COLOR_COUNT,
    [],
  );

  const skinTones = showAll ? SKIN_TONES.map((_, i) => i) : [skinTone];
  const hairColors = showAll ? HAIR_COLORS.map((_, i) => i) : [hairColor];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('dev.spritesTitle')}</Text>
      <Text style={styles.subtitle}>{t('dev.spritesSubtitle')}</Text>
      <Text style={styles.subtitle}>{t('dev.combinations', { count: combinations })}</Text>

      <PixelPanel style={styles.controls}>
        <Text style={styles.label}>{t('dev.skinTone')}</Text>
        <View style={styles.swatchRow}>
          {SKIN_TONES.map((ramp, index) => (
            <PixelButton
              key={ramp.id}
              label={ramp.id}
              variant={index === skinTone ? 'primary' : 'ghost'}
              onPress={() => setSkinTone(index)}
            />
          ))}
        </View>

        <Text style={styles.label}>{t('dev.hairColor')}</Text>
        <View style={styles.swatchRow}>
          {HAIR_COLORS.map((ramp, index) => (
            <PixelButton
              key={ramp.id}
              label={ramp.id}
              variant={index === hairColor ? 'primary' : 'ghost'}
              onPress={() => setHairColor(index)}
            />
          ))}
        </View>

        <PixelButton
          label={t('dev.showAll')}
          variant={showAll ? 'primary' : 'ghost'}
          onPress={() => setShowAll((value) => !value)}
        />
      </PixelPanel>

      {skinTones.map((tone) =>
        hairColors.map((color) => (
          <View key={`${tone}-${color}`}>
            <Text style={styles.sectionTitle}>
              {SKIN_TONES[tone]?.id} / {HAIR_COLORS[color]?.id}
            </Text>

            {GENDERS.map((gender) => (
              <View key={gender} style={styles.genderBlock}>
                <Text style={styles.label}>{t(`onboarding.gender.${gender}`)}</Text>

                {Array.from({ length: HAIR_STYLE_COUNT }, (_, style) => (
                  <View key={style} style={styles.styleRow}>
                    <Text style={styles.styleLabel}>{HAIR_STYLE_IDS[gender][style]}</Text>
                    <View style={styles.spriteRow}>
                      {RANKS.map((rank) => (
                        <View key={rank.rank} style={styles.spriteCell}>
                          <PixelSprite
                            gender={gender}
                            rank={rank.rank}
                            skinTone={tone}
                            hairStyle={style}
                            hairColor={color}
                            scale={3}
                          />
                          <Text style={styles.rankLabel}>{rank.rank}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )),
      )}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: colors.gold,
  },
  subtitle: { fontFamily: fonts.body, fontSize: fontSize.bodySm, color: colors.textDim },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.displayXs,
    color: colors.mana,
    marginTop: spacing.lg,
  },
  controls: { gap: spacing.sm },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.bodySm, color: colors.ink },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  genderBlock: { gap: spacing.xs, marginTop: spacing.sm },
  styleRow: { gap: spacing.xs },
  styleLabel: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.textDim },
  spriteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spriteCell: { alignItems: 'center' },
  rankLabel: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.steel },
}));
