import { BOSSES } from '@/engine/constants';
import { BOSS_ART, BOSS_ART_SIZE } from '../bosses';

describe('BOSS_ART', () => {
  it.each(BOSSES.map((boss) => boss.id))('has a well-formed %s portrait', (id) => {
    const { art, colors } = BOSS_ART[id];
    expect(art).toHaveLength(BOSS_ART_SIZE);
    for (const row of art) {
      expect(row).toHaveLength(BOSS_ART_SIZE);
      for (const pixel of row) {
        if (pixel !== '.') expect(colors[pixel]).toBeDefined();
      }
    }
  });

  it('draws every portrait symmetrically', () => {
    for (const { art } of Object.values(BOSS_ART)) {
      for (const row of art) expect([...row].reverse().join('')).toBe(row);
    }
  });

  it('has art for every boss and no strays', () => {
    expect(Object.keys(BOSS_ART).sort()).toEqual(BOSSES.map((boss) => boss.id).sort());
  });
});
