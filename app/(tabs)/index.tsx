// app/index.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";

export default function IndexScreen() {

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
