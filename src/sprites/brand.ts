/**
 * Third-party marks drawn in the game's pixel style.
 *
 * The Google "G" keeps Google's four brand colours (they are what makes it
 * recognisable, so they are not swapped into the Sweetie 16 palette) and sits
 * on a white tile, so it reads on the navy title menu and on a gold button.
 */

const G_MARK = [
  '....rrrrr...',
  '..rrrrrrrrr.',
  '.rrr.....rr.',
  '.rr.........',
  'yy..........',
  'yy....bbbbbb',
  'yy....bbbbbb',
  'yy........bb',
  '.yy......bb.',
  '.ggg....bbb.',
  '..ggggggbb..',
  '....gggg....',
] as const;

/** Pads art with a one-pixel frame and fills every gap with `fill`. */
function onTile(art: readonly string[], fill: string): string[] {
  const width = (art[0]?.length ?? 0) + 2;
  const edge = fill.repeat(width);
  return [edge, ...art.map((row) => `${fill}${row.replace(/\./g, fill)}${fill}`), edge];
}

/** 14x14: the G on a white tile. */
export const GOOGLE_ART: readonly string[] = onTile(G_MARK, 'w');

export const GOOGLE_COLORS: Readonly<Record<string, string>> = {
  b: '#4285f4',
  r: '#ea4335',
  y: '#fbbc05',
  g: '#34a853',
  w: '#ffffff',
};
