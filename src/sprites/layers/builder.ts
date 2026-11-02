/**
 * Helpers for writing sprite art in source.
 *
 * Art is authored as `(column, pattern)` pairs rather than literal 32-character
 * strings. Hand-padding every row with dots is tedious and silently wrong when
 * a count is off by one, so `row` computes the padding and `layer` fills in the
 * empty rows. `assertLayer` is the backstop, exercised by the layer tests.
 */

import { SPRITE_SIZE, type SpriteLayer } from '../types';
import { TRANSPARENT, VALID_SPRITE_CHARS } from '../palette';

const EMPTY_ROW = TRANSPARENT.repeat(SPRITE_SIZE);

/** A run of art characters starting at a given column. */
export type Segment = readonly [column: number, pattern: string];

/**
 * Builds one 32-character row from segments. Segments must not overlap and are
 * expected left to right; anything not covered stays transparent.
 */
export function row(...segments: Segment[]): string {
  const cells = Array.from({ length: SPRITE_SIZE }, () => TRANSPARENT);

  for (const [column, pattern] of segments) {
    for (let i = 0; i < pattern.length; i += 1) {
      const x = column + i;
      if (x < 0 || x >= SPRITE_SIZE) {
        throw new Error(`Segment "${pattern}" at column ${column} runs off the 32px canvas`);
      }
      cells[x] = pattern[i] as string;
    }
  }

  return cells.join('');
}

/**
 * Same as `row` but for art that isn't 32 wide, such as background scenery.
 * Over-long segments are clipped rather than throwing, since scenery is often
 * authored by repeating a motif across the full width.
 */
export function wideRow(width: number, ...segments: Segment[]): string {
  const cells = Array.from({ length: width }, () => TRANSPARENT);

  for (const [column, pattern] of segments) {
    for (let i = 0; i < pattern.length; i += 1) {
      const x = column + i;
      if (x >= 0 && x < width) cells[x] = pattern[i] as string;
    }
  }

  return cells.join('');
}

/** Builds a full 32-row layer from a sparse map of row index to row content. */
export function layer(rows: Readonly<Record<number, string>>): SpriteLayer {
  return Array.from({ length: SPRITE_SIZE }, (_, y) => rows[y] ?? EMPTY_ROW);
}

/** Repeats one row across an inclusive range of row indices. */
export function rows(from: number, to: number, content: string): Record<number, string> {
  const out: Record<number, string> = {};
  for (let y = from; y <= to; y += 1) out[y] = content;
  return out;
}

export const emptyLayer = (): SpriteLayer => layer({});

/** Throws with a precise location when a layer breaks the 32x32 contract. */
export function assertLayer(name: string, candidate: SpriteLayer): void {
  if (candidate.length !== SPRITE_SIZE) {
    throw new Error(`Layer "${name}" has ${candidate.length} rows, expected ${SPRITE_SIZE}`);
  }

  candidate.forEach((line, y) => {
    if (line.length !== SPRITE_SIZE) {
      throw new Error(
        `Layer "${name}" row ${y} has ${line.length} characters, expected ${SPRITE_SIZE}`,
      );
    }

    for (let x = 0; x < line.length; x += 1) {
      const char = line[x] as string;
      if (!VALID_SPRITE_CHARS.includes(char)) {
        throw new Error(`Layer "${name}" has invalid character "${char}" at ${x},${y}`);
      }
    }
  });
}
