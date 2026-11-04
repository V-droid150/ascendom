import { useState } from 'react';
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
import { border, makeStyles } from '@/theme';

/** Integer scale bounds: 2 keeps it legible, 7 matches the old portrait size. */
const MIN_SCALE = 2;
const MAX_SCALE = 7;
/** Used for the very first render, before the container has been measured. */
const INITIAL_SCALE = 5;

interface HeroSceneProps extends Omit<SpriteRequest, 'frame'> {
  animated: boolean;
  accessibilityLabel: string;
}

/**
 * The hero standing in an 8-bit landscape of meadow, hills, mountains and
 * castles under a small sun.
 *
 * Scene and sprite share one integer scale, so a hero pixel and a grass pixel
 * are the same size and the two read as a single picture. The scale is the
 * largest integer that fits the available width.
 */
export function HeroScene({ animated, accessibilityLabel, ...sprite }: HeroSceneProps) {
  const styles = useStyles();
  const [scale, setScale] = useState(INITIAL_SCALE);

  const onLayout = (event: LayoutChangeEvent): void => {
    // The frame border sits outside the scene (content-box), so leave room for it.
    const room = event.nativeEvent.layout.width - border.widthThick * 2;
    const fit = Math.floor(room / LANDSCAPE_WIDTH);
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit));
    if (next !== scale) setScale(next);
  };

  return (
    <View style={styles.measure} onLayout={onLayout}>
      <View
        style={[styles.frame, { width: LANDSCAPE_WIDTH * scale, height: LANDSCAPE_HEIGHT * scale }]}
      >
        <PixelArt art={LANDSCAPE_ART} colors={LANDSCAPE_COLORS} scale={scale} />
        <View
          style={[
            styles.hero,
            { left: LANDSCAPE_HERO_ANCHOR.x * scale, top: LANDSCAPE_HERO_ANCHOR.y * scale },
          ]}
        >
          <HeroSprite
            {...sprite}
            scale={scale}
            animated={animated}
            accessibilityLabel={accessibilityLabel}
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  measure: { width: '100%', alignItems: 'center' },
  frame: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: border.widthThick,
    borderColor: colors.charcoal,
    boxSizing: 'content-box',
  },
  hero: { position: 'absolute' },
}));
