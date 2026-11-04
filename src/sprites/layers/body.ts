/**
 * Body and shadow layers, in the chibi proportions of 8-bit console RPGs: a
 * head as wide as the shoulders and roughly as tall as the rest of the body.
 *
 * Drawn in swap characters only (`s` skin, `S` shade, `l` light), so every skin
 * tone reuses the same art. The silhouette is shared between genders; outfits
 * and hair carry the difference, which is how NES-era sprites did it too.
 * The dark outline is not drawn here: `compose` traces it around the finished
 * silhouette so headgear, capes and weapons get one as well.
 *
 *   rows 3-14   head (eyes on rows 9-10)
 *   rows 15-21  torso, arms at columns 9-10 and 21-22, hands on row 21
 *   rows 22-25  legs
 *   row  26     feet
 *   row  28     ground shadow (row 27 is left for the outline)
 */

import type { Gender } from '@/types';
import type { SpriteLayer } from '../types';
import { layer, row, rows } from './builder';

const EYES = row([10, 'lss0ssss0ssS']);

const HEAD = {
  3: row([12, 'ssssssss']),
  4: row([11, 'ssssssssss']),
  ...rows(5, 8, row([10, 'lssssssssssS'])),
  9: EYES,
  10: EYES,
  11: row([10, 'lsSssssssSsS']),
  12: row([10, 'lssssssssssS']),
  13: row([11, 'ssssssssSS']),
  14: row([12, 'ssSSSSss']),
} as const;

const TORSO_AND_LIMBS = {
  ...rows(15, 20, row([9, 'ss'], [11, 'ssssssssss'], [21, 'sS'])),
  21: row([9, 'ss'], [11, 'ssssssssss'], [21, 'sS']),
  ...rows(22, 25, row([12, 'sss'], [17, 'sss'])),
  26: row([11, 'ssss'], [17, 'ssss']),
} as const;

const BODY: SpriteLayer = layer({ ...HEAD, ...TORSO_AND_LIMBS });

/** Grounds the character so it doesn't look like it's floating. */
export const SHADOW_LAYER: SpriteLayer = layer({
  28: row([10, 'FFFFFFFFFFFF']),
});

export function bodyLayer(_gender: Gender): SpriteLayer {
  return BODY;
}

export const BODY_LAYERS = { male: BODY, female: BODY } as const;
