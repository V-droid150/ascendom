import {
  WARDROBE_ART,
  WARDROBE_COLORS,
  WARDROBE_HEIGHT,
  WARDROBE_HERO_ANCHOR,
  WARDROBE_WIDTH,
} from '@/sprites/wardrobe';
import { LandscapeScene, type SceneArt, type SceneHero } from './LandscapeScene';

const WARDROBE_SCENE: SceneArt = {
  art: WARDROBE_ART,
  colors: WARDROBE_COLORS,
  width: WARDROBE_WIDTH,
  height: WARDROBE_HEIGHT,
  heroAnchor: WARDROBE_HERO_ANCHOR,
};

/** The royal wardrobe room, edge to edge, with the hero standing on the carpet. */
export function WardrobeScene({ hero }: { hero: SceneHero }) {
  return <LandscapeScene scene={WARDROBE_SCENE} hero={hero} />;
}
