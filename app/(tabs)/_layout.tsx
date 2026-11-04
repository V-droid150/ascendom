import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { CastleTabIcon, HeroHeadIcon } from '@/components/TabIcons';
import { border, fonts, fontSize, MIN_TOUCH_SIZE, useColors } from '@/theme';

/**
 * Tab glyphs drawn as text, so no icon-font dependency is needed. Hero and
 * Kingdom use pixel art instead: the player's own head and a castle.
 */
const GLYPHS: Record<string, string> = {
  quests: '✦',
  shop: '◈',
  settings: '⚙',
};

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
              ) : name === 'kingdom' ? (
                <CastleTabIcon focused={focused} />
              ) : (
                <Text style={{ color, fontSize: fontSize.title }}>{GLYPHS[name]}</Text>
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
