import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { HeroHeadIcon, PixelTabIcon } from '@/components/TabIcons';
import { border, fonts, fontSize, MIN_TOUCH_SIZE, useColors } from '@/theme';

/**
 * Every tab but Quests is pixel art: the player's own head for Hero, then a
 * castle, a market stall and a cog. Quests keeps its star glyph, drawn as text
 * so no icon font is needed, at a size that holds its own beside the art.
 */
const QUEST_GLYPH = '✦';

export default function TabsLayout() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.night },
        tabBarStyle: {
          backgroundColor: colors.nightDeep,
          borderTopWidth: border.width,
          borderTopColor: colors.charcoal,
          // Room for the 32px pixel-art icons above the label.
          height: MIN_TOUCH_SIZE + 32,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.steel,
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: fontSize.caption,
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
