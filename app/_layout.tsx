import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import {
  PixelifySans_400Regular,
  PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans';
import { ToastProvider, useToast } from '@/components/ToastProvider';
import { CelebrationHost } from '@/components/CelebrationHost';
import { GameWindow } from '@/components/GameWindow';
import { InstallPrompt } from '@/components/InstallPrompt';
import { setLanguage } from '@/i18n';
import { onStorageError } from '@/store/persistAdapter';
import { useSettingsStore } from '@/store/settingsStore';
import { useDayRollover } from '@/hooks/useDayRollover';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { APP_MAX_WIDTH, colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/**
 * Sits inside the providers so it can report storage failures as toasts and
 * run the day rollover once the persisted state has rehydrated.
 */
function AppShell() {
  const toast = useToast();
  const language = useSettingsStore((state) => state.language);

  // i18n is already initialised to Indonesian at import time; this applies the
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

  return (
    <GameWindow>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.night },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quest/[id]" options={{ presentation: 'modal' }} />
      </Stack>
      <CelebrationHost />
      <InstallPrompt />
    </GameWindow>
  );
}

export default function RootLayout() {
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
      <StatusBar style="light" />
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </>
  );
}

const styles = StyleSheet.create({
  booting: { flex: 1, backgroundColor: colors.night, maxWidth: APP_MAX_WIDTH },
});
