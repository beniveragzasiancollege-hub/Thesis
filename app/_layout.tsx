import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// ✅ EXISTING imports
import { BackHandler, Platform } from 'react-native';
import { useEffect } from 'react';

// ✅ ADDED import (Supabase + router)
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // ✅ EXISTING: global Android back-button blocker
useEffect(() => {
  if (Platform.OS !== 'android') return;

  const subscription = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      // allow back during deep links & auth flows
      return false;
    }
  );

  return () => subscription.remove();
}, []);


  // ✅ ADDED: GLOBAL AUTH STATE LISTENER (NO existing code touched)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace('/Auth/sign-in');
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
