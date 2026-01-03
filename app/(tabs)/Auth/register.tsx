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
export default function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    if (password.length < 4) {
      Alert.alert(
        "Invalid password",
        "Password must be more than 3 characters."
      );
      return; // ⛔ stops execution → no looping
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);

        const lower = error.message.toLowerCase();
        if (
          error.code === "user_already_exists" ||
          lower.includes("already registered") ||
          lower.includes("already have") ||
          lower.includes("duplicate")
        ) {
          Alert.alert(
            "Email already in use",
            "That email already has an account or a verification link was already sent. Please check your inbox or try signing in."
          );
        } else {
          Alert.alert("Registration failed", error.message);
        }
        return;
      }

      if (!data.user) {
        Alert.alert(
          "Verify your email",
          "We created your account. Please open the verification link sent to your email before signing in."
        );
      } else {
        Alert.alert(
          "Account created",
          "Your account has been created. If email verification is required, please confirm your email before signing in."
        );
      }
      // Clear form fields after successful registration
      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      router.replace("/Auth/sign-in");
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
      subtitle="Backend: Supabase Auth + profiles table."
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

        <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/Auth/forgot")}
        >
          <Text style={styles.tabText}>Forgot?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Register for SafeDumaGuide</Text>

      {/* Full name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      {/* Phone */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="09XXXXXXXXX"
          value={phone}
          onChangeText={(text) => {
            const sanitized = text.replace(/[^0-9+]/g, "");
            setPhone(sanitized);
          }}
          keyboardType="phone-pad"
        />
      </View>

      {/* Email */}
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

      {/* Password */}
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
            onPress={() => setShowPassword((p) => !p)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={TEXT_GRAY}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, { paddingRight: 40 }]}
            placeholder="********"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((p) => !p)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color={TEXT_GRAY}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.signBtn}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.signText}>
          {loading ? "Registering..." : "Register"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.register}>
        Already have an account?{" "}
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
