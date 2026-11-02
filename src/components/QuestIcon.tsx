import { PixelArt } from '@/sprites/PixelArt';
import { questIcon } from '@/sprites/icons';

interface QuestIconProps {
  icon: string;
  scale?: number;
  accessibilityLabel?: string;
}

/** Renders a quest's pixel glyph. */
export function QuestIcon({ icon, scale = 2, accessibilityLabel }: QuestIconProps) {
  const { art, colors } = questIcon(icon);
  return (
    <PixelArt
      art={art}
      colors={colors}
      scale={scale}
      {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
    />
  );
}
