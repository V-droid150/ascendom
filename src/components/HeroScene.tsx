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
import { makeStyles } from '@/theme';

/** Integer scale bounds: 2 keeps it legible on a tiny window, 10 caps huge ones. */
const MIN_SCALE = 2;
const MAX_SCALE = 10;

interface HeroSceneProps extends Omit<SpriteRequest, 'frame'> {
  animated: boolean;
  accessibilityLabel: string;
}

/**
 * The hero standing in an 8-bit landscape of meadow, hills, mountains and
 * castles under a small sun, filling the full width of the screen.
 *
 * Scene and sprite share one integer scale, so a hero pixel and a grass pixel
 * are the same size and read as a single picture. The scale is rounded *up* so
 * the scene always covers the width edge to edge; the one or two scene pixels
 * that overhang are cropped evenly off both sides, which only trims sky and
 * meadow, never the castles.
 */
export function HeroScene({ animated, accessibilityLabel, ...sprite }: HeroSceneProps) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent): void => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  // Until the width is known, hold the right shape so nothing jumps.
  if (width === 0) {
    return <View style={styles.placeholder} onLayout={onLayout} />;
  }

  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.ceil(width / LANDSCAPE_WIDTH)));
  const offsetX = Math.floor((width - LANDSCAPE_WIDTH * scale) / 2);

  return (
    <View style={[styles.frame, { height: LANDSCAPE_HEIGHT * scale }]} onLayout={onLayout}>
      <View style={[styles.layer, { left: offsetX }]}>
        <PixelArt art={LANDSCAPE_ART} colors={LANDSCAPE_COLORS} scale={scale} />
      </View>
      <View
        style={[
          styles.layer,
          {
            left: offsetX + LANDSCAPE_HERO_ANCHOR.x * scale,
            top: LANDSCAPE_HERO_ANCHOR.y * scale,
          },
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
  );
}

const useStyles = makeStyles(() => ({
  placeholder: { width: '100%', aspectRatio: LANDSCAPE_WIDTH / LANDSCAPE_HEIGHT },
  frame: { width: '100%', overflow: 'hidden' },
  layer: { position: 'absolute', top: 0 },
}));
