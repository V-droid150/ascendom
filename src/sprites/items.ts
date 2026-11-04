/**
 * Shop item art, drawn in the same style as the heroes: two-tone shading and a
 * traced 1px outline in `SPRITE_OUTLINE`, so an item on the shelf looks like
 * it belongs to the character who will wear it.
 *
 * Capes and sheens are drawn once in the swap characters `c` / `C` and
 * coloured from the cosmetic's own palette entry, exactly like the cape on a
 * hero sprite, so the picture always matches what the hero will show.
 */

import { COSMETICS } from '@/engine/constants';
import { PALETTE } from '@/theme/colors';
import { SPRITE_OUTLINE } from './compose';
import { darken } from './palette';
import { withOutline } from './scenes';

export type ShopItemId = 'shield' | 'potion' | (typeof COSMETICS)[number]['id'];

/** The Royal Shield: a kite shield bearing the crown. */
const SHIELD: readonly string[] = [
  'gggggggggggg',
  'gbbbbbbbbbBG',
  'gbwgbggbgbBG',
  'gbbggggggbBG',
  'gbbgrggrgbBG',
  'gbbggggggbBG',
  'gbbbbbbbbbBG',
  'gbbbbbbbbbBG',
  'gbbbbbbbbBBG',
  '.gbbbbbbbBG.',
  '.gbbbbbbbBG.',
  '..gbbbbbbG..',
  '...gbbbbG...',
  '....gbbG....',
  '.....gG.....',
];

/** The Potion of Healing: a round flask, cork in, red draught inside. */
const POTION: readonly string[] = [
  '....oooo....',
  '....oOOo....',
  '.....ll.....',
  '.....ll.....',
  '....llll....',
  '..llllllll..',
  '.llwpppppPl.',
  'llwppppppPPl',
  'llpppppppPPl',
  'llppppppPPPl',
  'llppppppPPPl',
  '.lpppppPPPl.',
  '..llPPPPll..',
  '....llll....',
];

/** A cape with gold clasps, falling in folds. */
const CAPE: readonly string[] = [
  '...cccccC...',
  '..cgcccgCC..',
  '..cccccccC..',
  '.ccCcccCccC.',
  '.ccCcccCccC.',
  '.ccCcccCcCC.',
  'cccCcccCcCCC',
  'cccCcccCcCCC',
  'cccCcccCcCCC',
  'cccCcccCcCCC',
  'ccCCcccCCCCC',
  'CCCCCCCCCCCC',
];

/** A sheen: a faceted gem throwing off sparkles. */
const SHEEN: readonly string[] = [
  '.....w......',
  '.w..wcc...w.',
  '...wcccC....',
  '..wccccCC...',
  '.wcccccCCC..',
  'wccccccCCCC.',
  '.CccccCCCC..',
  '..CcccCCC...',
  '...CccCC....',
  '.w..CcC...w.',
  '.....C......',
];

const BASE_COLORS: Readonly<Record<string, string>> = {
  k: SPRITE_OUTLINE,
  w: PALETTE[12],
  // Shield
  g: PALETTE[4],
  G: '#c99b47',
  b: PALETTE[9],
  B: PALETTE[8],
  r: PALETTE[2],
  // Potion
  o: PALETTE[3],
  O: PALETTE[2],
  l: PALETTE[11],
  p: PALETTE[2],
  P: '#7a2638',
};

export interface ShopItemArt {
  art: readonly string[];
  colors: Readonly<Record<string, string>>;
}

const OUTLINED = {
  shield: withOutline(SHIELD, 'k'),
  potion: withOutline(POTION, 'k'),
  cape: withOutline(CAPE, 'k'),
  sheen: withOutline(SHEEN, 'k'),
} as const;

/** Art and colours for one shop item. Unknown ids fall back to the shield. */
export function shopItemArt(id: string): ShopItemArt {
  if (id === 'potion') return { art: OUTLINED.potion, colors: BASE_COLORS };

  const cosmetic = COSMETICS.find((item) => item.id === id);
  if (!cosmetic) return { art: OUTLINED.shield, colors: BASE_COLORS };

  const base = PALETTE[cosmetic.color] ?? PALETTE[2];
  return {
    art: cosmetic.slot === 'cape' ? OUTLINED.cape : OUTLINED.sheen,
    colors: { ...BASE_COLORS, c: base, C: darken(base, 0.35) },
  };
}

/** Every piece of item art, for the structural tests. */
export const SHOP_ITEM_ART = OUTLINED;
