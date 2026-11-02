import { memo, type ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Rect, type RectProps } from 'react-native-svg';
import { generatedSpriteSource } from './compose';
import { SPRITE_SIZE, type SpriteRequest } from './types';

/**
 * `shapeRendering` is a real SVG attribute that react-native-svg forwards to
 * the DOM on web, but it isn't in its TypeScript props. The cast documents that
 * deliberately rather than dropping a prop that genuinely helps on web.
 */
const CrispRect = Rect as unknown as ComponentType<RectProps & { shapeRendering?: string }>;

interface PixelSpriteProps extends SpriteRequest {
  /**
   * Integer multiplier only. Fractional scaling puts rect edges on half pixels
   * and makes the art blurry, which defeats the whole look.
   */
  scale?: number;
  accessibilityLabel?: string;
}

/**
 * Renders a composed sprite as SVG rects.
 *
 * `shapeRendering="crispEdges"` is honoured on web; on native react-native-svg
 * ignores it, so crispness comes from the integer scale and integer rect
 * coordinates instead.
 */
function PixelSpriteComponent({
  scale = 6,
  accessibilityLabel,
  ...request
}: PixelSpriteProps) {
  const integerScale = Math.max(1, Math.floor(scale));
  const pixels = SPRITE_SIZE * integerScale;
  const { rects } = generatedSpriteSource.compose(request);

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: pixels, height: pixels }}
    >
      <Svg width={pixels} height={pixels} viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}>
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

export const PixelSprite = memo(PixelSpriteComponent);
