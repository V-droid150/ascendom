import { useEffect, type ReactElement } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { PixelifySans_400Regular, PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import { CelebrationHost } from '@/components/CelebrationHost';
import { SyncConflictModal } from '@/components/SyncConflictModal';
import { GameWindow, ReadingColumn } from '@/components/GameWindow';
import { InstallPrompt } from '@/components/InstallPrompt';
import { setLanguage } from '@/i18n';
import { onStorageError } from '@/store/persistAdapter';
import { useSettingsStore } from '@/store/settingsStore';
import { useDayRollover } from '@/hooks/useDayRollover';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { APP_MAX_WIDTH, makeStyles, useColors, useThemeMode } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/**
 * Sits inside the providers so it can report storage failures as toasts and
 * run the day rollover once the persisted state has rehydrated.
 */
function AppShell() {
  const colors = useColors();
  const toast = useToast();
  const language = useSettingsStore((state) => state.language);

  // i18n is already initialised to English at import time; this applies the
  // user's persisted choice once the settings store rehydrates.
  useEffect(() => {
    setLanguage(language);
  }, [language]);

  useEffect(() => {
    onStorageError((operation) => {
      toast.show(
        operation === 'load' ? 'Gagal memuat data kerajaan.' : 'Gagal menyimpan. Coba lagi.',
        'danger',
      );
    });
  }, [toast]);

  useDayRollover();
  useNotificationSync();
  useCloudSync();

  return (
    <GameWindow>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.night },
          animation: 'fade',
        }}
        screenLayout={readingLayout}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quest/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="auth/email" />
        <Stack.Screen name="auth/reset" />
        <Stack.Screen name="auth/google-app" />
        <Stack.Screen name="auth/handoff" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="wardrobe" />
      </Stack>
      <CelebrationHost />
      <SyncConflictModal />
      <InstallPrompt />
    </GameWindow>
  );
}

export default function RootLayout() {
  const themeMode = useThemeMode();
  const styles = useStyles();
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P_400Regular,
    PixelifySans_400Regular,
    PixelifySans_700Bold,
  });

  useEffect(() => {
    // Hide the splash once fonts settle. A font failure must not trap the user
    // on a splash screen forever, so an error also releases it.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={styles.booting} />;
  }

  return (
    <>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  booting: { flex: 1, backgroundColor: colors.night, maxWidth: APP_MAX_WIDTH },
}));

/** Forms and single-story screens stay a readable column on wide windows. */
const READING_ROUTES = new Set([
  'quest/[id]',
  'auth/callback',
  'auth/email',
  'auth/reset',
  'auth/google-app',
  'auth/handoff',
  'privacy',
  'wardrobe',
]);

function readingLayout({
  route,
  children,
}: {
  route: { name: string };
  children: ReactElement;
}): ReactElement {
  return READING_ROUTES.has(route.name) ? <ReadingColumn>{children}</ReadingColumn> : children;
}
