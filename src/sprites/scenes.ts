/**
 * Background scenery, generated the same way as the character sprites.
 *
 * Kept separate from `layers/` because scenes are standalone art rather than
 * composable layers, and they aren't bound to the 32x32 character canvas.
 */

import { PALETTE } from '@/theme/colors';
import { wideRow } from './layers/builder';

const W = 48;

/** The night castle on the welcome screen. */
export const CASTLE_ART: readonly string[] = [
  wideRow(W, [3, 's'], [11, 's'], [19, 's'], [31, 's'], [41, 's']),
  wideRow(W, [38, 'mmm']),
  wideRow(W, [7, 's'], [26, 's'], [37, 'mmmmm']),
  wideRow(W, [37, 'mmmmm']),
  wideRow(W, [15, 's'], [38, 'mmm'], [44, 's']),
  wideRow(W, [5, 's'], [22, 's'], [34, 's']),
  wideRow(W, [12, 'r'], [35, 'r']),
  wideRow(W, [11, 'rrr'], [34, 'rrr'], [1, 's']),
  wideRow(W, [10, 'rrrrr'], [22, 'r'], [33, 'rrrrr']),
  wideRow(W, [9, 'rrrrrrr'], [21, 'rrr'], [32, 'rrrrrrr']),
  wideRow(W, [10, 'WwwwwW'], [20, 'rrrrr'], [33, 'WwwwwW']),
  wideRow(W, [10, 'WyyywW'], [19, 'rrrrrrr'], [33, 'WwyyyW']),
  wideRow(W, [10, 'WyyywW'], [18, 'W.w.w.W'], [33, 'WwyyyW']),
  wideRow(W, [10, 'WwwwwW'], [18, 'WwwwwwW'], [33, 'WwwwwW']),
  wideRow(W, [10, 'WwwwwW'], [18, 'WwyyywW'], [33, 'WwwwwW']),
  wideRow(W, [8, 'W.w.w.w.W'], [18, 'WwyyywW'], [31, 'W.w.w.w.W']),
  wideRow(W, [8, 'WwwwwwwwW'], [17, 'WWwwwwwWW'], [31, 'WwwwwwwwW']),
  wideRow(W, [8, 'WwyywwyywW'], [17, 'WwwwwwwwW'], [31, 'WwyywwyywW']),
  wideRow(W, [8, 'WwyywwyywW'], [17, 'WwyywwyywW'], [31, 'WwyywwyywW']),
  wideRow(W, [6, 'WwwwwwwwwwwW'], [17, 'WwyywwyywW'], [29, 'WwwwwwwwwwwW']),
  wideRow(W, [6, 'WwwwwwwwwwwW'], [17, 'WwwwwwwwW'], [29, 'WwwwwwwwwwwW']),
  wideRow(W, [6, 'WwwwwwwwwwwWWWWWWWWWWWWWWWWwwwwwwwwwwwW']),
  wideRow(W, [6, 'Wwwyywwyywww'], [18, 'WwwwwwwW'], [29, 'wwyywwyywwwW']),
  wideRow(W, [6, 'Wwwyywwyywww'], [18, 'Wwyyyw'], [26, 'W'], [29, 'wwyywwyywwwW']),
  wideRow(W, [4, 'WwwwwwwwwwwwwwWwyyywWwwWwwwwwwwwwwwwwwW']),
  wideRow(W, [4, 'WwwwwwwwwwwwwwWwyyywWwwWwwwwwwwwwwwwwwW']),
  wideRow(W, [4, 'WwwwwwwwwwwwwwWWwyywWWwWwwwwwwwwwwwwwwW']),
  wideRow(W, [0, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF']),
];

export const CASTLE_COLORS: Readonly<Record<string, string>> = {
  W: PALETTE[15], // mortar / dark stone
  w: PALETTE[14], // lit stone
  r: PALETTE[8], // slate roof
  y: PALETTE[4], // window glow
  s: PALETTE[12], // stars
  m: PALETTE[13], // moon
  F: PALETTE[0], // ground line
};

/** The fog-bound castle shown on the locked Kingdom tab. */
export const FOGGY_CASTLE_COLORS: Readonly<Record<string, string>> = {
  W: '#20243a',
  w: '#2a2f48',
  r: '#232841',
  y: '#3b4467',
  s: '#2e3450',
  m: '#262b43',
  F: PALETTE[0],
};
