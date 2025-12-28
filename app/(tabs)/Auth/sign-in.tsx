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
import { Ionicons } from "@expo/vector-icons";

const RED = "#d62828";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";
const LIGHT_GRAY = "#f2f2f2";
const ACCENT = "#6FA8A3";


export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        const lower = error.message.toLowerCase();
        if (
          lower.includes("email not confirmed") ||
          lower.includes("not allowed")
        ) {
          Alert.alert(
            "Email not confirmed",
            "Please open the verification link sent to your email before signing in."
          );
        } else {
          Alert.alert("Sign in failed", error.message);
        }
        return;
      }

      if (!data.user) {
        Alert.alert("Error", "No user returned from Supabase.");
        return;
      }
      // Clear form fields after successful sign in
      setEmail("");
      setPassword("");
      setShowPassword(false);

      router.replace("/Home/Safeduma");
    } catch (e: any) {
      console.error("Unexpected error:", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DsgLayout
      activeTab="profile"
      subtitle="Use your verified Supabase account to sign in."
      contentStyle={styles.content}
    >
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/Auth/register")}
        >
          <Text style={styles.tabText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/Auth/forgot")}
        >
          <Text style={styles.tabText}>Forgot?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Sign In to SafeDumaGuide</Text>

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

      {/* PASSWORD WITH EYE TOGGLE */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>

        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, { paddingRight: 40 }]}
            placeholder="********"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={TEXT_GRAY}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.forgotWrap}>
        <Text
          style={styles.forgotText}
          onPress={() => router.push("/Auth/forgot")}
        >
          Forgot Password?
        </Text>
      </View>

      <TouchableOpacity
        style={styles.signBtn}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.signText}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.register}>
        Don’t have an account?{" "}
        <Text
          style={styles.registerLink}
          onPress={() => router.push("/Auth/register")}
        >
          Register here
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

  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: TEXT_GRAY, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },

  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },

  forgotWrap: {
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 20,
  },
  forgotText: { fontSize: 12, color: ACCENT },

  signBtn: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
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
