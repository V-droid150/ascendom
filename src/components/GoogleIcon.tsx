import { PixelArt } from '@/sprites/PixelArt';
import { GOOGLE_ART, GOOGLE_COLORS } from '@/sprites/brand';

/** 14px art at 2x: 28px, which sits inside a 44px row with room to spare. */
const ICON_SCALE = 2;

/** Pixel-art Google mark for "Sign in with Google". Decorative: the label says it. */
export function GoogleIcon() {
  return <PixelArt art={GOOGLE_ART} colors={GOOGLE_COLORS} scale={ICON_SCALE} />;
}
