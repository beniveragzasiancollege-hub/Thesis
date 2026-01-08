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

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, // 🔐 reset only
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Check your email", "We sent a 6-digit code.");
    setEmail("");
    router.push({
      pathname: "/Auth/verify-otp",
      params: { email: email.trim() },
    });
  }

  return (
    <DsgLayout subtitle="Reset your password using a one-time code.">
            {/* Tabs */}
<View style={styles.tabs}>
  {/* Sign In */}
  <TouchableOpacity
    style={styles.tabBtn}
    onPress={() => router.push("/Auth/sign-in")}
  >
    <Text style={styles.tabText}>Sign In</Text>
  </TouchableOpacity>

  {/* Register */}
  <TouchableOpacity
    style={styles.tabBtn}
    onPress={() => router.push("/Auth/register")}
  >
    <Text style={styles.tabText}>Register</Text>
  </TouchableOpacity>

  {/* Forgot (ACTIVE) */}
  <TouchableOpacity
    style={[styles.tabBtn, styles.tabBtnActive]}
  >
    <Text style={[styles.tabText, styles.tabTextActive]}>
      Forgot?
    </Text>
  </TouchableOpacity>
</View>
      <Text style={styles.title}>Forgot Password?</Text>
             <Text style={styles.email}>
             Please Input your Email
       </Text>
      <TextInput
        placeholder="Email address"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      
      <TouchableOpacity style={styles.btn} onPress={handleSendOtp}>
        <Text style={styles.btnText}>
          {loading ? "Sending..." : "Send Code"}
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
tabs: {
  flexDirection: "row",
  marginTop: 16,
},

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

tabBtnActive: {
  backgroundColor: ACCENT,
},

tabText: {
  color: ACCENT,
  fontSize: 13,
  fontWeight: "600",
},

tabTextActive: {
  color: "#ffffff",
},

  input: {    borderWidth: 1,     borderColor: BORDER_GRAY,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16, },
  btn: { backgroundColor: "#6FA8A3", padding: 12, alignItems: "center", borderRadius: 10,},
  btnText: { color: "#fff", fontWeight: "700" },
  email: {fontSize: 13, color: TEXT_GRAY, marginBottom: 6 },
});
