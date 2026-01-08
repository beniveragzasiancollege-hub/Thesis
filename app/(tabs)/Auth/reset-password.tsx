import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { DsgLayout } from "@/components/DsgLayout";

const RED = "#d62828";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";
const LIGHT_GRAY = "#f2f2f2";
const ACCENT = "#6FA8A3";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleReset() {
    if (password.length < 6) {
      Alert.alert("Weak password", "Minimum 6 characters.");
      return;
    }

    if (password !== confirm) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      Alert.alert("Error", error.message);
      setSaving(false);
      return;
    }

    await supabase.auth.signOut();

    Alert.alert("Success", "Password updated. Please sign in.");
    setPassword("");
    setConfirm("");
    setSaving(false);
    setShowPassword(false);
    setShowConfirm(false);
    router.replace("/Auth/sign-in");
  }

  return (
    <DsgLayout subtitle="Create your new password.">
      <Text style={styles.title}>Input your New Passwords</Text>

      <Text style={styles.password}>Please Input your Password</Text>

      {/* New Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="New password"
          secureTextEntry={!showPassword}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.showBtn}
          onPress={() => setShowPassword((p) => !p)}
        >
          <Text style={styles.showText}>
            {showPassword ? "HIDE" : "SHOW"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.password}>Please Confirm your Password</Text>

      {/* Confirm Password */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Confirm password"
          secureTextEntry={!showConfirm}
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
        />
        <TouchableOpacity
          style={styles.showBtn}
          onPress={() => setShowConfirm((p) => !p)}
        >
          <Text style={styles.showText}>
            {showConfirm ? "HIDE" : "SHOW"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleReset}>
        <Text style={styles.btnText}>
          {saving ? "Saving..." : "Update Password"}
        </Text>
      </TouchableOpacity>
    </DsgLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 24,
  },

  password: {
    fontSize: 13,
    color: TEXT_GRAY,
    marginBottom: 6,
  },

  inputWrapper: {
    position: "relative",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingRight: 60,
    backgroundColor: "#fff",
  },

  showBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },

  showText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "600",
  },

  btn: {
    backgroundColor: ACCENT,
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
