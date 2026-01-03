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

        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        // ✅ If user HAS a session → go to app
        if (data?.session) {
          console.log("[Index] Session found");
          router.replace("/Home/Safeduma");
          return;
        }

        // ✅ NO session (normal for logout / forgot / reset)
        console.log("[Index] No session, redirecting to sign-in");
        router.replace("/Auth/sign-in");
      } catch (e) {
        console.error("[Index] Unexpected error:", e);
        if (isMounted) {
          router.replace("/Auth/sign-in");
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
