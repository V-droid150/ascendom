import { GOOGLE_ART, GOOGLE_COLORS } from '../brand';

describe('GOOGLE_ART', () => {
  it('is a 14x14 tile with every pixel coloured', () => {
    expect(GOOGLE_ART).toHaveLength(14);
    for (const row of GOOGLE_ART) {
      expect(row).toHaveLength(14);
      for (const pixel of row) expect(GOOGLE_COLORS[pixel]).toBeDefined();
    }
  });

  it('uses all four Google colours', () => {
    const used = new Set(GOOGLE_ART.join(''));
    for (const key of ['b', 'r', 'y', 'g']) expect(used.has(key)).toBe(true);
  });
});
