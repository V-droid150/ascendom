/** Layout tokens. No imports, so pure code (and its tests) can use them. */

/**
 * Responsive breakpoints (window width in px). Below `tablet` the app is the
 * phone column it was designed as; from `tablet` the tabs move to a side rail
 * and screens lay their panels out in two columns; from `desktop` the rail
 * shows its labels beside the icons.
 */
export const BREAKPOINTS = { tablet: 768, desktop: 1200 } as const;

/** The wide game window on tablet and desktop, framed like the phone one. */
export const WIDE_WINDOW_MAX_WIDTH = 1280;

/** Widest a tab screen's content grows inside the wide window. */
export const WIDE_CONTENT_MAX_WIDTH = 1100;

/** Forms and single-story screens (sign-in, onboarding) stay a readable column. */
export const READING_MAX_WIDTH = 560;

/** Side rail widths: icons over labels on tablet, labels beside icons on desktop. */
export const SIDE_RAIL_WIDTH = { tablet: 104, desktop: 216 } as const;
