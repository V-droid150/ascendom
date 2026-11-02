import { useEffect, useState } from 'react';
import { PixelSprite } from './PixelSprite';
import type { SpriteRequest } from './types';
import { duration } from '@/theme';

interface HeroSpriteProps extends Omit<SpriteRequest, 'frame'> {
  scale?: number;
  /** Two-frame idle bob. Off when the user has asked for reduced motion. */
  animated?: boolean;
  accessibilityLabel?: string;
}

/**
 * A hero sprite with the 2-frame idle bob.
 *
 * The bob is a 1px vertical shift of the composed grid rather than a transform,
 * so the character always lands on whole pixels — a sub-pixel translate would
 * blur the art on web.
 */
export function HeroSprite({ animated = true, ...props }: HeroSpriteProps) {
  const [frame, setFrame] = useState<0 | 1>(0);

  useEffect(() => {
    // No setState when the bob is off: the render below already pins frame 0,
    // so clearing it here would only cause an extra render.
    if (!animated) return;

    const timer = setInterval(() => {
      setFrame((current) => (current === 0 ? 1 : 0));
    }, duration.idleFrame);

    return () => clearInterval(timer);
  }, [animated]);

  return <PixelSprite {...props} frame={animated ? frame : 0} />;
}
