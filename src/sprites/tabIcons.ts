/**
 * Pixel-art tab bar icons, outlined like the hero sprites. The Hero tab is the
 * exception: it shows the player's own head, composed live (`TabIcons.tsx`).
 */

import { PALETTE } from '@/theme/colors';
import { SPRITE_OUTLINE } from './compose';
import { withOutline } from './scenes';

export interface TabIconArt {
  art: readonly string[];
  colors: Readonly<Record<string, string>>;
}

/** Kingdom: a keep between two flagged towers. */
const CASTLE: readonly string[] = [
  '.y.........y.',
  '.C....y....C.',
  'rrr...C...rrr',
  'rrr..rrr..rrr',
  'cCc.rrrrr.cCc',
  'cCcccccccccCc',
  'cCckccccckcCc',
  'cCcccccccccCc',
  'cCcccckccccCc',
  'cCccckkkcccCc',
  'cCccckkkcccCc',
];

/** Shop: a market stall with a striped awning and gold on the counter. */
const SHOP: readonly string[] = [
  'rrwwrrwwrrwwr',
  'rrwwrrwwrrwwr',
  '.rr.ww.rr.ww.',
  '.b.........b.',
  '.b...yyy...b.',
  '.b..yyYyy..b.',
  'bbbbbbbbbbbbb',
  'bBBBBBBBBBBBb',
  'bBBBByyyBBBBb',
  'bBBBBBBBBBBBb',
];

/** Settings: a cog with eight teeth. */
const GEAR_SHAPE: readonly string[] = [
  '.....ggg.....',
  '.gg.ggggg.gg.',
  '.ggggggggggg.',
  '..ggggggggg..',
  '.gggg...gggg.',
  'gggg.....gggg',
  'gggg.....gggg',
  'gggg.....gggg',
  '.gggg...gggg.',
  '..ggggggggg..',
  '.ggggggggggg.',
  '.gg.ggggg.gg.',
  '.....ggg.....',
];

/** Lights the upper-left half of the cog and shades the lower-right. */
const GEAR = GEAR_SHAPE.map((line, y) =>
  [...line].map((char, x) => (char === 'g' && x + y > 12 ? 'G' : char)).join(''),
);

export const TAB_ICONS: Readonly<Record<'kingdom' | 'shop' | 'settings', TabIconArt>> = {
  kingdom: {
    art: withOutline(CASTLE, 'k'),
    colors: { y: PALETTE[4], C: PALETTE[14], r: PALETTE[2], c: PALETTE[13], k: SPRITE_OUTLINE },
  },
  shop: {
    art: withOutline(SHOP, 'k'),
    colors: {
      r: PALETTE[2],
      w: PALETTE[12],
      b: '#a86b42',
      B: '#7a4525',
      y: PALETTE[4],
      Y: PALETTE[12],
      k: SPRITE_OUTLINE,
    },
  },
  settings: {
    art: withOutline(GEAR, 'k'),
    colors: { g: PALETTE[13], G: PALETTE[14], k: SPRITE_OUTLINE },
  },
};
