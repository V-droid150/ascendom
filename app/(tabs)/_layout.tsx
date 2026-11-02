import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { border, colors, fonts, fontSize, MIN_TOUCH_SIZE } from '@/theme';

/** Tab glyphs drawn as text, so no icon-font dependency is needed. */
const GLYPHS: Record<string, string> = {
  quests: '✦',
  hero: '☗',
  kingdom: '⌂',
  shop: '◈',
  settings: '⚙',
};

export default function TabsLayout() {
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
          height: MIN_TOUCH_SIZE + 24,
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
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: fontSize.title }}>{GLYPHS[name]}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
