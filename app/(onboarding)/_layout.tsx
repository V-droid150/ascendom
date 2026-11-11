import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { ReadingColumn } from '@/components/GameWindow';
import { useColors } from '@/theme';

/**
 * Character creation stays a readable column on wide windows. The title
 * screen is the exception: its castle scene is painted to fill the window.
 */
export default function OnboardingLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.night },
        animation: 'slide_from_right',
      }}
      screenLayout={readingLayout}
    />
  );
}

function readingLayout({
  route,
  children,
}: {
  route: { name: string };
  children: ReactElement;
}): ReactElement {
  return route.name === 'welcome' ? children : <ReadingColumn>{children}</ReadingColumn>;
}
