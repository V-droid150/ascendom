import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useLayout } from '@/hooks/useLayout';
import { spacing, WIDE_CONTENT_MAX_WIDTH } from '@/theme';

interface ResponsiveColumnsProps {
  /** The screen's main story (quests, the hero portrait, the settings). */
  main: ReactNode;
  /** Supporting panels: a narrower right-hand column on wide screens. */
  aside: ReactNode;
  /** On a phone, whether the aside panels come first (Quests puts the boss on top). */
  asideFirstOnPhone?: boolean;
  /** The phone layout, when it must interleave the two groups (keeps the phone order unchanged). */
  phone?: ReactNode;
}

/**
 * Two columns from tablet width, one stacked column on a phone.
 *
 * Panels keep their phone design; only where they sit changes. Each column
 * is its own vertical stack, so a tall panel never leaves a hole beside it.
 */
export function ResponsiveColumns({
  main,
  aside,
  asideFirstOnPhone,
  phone,
}: ResponsiveColumnsProps) {
  const { isWide } = useLayout();

  if (!isWide) {
    if (phone !== undefined) return <>{phone}</>;
    return (
      <>
        {asideFirstOnPhone ? aside : main}
        {asideFirstOnPhone ? main : aside}
      </>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg }}>
      <View style={{ flex: 3, minWidth: 0, gap: spacing.md }}>{main}</View>
      <View style={{ flex: 2, minWidth: 0, gap: spacing.md }}>{aside}</View>
    </View>
  );
}

/** Centres a tab screen's content and caps its width on wide screens. */
export function useWideContentStyle(): {
  width: '100%';
  maxWidth: number;
  alignSelf: 'center';
} | null {
  const { isWide } = useLayout();
  return isWide ? { width: '100%', maxWidth: WIDE_CONTENT_MAX_WIDTH, alignSelf: 'center' } : null;
}
