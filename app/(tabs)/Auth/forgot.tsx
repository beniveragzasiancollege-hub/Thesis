import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { DsgLayout } from "@/components/DsgLayout";

const RED = "#d62828";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";
const LIGHT_GRAY = "#f2f2f2";
const ACCENT = "#6FA8A3";
export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleReset = async () => {
    if (sending) return;

    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }

    try {
      setSending(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "dsg://Auth/reset-password",
        }
      );

      if (error) {
        console.error("resetPassword error:", error);
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Check your email",
        "We sent a password reset link to your email if it exists in our system."
      );
      setEmail("");
    } catch (e: any) {
      console.error("Unexpected error:", e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DsgLayout
      activeTab="profile"
      subtitle="Reset your SafeDumaGuide password via email."
      contentStyle={styles.content}
    >
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/Auth/sign-in")}
        >
          <Text style={styles.tabText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/Auth/register")}
        >
          <Text style={styles.tabText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Forgot?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Forgot Password</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="user@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <TouchableOpacity
        style={styles.signBtn}
        onPress={handleReset}
        disabled={sending}
      >
        <Text style={styles.signText}>
          {sending ? "Sending..." : "Send reset link"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.register}>
        Remembered your password?{" "}
        <Text
          style={styles.registerLink}
          onPress={() => router.push("/Auth/sign-in")}
        >
          Sign in here
        </Text>
      </Text>
    </DsgLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  tabs: { flexDirection: "row", marginTop: 16 },
  tabBtn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingVertical: 7,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  tabBtnActive: { backgroundColor: ACCENT },
  tabText: { color: ACCENT, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#ffffff" },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 24,
  },

  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: TEXT_GRAY, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },

  signBtn: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  signText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  register: { textAlign: "center", fontSize: 13, color: TEXT_GRAY },
  registerLink: { color: ACCENT, fontWeight: "600" },

  footer: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
