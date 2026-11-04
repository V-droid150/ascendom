import type { ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Rect, type RectProps } from 'react-native-svg';
import { generatedSpriteSource } from '@/sprites/compose';
import { PixelArt } from '@/sprites/PixelArt';
import { TAB_ICONS } from '@/sprites/tabIcons';
import { useHero } from '@/hooks/useHero';

const CrispRect = Rect as unknown as ComponentType<RectProps & { shapeRendering?: string }>;

/** The head occupies the top 16 rows and the middle 16 columns of a sprite. */
const HEAD_CROP = { x: 8, y: 0, size: 16 } as const;
const ICON_SCALE = 2;
/** Pixel art has no tint colour, so an inactive tab is shown dimmed instead. */
const INACTIVE_OPACITY = 0.5;

/** The player's own hero, cropped to the head, as the Hero tab icon. */
export function HeroHeadIcon({ focused }: { focused: boolean }) {
  const view = useHero();
  const pixels = HEAD_CROP.size * ICON_SCALE;

  if (!view) return <View style={{ width: pixels, height: pixels }} />;

  const { hero, rankNumber } = view;
  const { rects } = generatedSpriteSource.compose({
    gender: hero.gender,
    rank: rankNumber,
    skinTone: hero.appearance.skinTone,
    hairStyle: hero.appearance.hairStyle,
    hairColor: hero.appearance.hairColor,
    cosmetics: hero.equippedCosmetics,
    withWeapon: false,
  });

  return (
    <View style={{ width: pixels, height: pixels, opacity: focused ? 1 : INACTIVE_OPACITY }}>
      {/* The viewBox is the crop: everything outside the head is clipped away. */}
      <Svg
        width={pixels}
        height={pixels}
        viewBox={`${HEAD_CROP.x} ${HEAD_CROP.y} ${HEAD_CROP.size} ${HEAD_CROP.size}`}
      >
        {rects.map((rect) => (
          <CrispRect
            key={`${rect.x}-${rect.y}-${rect.width}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={1}
            fill={rect.color}
            shapeRendering="crispEdges"
          />
        ))}
      </Svg>
    </View>
  );
}

/** A pixel-art tab icon: castle for Kingdom, market stall for Shop, cog for Settings. */
export function PixelTabIcon({
  name,
  focused,
}: {
  name: keyof typeof TAB_ICONS;
  focused: boolean;
}) {
  const { art, colors } = TAB_ICONS[name];
  return (
    <View style={{ opacity: focused ? 1 : INACTIVE_OPACITY }}>
      <PixelArt art={art} colors={colors} scale={ICON_SCALE} />
    </View>
  );
}
