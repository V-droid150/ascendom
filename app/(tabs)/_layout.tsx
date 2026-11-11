import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { HeroHeadIcon, PixelTabIcon } from '@/components/TabIcons';
import { useLayout } from '@/hooks/useLayout';
import {
  border,
  fonts,
  fontSize,
  MIN_TOUCH_SIZE,
  SIDE_RAIL_WIDTH,
  spacing,
  useColors,
} from '@/theme';

/**
 * Every tab but Quests is pixel art: the player's own head for Hero, then a
 * castle, a market stall and a cog. Quests keeps its star glyph, drawn as text
 * so no icon font is needed, at a size that holds its own beside the art.
 */
const QUEST_GLYPH = '✦';

export default function TabsLayout() {
  const colors = useColors();
  const { t } = useTranslation();
  const layout = useLayout();
  const desktop = layout.size === 'desktop';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.night },
        // Tablet and desktop: a side rail, so the tabs don't stretch across a
        // wide window. Desktop has room for the label beside the icon.
        tabBarPosition: layout.isWide ? 'left' : 'bottom',
        tabBarLabelPosition: desktop ? 'beside-icon' : 'below-icon',
        // A rail with labels under the icons only exists in the material variant.
        tabBarVariant: layout.size === 'tablet' ? 'material' : 'uikit',
        tabBarStyle: layout.isWide
          ? {
              backgroundColor: colors.nightDeep,
              borderTopWidth: 0,
              borderRightWidth: border.width,
              borderRightColor: colors.charcoal,
              // minWidth too: the library's sidebar default is a 360px drawer.
              width: desktop ? SIDE_RAIL_WIDTH.desktop : SIDE_RAIL_WIDTH.tablet,
              minWidth: desktop ? SIDE_RAIL_WIDTH.desktop : SIDE_RAIL_WIDTH.tablet,
              paddingTop: spacing.lg,
            }
          : {
              backgroundColor: colors.nightDeep,
              borderTopWidth: border.width,
              borderTopColor: colors.charcoal,
              // Room for the 32px pixel-art icons above the label.
              height: MIN_TOUCH_SIZE + 32,
              paddingTop: 6,
            },
        ...(layout.isWide && {
          tabBarItemStyle: {
            minHeight: MIN_TOUCH_SIZE + 32,
            justifyContent: desktop ? 'flex-start' : 'center',
            paddingHorizontal: desktop ? spacing.md : 0,
            gap: desktop ? spacing.sm : 0,
            borderRadius: border.radius,
          },
          // A dark plate behind the active tab, not the library's blue pill.
          tabBarActiveBackgroundColor: colors.charcoal,
          tabBarInactiveBackgroundColor: 'transparent',
        }),
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.steel,
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: desktop ? fontSize.body : fontSize.caption,
        },
        tabBarIcon: ({ color }) => null,
      }}
    >
      {(['quests', 'hero', 'kingdom', 'shop', 'settings'] as const).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(`tabs.${name}`),
            tabBarAccessibilityLabel: t(`tabs.${name}`),
            tabBarIcon: ({ color, focused }) =>
              name === 'hero' ? (
                <HeroHeadIcon focused={focused} />
              ) : name === 'quests' ? (
                <Text style={{ color, fontSize: fontSize.tabGlyph }}>{QUEST_GLYPH}</Text>
              ) : (
                <PixelTabIcon name={name} focused={focused} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
