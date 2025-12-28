// app/index.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        console.log("[Index] Checking Supabase session...");
        const { data, error } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error) {
          // This error is normal if there is no session:
          // [AuthSessionMissingError: Auth session missing!]
          console.log("[Index] getUser error:", error.message);
        } else {
          console.log("[Index] getUser result:", data?.user ? "has user" : "no user");
        }

        // ✅ Either way, go into the app. Auth is handled inside other screens.
        router.replace("/Home/Safeduma");
      } catch (e) {
        console.error("[Index] Unexpected error in bootstrap:", e);
        if (isMounted) {
          // Fallback: still go to main app instead of hanging
          router.replace("/Home/Safeduma");
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>DSG - Dumaguete Safe Guide</Text>
      <Text style={styles.subtitle}>
        Preparing your SafeDuma experience...
      </Text>
      <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#d62828",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#ffeaea",
    textAlign: "center",
  },
});
