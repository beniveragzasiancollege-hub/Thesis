import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { BackHandler, Platform } from "react-native";
import { useEffect } from "react";
import * as Linking from "expo-linking";

import { supabase } from "@/lib/supabase";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  /**
   * 🚫 IGNORE ALL INCOMING DEEP LINKS
   * (OTP emails may contain a fallback link like dsg:///)
   */
useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      // ✅ allow OTP + verification session
      if (event === "SIGNED_IN") return;

      if (!session) {
        router.replace("/Auth/sign-in");
      }
    }
  );

  return () => listener.subscription.unsubscribe();
}, []);


  /**
   * 🔙 ANDROID BACK BUTTON HANDLER
   */
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // ✅ Allow app exit on sign-in screen
        if (pathname === "/Auth/sign-in") {
          return false;
        }

        // 🔐 Force everything else back to sign-in
        router.replace("/Auth/sign-in");
        return true;
      }
    );

    return () => subscription.remove();
  }, [pathname]);

  /**
   * 🔐 GLOBAL AUTH GUARD (OTP-SAFE)
   */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/Auth/sign-in");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
