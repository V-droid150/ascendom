import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '@/theme/layout';

export type LayoutSize = 'phone' | 'tablet' | 'desktop';

export interface Layout {
  size: LayoutSize;
  /** Tablet or desktop: side rail, two-column screens, wide game window. */
  isWide: boolean;
}

/** Which layout a window of this width gets. Pure, so it is tested directly. */
export function layoutFor(width: number): Layout {
  const size: LayoutSize =
    width >= BREAKPOINTS.desktop ? 'desktop' : width >= BREAKPOINTS.tablet ? 'tablet' : 'phone';
  return { size, isWide: size !== 'phone' };
}

/** The current layout, updating as the window is resized or the tablet rotates. */
export function useLayout(): Layout {
  const { width } = useWindowDimensions();
  return layoutFor(width);
}
