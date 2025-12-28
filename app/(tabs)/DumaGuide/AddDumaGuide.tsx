// app/(tabs)/DumaGuide/AddDumaGuide.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import { supabase } from "@/lib/supabase";
import { DsgLayout } from "@/components/DsgLayout";

const RED = "#d62828";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";

const { height } = Dimensions.get("window");
const MAP_HEIGHT = Math.round(height * 0.4); // ~40% of screen

type DirectoryCategory = {
  id: number;
  name: string;
  color: string | null;
};

function normalizeCategoryName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function AddDumaGuide() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [placeName, setPlaceName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoadingAuth(true);

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("auth.getUser error (AddDumaGuide):", error);
        }

        const user = data?.user ?? null;

        if (!user) {
          Alert.alert(
            "Sign in required",
            "Please sign in to add a DumaGuide place."
          );
          router.replace("/Auth/sign-in");
          return;
        }

        setUserId(user.id);
      } finally {
        setLoadingAuth(false);
      }
    }

    checkAuth();
  }, []);

  async function handleSave() {
    if (!userId) {
      Alert.alert(
        "Sign in required",
        "Your session has expired. Please sign in again."
      );
      router.replace("/Auth/sign-in");
      return;
    }

    if (!placeName.trim() || !categoryName.trim()) {
      Alert.alert("Missing info", "Place name and area type are required.");
      return;
    }

    if (selectedLat == null || selectedLng == null) {
      Alert.alert(
        "Pick a location",
        "Please tap on the map to choose where this place is."
      );
      return;
    }

    if (selectedLat < -90 || selectedLat > 90) {
      Alert.alert(
        "Latitude out of range",
        "Latitude must be between -90 and 90."
      );
      return;
    }
    if (selectedLng < -180 || selectedLng > 180) {
      Alert.alert(
        "Longitude out of range",
        "Longitude must be between -180 and 180."
      );
      return;
    }

    try {
      setSaving(true);

      const rawCategory = categoryName;
      const normalizedInput = normalizeCategoryName(rawCategory);

      const { data: allCats, error: catListError } = await supabase
        .from("directory_categories")
        .select("*");

      if (catListError) {
        console.error("Category list error:", catListError);
        Alert.alert("Error", "Could not read area types.");
        return;
      }

      let categoryId: number | null = null;

      if (allCats && allCats.length > 0) {
        const match = allCats.find((c: DirectoryCategory) => {
          return normalizeCategoryName(c.name) === normalizedInput;
        });

        if (match) {
          categoryId = match.id;
        }
      }

      if (categoryId === null) {
        const displayName = rawCategory.trim().replace(/\s+/g, " ");

        const { data: inserted, error: insertError } = await supabase
          .from("directory_categories")
          .insert({ name: displayName })
          .select()
          .single();

        if (insertError || !inserted) {
          console.error("Category insert error:", insertError);
          Alert.alert("Error", "Could not save the area type.");
          return;
        }

        categoryId = inserted.id;
      }

      const { error: placeError } = await supabase
        .from("directory_places")
        .insert({
          category_id: categoryId,
          name: placeName.trim(),
          address: address.trim() || null,
          contact_number: contactNumber.trim() || null,
          latitude: selectedLat,
          longitude: selectedLng,
          created_by: userId,
        });

      if (placeError) {
        console.error("Place insert error:", placeError);
        Alert.alert("Error", "Could not save the place. Please try again.");
        return;
      }

      Alert.alert(
        "Saved",
        "Your place has been added to DumaGuide (visible only to you)."
      );

      // ⬇️ Go straight back to DumaGuide; it reloads on focus.
      router.replace("/DumaGuide/Dumaguide");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const mapHtml = useMemo(
    () => buildLeafletPickerHtml({ lat: selectedLat, lng: selectedLng }),
    [selectedLat, selectedLng]
  );

  function onMapMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.lat === "number" && typeof data.lng === "number") {
        setSelectedLat(data.lat);
        setSelectedLng(data.lng);
      }
    } catch (err) {
      console.warn("Failed to parse map message:", err);
    }
  }

  // 👉 Just a plain loading screen while we check auth
  if (loadingAuth) {
    return (
      <DsgLayout activeTab="dumaGuide">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: TEXT_GRAY, fontSize: 14 }}>Loading…</Text>
        </View>
      </DsgLayout>
    );
  }

  return (
    <DsgLayout
      activeTab="dumaGuide"
      subtitle="Add a custom location (only you can see it)."
      contentStyle={styles.content}
    >
      <Text style={styles.title}>Add Duma Guide Place</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Place Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My Boarding House"
          value={placeName}
          onChangeText={setPlaceName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Area Type / Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Hospital, Restaurant, Safe Spot"
          value={categoryName}
          onChangeText={setCategoryName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street, Barangay, City"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="09XXXXXXXXX"
          value={contactNumber}
          onChangeText={(text) => {
            const sanitized = text.replace(/[^0-9+]/g, "");
            setContactNumber(sanitized);
          }}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location on Map</Text>
        <Text style={styles.helperText}>
          Tap on the map to set the location. A marker will appear where you tap.
        </Text>

        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={onMapMessage}
          />
        </View>

        <Text style={styles.coordsText}>
          {selectedLat != null && selectedLng != null
            ? `Selected: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`
            : "No location chosen yet."}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Place"}
        </Text>
      </TouchableOpacity>
    </DsgLayout>
  );
}

function buildLeafletPickerHtml(params: { lat: number | null; lng: number | null }) {
  const { lat, lng } = params;

  const defaultLat = 9.3068;
  const defaultLng = 123.3054;

  const centerLat = lat ?? defaultLat;
  const centerLng = lng ?? defaultLng;

  const currentLatStr = lat != null ? lat.toString() : "null";
  const currentLngStr = lng != null ? lng.toString() : "null";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    crossorigin=""
  />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    crossorigin=""
  ></script>
  <script>
    const initialLat = ${centerLat};
    const initialLng = ${centerLng};
    const currentLat = ${currentLatStr};
    const currentLng = ${currentLngStr};

    const map = L.map('map').setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);

    let marker = null;

    if (currentLat !== null && currentLng !== null) {
      marker = L.marker([currentLat, currentLng]).addTo(map);
    }

    map.on('click', function(e) {
      const { lat, lng } = e.latlng;

      if (marker) {
        map.removeLayer(marker);
      }
      marker = L.marker([lat, lng]).addTo(map);

      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
      }
    });
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 16,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: TEXT_GRAY,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 11,
    color: "#777",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: "#ffffff",
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: "#f7f7f7",
  },
  map: {
    flex: 1,
  },
  coordsText: {
    marginTop: 6,
    fontSize: 12,
    color: TEXT_GRAY,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: RED,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
