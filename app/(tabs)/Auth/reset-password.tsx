import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { DsgLayout } from "@/components/DsgLayout";
import { Ionicons } from "@expo/vector-icons";

const RED = "#d62828";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

useEffect(() => {
  if (ready) {
    console.log("[Reset] Session already initialized, ignoring URL");
    return;
  }

  const handleUrl = async (url: string) => {
    console.log("[Reset] Incoming URL:", url);

    const parsed = Linking.parse(url);
    const queryParams = parsed.queryParams ?? {};

    let hashParams: Record<string, string> = {};
    if (url.includes("#")) {
      const hash = url.split("#")[1];
      hashParams = Object.fromEntries(
        hash.split("&").map(p => {
          const [k, v] = p.split("=");
          return [k, decodeURIComponent(v)];
        })
      );
    }

    const params = { ...queryParams, ...hashParams };

    const access_token = params.access_token as string;
    const refresh_token = params.refresh_token as string;

    // ✅ SINGLE DELAYED FIRST ATTEMPT (NO RETRIES)
    console.log("[Reset] Waiting for recovery session to activate…");
    await new Promise(res => setTimeout(res, 1000));

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      router.replace("/Auth/sign-in");
      return;
    }

    console.log("[Reset] Recovery session established");
    setReady(true);
  };

  Linking.getInitialURL().then((url) => {
    if (url) handleUrl(url);
  });

  const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
  return () => sub.remove();
}, [ready]);


async function handleReset() {
  if (!ready) {
    Alert.alert("Please wait", "Initializing reset session…");
    return;
  }

  if (password.length < 3) {
    Alert.alert("No Password", "Password must be at least more than 3 characters.");
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

  // 🔐 HARD LOGOUT
  await supabase.auth.signOut({ scope: "global" });

  // 🧼 CLEAR LOCAL STATE
  setPassword("");
  setConfirm("");
  setReady(false);
  setSaving(false);

  Alert.alert("Success", "Password updated. Please sign in.");
  // 🔁 RESET FLOW
  router.replace("/Auth/sign-in");
}


  return (
    <DsgLayout
      activeTab="profile"
      subtitle="Create a new password for your SafeDumaGuide account."
      contentStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
    >
      <Text style={styles.title}>Create New Password</Text>

      <View style={styles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          placeholder="New password"
          style={[styles.input, { paddingRight: 40 }]}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(p => !p)}
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={TEXT_GRAY} />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showConfirm}
          placeholder="Confirm password"
          style={[styles.input, { paddingRight: 40 }]}
          value={confirm}
          onChangeText={setConfirm}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowConfirm(p => !p)}
        >
          <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color={TEXT_GRAY} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={saving}>
        <Text style={styles.btnText}>{saving ? "Saving..." : "Update Password"}</Text>
      </TouchableOpacity>
    </DsgLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  passwordWrapper: { position: "relative", justifyContent: "center" },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: RED,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});