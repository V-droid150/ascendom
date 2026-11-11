import { layoutFor } from '../useLayout';

describe('layoutFor', () => {
  it.each([
    [320, 'phone', false],
    [480, 'phone', false],
    [767, 'phone', false],
    [768, 'tablet', true],
    [1024, 'tablet', true],
    [1199, 'tablet', true],
    [1200, 'desktop', true],
    [2560, 'desktop', true],
  ] as const)('%ipx is %s', (width, size, isWide) => {
    expect(layoutFor(width)).toEqual({ size, isWide });
  });
});
