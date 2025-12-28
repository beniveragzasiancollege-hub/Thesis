// components/DsgLayout.tsx
import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Image } from "react-native";

const RED = "#d62828";
const LIGHT_GRAY = "#f2f2f2";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";

type TabKey = "safeDuma" | "dumaGuide" | "profile";

type Props = {
  children: ReactNode;
  /** Which bottom tab should be highlighted */
  activeTab?: TabKey;
  /** Optional subtitle text under the red header */
  subtitle?: string;
  /** Extra padding for scroll content */
  contentStyle?: any;
};

export function DsgLayout({
  children,
  activeTab = "profile",
  subtitle = 'Backend: **Supabase Mock**. PNP number updates every 10s.',
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const handleSafeDuma = () => {
    router.push("/Home/Safeduma");
  };

  const handleDumaGuide = () => {
    router.push("/DumaGuide/Dumaguide");
  };

  const handleProfile = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      // ✅ logged in
      router.push("/Auth/profile");
    } else {
      // ❌ not logged in
      router.push("/Auth/sign-in");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Dumaguete Safe Guide</Text>
          </View>

          <View style={styles.headerSubBar}>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>


      {/* MAIN CONTENT (scroll + keyboard aware) */}
      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <FooterTab
          label="SafeDuma"
          icon="🛡️"
          active={activeTab === "safeDuma"}
          onPress={handleSafeDuma}
        />
        <FooterTab
          label="DumaGuide"
          icon="📍"
          active={activeTab === "dumaGuide"}
          onPress={handleDumaGuide}
        />
        <FooterTab
          label="Profile"
          icon="🔒"
          active={activeTab === "profile"}
          onPress={handleProfile}
        />
      </View>
    </View>
  );
}

/* ---- footer tab button ---- */
type FooterTabProps = {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

function FooterTab({ icon, label, active, onPress }: FooterTabProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.footerTab, active && styles.footerTabActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.footerIcon, active && styles.footerIconActive]}>{icon}</Text>
      <Text style={[styles.footerLabel, active && styles.footerLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /* HEADER */
  header: {
    backgroundColor: RED,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerSubBar: {
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#555555",
  },

  /* MAIN */
  main: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  /* FOOTER */
  footer: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerTab: {
    flex: 1,
    alignItems: "center",
  },
  footerTabActive: {},
  footerIcon: {
    fontSize: 18,
  },
  footerIconActive: {
    color: RED,
  },
  footerLabel: {
    fontSize: 11,
    color: TEXT_GRAY,
  },
  footerLabelActive: {
    color: RED,
    fontWeight: "700",
  },
headerRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingTop: 10,
  paddingBottom: 8,
},

headerLogo: {
  width: 40,
  height: 35,
  marginRight: 10,
},

});
