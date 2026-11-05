import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppearancePicker } from '@/components/AppearancePicker';
import { PixelButton } from '@/components/PixelButton';
import { PixelPanel } from '@/components/PixelPanel';
import { useToast } from '@/components/ToastProvider';
import { WardrobeScene } from '@/components/WardrobeScene';
import { useHero } from '@/hooks/useHero';
import { WARDROBE_PLAQUE } from '@/sprites/wardrobe';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, fontSize, makeStyles, spacing } from '@/theme';
import type { Appearance } from '@/types';

/**
 * The royal wardrobe, opened from Settings: change the hero's look in place.
 *
 * Unlike onboarding, this never creates a hero. It edits a draft and saves it
 * through `restyle`, which only touches appearance, so level, gold, quests,
 * streaks and the kingdom are all untouched. Leaving without saving discards
 * the draft.
 */
export default function WardrobeScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const view = useHero();
  const restyle = useGameStore((state) => state.restyle);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const [draft, setDraft] = useState<Appearance | null>(view?.hero.appearance ?? null);

  if (!view || !draft) return <Redirect href="/" />;
  const { hero } = view;

  const leave = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/settings');
  };

  const save = (): void => {
    restyle({ appearance: draft });
    toast.show(t('wardrobe.saved'), 'success');
    leave();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.bleed}>
        <WardrobeScene
          title={t('onboarding.customize.title')}
          hero={{
            gender: hero.gender,
            rank: view.rankNumber,
            skinTone: draft.skinTone,
            hairStyle: draft.hairStyle,
            hairColor: draft.hairColor,
            cosmetics: hero.equippedCosmetics,
            animated: !reduceMotion,
            accessibilityLabel: t('a11y.heroSprite', {
              name: hero.name,
              rank: view.rankTitle,
              level: hero.level,
            }),
          }}
        />
      </View>

      <Text style={styles.note}>{t('wardrobe.keepsProgress')}</Text>

      <PixelPanel style={styles.panel}>
        <AppearancePicker
          gender={hero.gender}
          appearance={draft}
          onChange={(changes) => setDraft({ ...draft, ...changes })}
        />
      </PixelPanel>

      <View style={styles.actions}>
        <PixelButton label={t('wardrobe.save')} onPress={save} />
        <PixelButton label={t('wardrobe.cancel')} variant="ghost" onPress={leave} />
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles(() => ({
  // The room's floor colour continues below the scene, so the whole screen
  // reads as the wardrobe rather than a picture on a black page.
  screen: { flex: 1, backgroundColor: WARDROBE_PLAQUE.floor },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxxl },
  // Negative margins cancel the screen padding so the scene runs edge to edge.
  bleed: { marginTop: -spacing.md, marginHorizontal: -spacing.md },
  note: {
    fontFamily: fonts.body,
    fontSize: fontSize.bodySm,
    color: WARDROBE_PLAQUE.text,
    textAlign: 'center',
  },
  panel: { gap: spacing.lg },
  actions: { gap: spacing.sm },
}));
