import { Text, View } from 'react-native';
import {
  WARDROBE_ART,
  WARDROBE_COLORS,
  WARDROBE_HEIGHT,
  WARDROBE_HERO_ANCHOR,
  WARDROBE_PLAQUE,
  WARDROBE_WIDTH,
} from '@/sprites/wardrobe';
import { border, fonts, fontSize, makeStyles, spacing } from '@/theme';
import { LandscapeScene, type SceneArt, type SceneHero } from './LandscapeScene';

const WARDROBE_SCENE: SceneArt = {
  art: WARDROBE_ART,
  colors: WARDROBE_COLORS,
  width: WARDROBE_WIDTH,
  height: WARDROBE_HEIGHT,
  heroAnchor: WARDROBE_HERO_ANCHOR,
};

/** The plaque hangs just under the ceiling beam and its gold trim (rows 0-2). */
const PLAQUE_TOP_ROW = 3;

/**
 * The royal wardrobe room, edge to edge, with the hero standing on the carpet
 * and the screen title on a dark wooden plaque nailed to the wall.
 */
export function WardrobeScene({ hero, title }: { hero: SceneHero; title: string }) {
  const styles = useStyles();

  return (
    <LandscapeScene
      scene={WARDROBE_SCENE}
      hero={hero}
      overlay={(scale) => (
        <View style={[styles.plaqueRow, { top: PLAQUE_TOP_ROW * scale }]} pointerEvents="none">
          <View style={styles.plaque}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const useStyles = makeStyles(() => ({
  plaqueRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  plaque: {
    backgroundColor: WARDROBE_PLAQUE.fill,
    borderWidth: border.width,
    borderColor: WARDROBE_PLAQUE.border,
    borderBottomColor: WARDROBE_PLAQUE.borderShade,
    borderRightColor: WARDROBE_PLAQUE.borderShade,
    borderRadius: border.radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.displaySm,
    color: WARDROBE_PLAQUE.text,
    textAlign: 'center',
  },
}));
