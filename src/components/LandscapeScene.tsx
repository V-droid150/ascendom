import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { HeroSprite } from '@/sprites/HeroSprite';
import { PixelArt } from '@/sprites/PixelArt';
import {
  LANDSCAPE_ART,
  LANDSCAPE_COLORS,
  LANDSCAPE_HEIGHT,
  LANDSCAPE_HERO_ANCHOR,
  LANDSCAPE_WIDTH,
} from '@/sprites/landscape';
import type { SpriteRequest } from '@/sprites/types';
import { makeStyles } from '@/theme';

/** Integer scale bounds: 2 keeps it legible on a tiny window, 10 caps huge ones. */
const MIN_SCALE = 2;
const MAX_SCALE = 10;

/**
 * The integer pixel scale that makes the scene cover `width` edge to edge.
 * Rounded *up*, so the one or two scene pixels that overhang are cropped
 * evenly off both sides — which only ever trims sky and meadow.
 */
export function landscapeScaleFor(width: number, sceneWidth: number = LANDSCAPE_WIDTH): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.ceil(width / sceneWidth)));
}

/** A backdrop the hero can stand in. The meadow landscape is the default. */
export interface SceneArt {
  art: readonly string[];
  colors: Readonly<Record<string, string>>;
  width: number;
  height: number;
  /** Top-left of the hero's 32x32 sprite box, in scene pixels. */
  heroAnchor: { readonly x: number; readonly y: number };
}

export const MEADOW_SCENE: SceneArt = {
  art: LANDSCAPE_ART,
  colors: LANDSCAPE_COLORS,
  width: LANDSCAPE_WIDTH,
  height: LANDSCAPE_HEIGHT,
  heroAnchor: LANDSCAPE_HERO_ANCHOR,
};

export interface SceneHero extends Omit<SpriteRequest, 'frame'> {
  animated: boolean;
  accessibilityLabel: string;
}

interface LandscapeSceneProps {
  /** The hero standing in the meadow, or none for an empty landscape. */
  hero?: SceneHero | null;
  /** Day by default; the title screen swaps in night or bright variants. */
  palette?: Readonly<Record<string, string>>;
  /** Swap the meadow for another backdrop, such as the wardrobe. */
  scene?: SceneArt;
  /** Laid over the scene at its pixel scale, e.g. a title plaque on the wall. */
  overlay?: (scale: number) => ReactNode;
}

/**
 * The 8-bit landscape of meadow, hills, mountains and castles, filling the
 * full width of its container, optionally with the hero standing in it.
 *
 * Scene and sprite share one integer scale, so a hero pixel and a grass pixel
 * are the same size and read as a single picture.
 */
export function LandscapeScene({
  hero = null,
  palette,
  scene = MEADOW_SCENE,
  overlay,
}: LandscapeSceneProps) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent): void => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  // Until the width is known, hold the right shape so nothing jumps.
  if (width === 0) {
    return (
      <View
        style={[styles.placeholder, { aspectRatio: scene.width / scene.height }]}
        onLayout={onLayout}
      />
    );
  }

  const scale = landscapeScaleFor(width, scene.width);
  const offsetX = Math.floor((width - scene.width * scale) / 2);

  return (
    <View style={[styles.frame, { height: scene.height * scale }]} onLayout={onLayout}>
      <View style={[styles.layer, { left: offsetX }]}>
        <PixelArt art={scene.art} colors={palette ?? scene.colors} scale={scale} />
      </View>
      {hero && (
        <View
          style={[
            styles.layer,
            {
              left: offsetX + scene.heroAnchor.x * scale,
              top: scene.heroAnchor.y * scale,
            },
          ]}
        >
          <HeroSprite {...hero} scale={scale} />
        </View>
      )}
      {overlay?.(scale)}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  placeholder: { width: '100%' },
  frame: { width: '100%', overflow: 'hidden' },
  layer: { position: 'absolute', top: 0 },
}));
