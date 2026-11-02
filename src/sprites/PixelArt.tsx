import { memo, useMemo, type ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Rect, type RectProps } from 'react-native-svg';
import { toRects } from './compose';

const CrispRect = Rect as unknown as ComponentType<RectProps & { shapeRendering?: string }>;

interface PixelArtProps {
  /** Rows of characters. Rows may be any length, but should all match. */
  art: readonly string[];
  /** Maps each character to a colour. Characters absent from the map are skipped. */
  colors: Readonly<Record<string, string>>;
  scale?: number;
  accessibilityLabel?: string;
}

/**
 * Renders arbitrary pixel art — scenery, icons, anything that isn't a hero.
 *
 * Characters go through the same run-length merge as sprites, so a wide castle
 * backdrop costs a few dozen rects instead of a thousand.
 */
function PixelArtComponent({ art, colors, scale = 4, accessibilityLabel }: PixelArtProps) {
  const integerScale = Math.max(1, Math.floor(scale));

  const { rects, width, height } = useMemo(() => {
    const grid = art.map((line) => [...line].map((char) => colors[char] ?? null));
    return {
      rects: toRects(grid),
      width: art[0]?.length ?? 0,
      height: art.length,
    };
  }, [art, colors]);

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: width * integerScale, height: height * integerScale }}
    >
      <Svg
        width={width * integerScale}
        height={height * integerScale}
        viewBox={`0 0 ${width} ${height}`}
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

export const PixelArt = memo(PixelArtComponent);
