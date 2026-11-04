/**
 * Public surface of the Ascendom game engine.
 *
 * Everything in here is pure: no React, no Expo, no store, no clock. Time and
 * identity are always injected by the caller. This is what makes the game rules
 * unit-testable in isolation and keeps them out of the UI.
 */

export * from './constants';
export * from './dayKey';
export * from './xp';
export * from './ranks';
export * from './rewards';
export * from './streaks';
export * from './hp';
export * from './logs';
export * from './completion';
export * from './dayRollover';
export * from './shop';
export * from './badHabits';
export * from './boss';
export * from './kingdom';
export * from './hero';
export * from './sideQuests';
