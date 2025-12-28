// App.js  (or app/index.js if using Expo Router)
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DSG - Dumaguete Safe Guide</Text>
        <Text style={styles.headerSubtitle}>
          Backend: “Supabase Mock”. PNP number updates every 10s.
        </Text>
      </View>

      {/* Auth tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Text style={styles.tabText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Text style={styles.tabText}>Forgot?</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Sign In to SafeDumaGuide</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="user@example.com"
            placeholderTextColor="#9e9e9e"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="********"
            placeholderTextColor="#9e9e9e"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.forgotLinkWrapper}>
          <Text style={styles.forgotLink}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.registerText}>
          Don’t have an account?{" "}
          <Text style={styles.registerLink}>Register here</Text>
        </Text>
      </View>

      {/* Bottom tab bar */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity style={styles.bottomTab}>
          <Text style={styles.bottomTabIcon}>🛡️</Text>
          <Text style={styles.bottomTabLabel}>SafeDuma</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTab}>
          <Text style={styles.bottomTabIcon}>📍</Text>
          <Text style={styles.bottomTabLabel}>DumaGuide</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bottomTab, styles.bottomTabActive]}>
          <Text style={[styles.bottomTabIcon, styles.bottomTabLabelActive]}>
            🔒
          </Text>
          <Text style={[styles.bottomTabLabel, styles.bottomTabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const RED = "#d62828";
const LIGHT_GRAY = "#f2f2f2";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: RED,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#fceaea",
    fontSize: 11,
    marginTop: 2,
  },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: RED,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  tabButtonActive: {
    backgroundColor: RED,
  },
  tabText: {
    fontSize: 13,
    color: RED,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ffffff",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    color: "#222222",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: TEXT_GRAY,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },
  forgotLinkWrapper: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotLink: {
    fontSize: 12,
    color: RED,
  },
  signInButton: {
    backgroundColor: RED,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  registerText: {
    textAlign: "center",
    fontSize: 13,
    color: TEXT_GRAY,
    marginTop: 4,
  },
  registerLink: {
    color: RED,
    fontWeight: "600",
  },

  bottomTabs: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 10,
    marginHorizontal: 4,
    backgroundColor: "#ffffff",
  },
  bottomTabActive: {
    backgroundColor: RED,
  },
  bottomTabIcon: {
    fontSize: 18,
    marginBottom: 2,
    color: TEXT_GRAY,
  },
  bottomTabLabel: {
    fontSize: 11,
    color: TEXT_GRAY,
  },
  bottomTabLabelActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
