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
import { router, useLocalSearchParams } from "expo-router";
import { DsgLayout } from "@/components/DsgLayout";

const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";
const ACCENT = "#6FA8A3";

export default function VerifyOtp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (otp.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    setLoading(false);

    if (error) {
      Alert.alert("Invalid code", error.message);
      return;
    }
    setOtp("");
    router.replace("/Auth/reset-password");
  }

  return (
    <DsgLayout subtitle="Enter the code we sent to your email.">
      
      <Text style={styles.title}>Verify Code</Text>

      <Text style={styles.label}>
        Please enter the code sent to your email
      </Text>

      <TextInput
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.btn} onPress={handleVerify}>
        <Text style={styles.btnText}>
          {loading ? "Verifying..." : "Verify Code"}
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
  label: { fontSize: 13, color: TEXT_GRAY, marginBottom: 6 },
  input: {  borderWidth: 1, padding: 12, marginBottom: 12, textAlign: "center", letterSpacing: 6, fontSize: 18, borderColor: BORDER_GRAY,
    borderRadius: 6,},
  btn: { backgroundColor: "#6FA8A3", padding: 12, alignItems: "center", borderRadius: 10,},
  btnText: { color: "#fff", fontWeight: "700" },
  email: {fontSize: 13, color: TEXT_GRAY, marginBottom: 6 },
});
