/**
 * Body and shadow layers.
 *
 * One body per gender, drawn in swap characters only (`s` skin, `S` shade,
 * `l` light), so all six skin tones reuse the same art. The silhouette is
 * shared between genders apart from shoulder and hip width, which keeps every
 * outfit aligned to the same landmarks:
 *
 *   rows 4-13   head and neck
 *   rows 14-21  torso (arms at the outer columns)
 *   rows 22-27  legs
 *   rows 28-29  feet
 *   row  30     ground shadow
 */

import type { Gender } from '@/types';
import type { SpriteLayer } from '../types';
import { layer, row, rows } from './builder';

const FACE_EYES = row([11, 'ls0ssss0sS']);
const FACE_PLAIN = row([11, 'lssssssssS']);

const HEAD = {
  4: row([12, 'ssssssss']),
  5: row([11, 'lssssssssS']),
  6: FACE_PLAIN,
  7: FACE_EYES,
  8: FACE_EYES,
  9: FACE_PLAIN,
  10: row([11, 'lsssSSsssS']),
  11: row([12, 'sssssssS']),
  12: row([13, 'ssssss']),
  13: row([14, 'ssss']),
} as const;

const LEGS = {
  ...rows(22, 27, row([12, 'sss'], [17, 'sss'])),
  28: row([11, 'ssss'], [17, 'ssss']),
  29: row([11, 'ssSS'], [17, 'SSss']),
} as const;

const MALE_BODY: SpriteLayer = layer({
  ...HEAD,
  14: row([11, 'ssssssssss']),
  // Broader shoulders than the female body: arms sit at columns 9 and 22.
  ...rows(15, 19, row([9, 'lssssssssssssS'])),
  20: row([10, 'lssssssssssS']),
  21: row([11, 'lssssssssS']),
  ...LEGS,
});

const FEMALE_BODY: SpriteLayer = layer({
  ...HEAD,
  14: row([12, 'ssssssss']),
  ...rows(15, 19, row([10, 'lssssssssssS'])),
  20: row([11, 'lssssssssS']),
  21: row([11, 'lssssssssS']),
  ...LEGS,
});

/** Grounds the character so it doesn't look like it's floating. */
export const SHADOW_LAYER: SpriteLayer = layer({
  30: row([11, 'FFFFFFFFFF']),
});

export function bodyLayer(gender: Gender): SpriteLayer {
  return gender === 'female' ? FEMALE_BODY : MALE_BODY;
}

export const BODY_LAYERS = { male: MALE_BODY, female: FEMALE_BODY } as const;
