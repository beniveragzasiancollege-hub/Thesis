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
import { router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { supabase } from "@/lib/supabase";
import { DsgLayout } from "@/components/DsgLayout";

const RED = "#d62828";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";

const { height } = Dimensions.get("window");
const MAP_HEIGHT = Math.round(height * 0.4);

type DirectoryPlace = {
  id: string;
  category_id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
  latitude: number | null;
  longitude: number | null;
  created_by: string | null;
};

type DirectoryCategory = {
  id: number;
  name: string;
  color: string | null;
};

function normalizeCategoryName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function DumaGuideEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingPlace, setLoadingPlace] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoadingAuth(true);

        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;

        if (!user) {
          Alert.alert(
            "Sign in required",
            "Please sign in to edit a DumaGuide place."
          );
          router.replace("/Auth/sign-in");
          return;
        }

        setUserId(user.id);
        await loadPlace(user.id);
      } finally {
        setLoadingAuth(false);
      }
    }

    init();
  }, [id]);

  async function loadPlace(currentUserId: string) {
    try {
      setLoadingPlace(true);

      const { data } = await supabase
        .from("directory_places")
        .select(
          "id, category_id, name, address, contact_number, latitude, longitude, created_by"
        )
        .eq("id", id)
        .maybeSingle();

      const place = data as DirectoryPlace | null;
      if (!place || place.created_by !== currentUserId) {
        Alert.alert("Not allowed");
        router.back();
        return;
      }

      setPlaceName(place.name);
      setAddress(place.address ?? "");
      setContactNumber(place.contact_number ?? "");
      setSelectedLat(place.latitude);
      setSelectedLng(place.longitude);
      setCategoryId(place.category_id);

      const { data: cat } = await supabase
        .from("directory_categories")
        .select("name")
        .eq("id", place.category_id)
        .maybeSingle();

      if (cat) setCategoryName(cat.name);
    } finally {
      setLoadingPlace(false);
    }
  }

  async function handleSave() {
    if (!userId) return;

    if (!placeName.trim()) {
      Alert.alert("Missing info", "Location name is required.");
      return;
    }

    if (selectedLat == null || selectedLng == null) {
      Alert.alert("Pick a location", "Please select a location on the map.");
      return;
    }

    try {
      setSaving(true);

      let effectiveCategoryId = categoryId;

      if (categoryName.trim()) {
        const normalizedInput = normalizeCategoryName(categoryName);

        const { data: allCats } = await supabase
          .from("directory_categories")
          .select("*");

        const match = (allCats as DirectoryCategory[] | null)?.find(
          (c) => normalizeCategoryName(c.name) === normalizedInput
        );

        if (match) {
          effectiveCategoryId = match.id;
        }

        if (effectiveCategoryId === null) {
          const { data: inserted } = await supabase
            .from("directory_categories")
            .insert({ name: categoryName.trim() })
            .select()
            .single();

          if (inserted) effectiveCategoryId = inserted.id;
        }
      }

      await supabase
        .from("directory_places")
        .update({
          name: placeName.trim(),
          address: address.trim() || null,
          contact_number: contactNumber.trim() || null,
          latitude: selectedLat,
          longitude: selectedLng,
          category_id: effectiveCategoryId ?? categoryId,
        })
        .eq("id", id)
        .eq("created_by", userId);

      Alert.alert("Saved", "Location updated successfully.");
      router.replace("/DumaGuide/Dumaguide");
    } finally {
      setSaving(false);
    }
  }

  const mapHtml = useMemo(
    () => buildLeafletPickerHtml({ lat: selectedLat, lng: selectedLng }),
    [selectedLat, selectedLng]
  );

  function onMapMessage(event: any) {
    const data = JSON.parse(event.nativeEvent.data);
    setSelectedLat(data.lat);
    setSelectedLng(data.lng);
  }

  if (loadingAuth || loadingPlace) {
    return (
      <DsgLayout activeTab="dumaGuide">
        <Text style={{ textAlign: "center", marginTop: 20, color: TEXT_GRAY }}>
          Loading place...
        </Text>
      </DsgLayout>
    );
  }

  return (
    <DsgLayout activeTab="dumaGuide" contentStyle={styles.content}>
      <Text style={styles.title}>Edit Location Details</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location Name</Text>
        <TextInput style={styles.input} value={placeName} onChangeText={setPlaceName} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Area Type / Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Hospital, Restaurant, Safe Spot"
          value={categoryName}
          onChangeText={setCategoryName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Street, Barangay, City"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          value={contactNumber}
          onChangeText={(text) =>
            setContactNumber(text.replace(/[^0-9+]/g, ""))
          }
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Location on Map</Text>
        <Text style={styles.helperText}>
          Tap on the map to update the location.
        </Text>

        <View style={styles.mapContainer}>
          <WebView source={{ html: mapHtml }} onMessage={onMapMessage} />
        </View>

        <Text style={styles.coordsText}>
          {selectedLat && selectedLng
            ? `Selected: ${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`
            : "No location selected yet."}
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </DsgLayout>
  );
}

/* unchanged map function */

function buildLeafletPickerHtml(params: { lat: number | null; lng: number | null }) {
  const { lat, lng } = params;
  const centerLat = lat ?? 9.3068;
  const centerLng = lng ?? 123.3054;

  return `
<!DOCTYPE html>
<html>
<body>
<div id="map" style="height:100%"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('map').setView([${centerLat}, ${centerLng}], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker = ${lat && lng ? `L.marker([${lat}, ${lng}]).addTo(map)` : "null"};
map.on('click', e => {
  if (marker) map.removeLayer(marker);
  marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
  window.ReactNativeWebView.postMessage(JSON.stringify(e.latlng));
});
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginVertical: 16 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: TEXT_GRAY, marginBottom: 4 },
  helperText: { fontSize: 11, color: "#777", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  coordsText: { fontSize: 12, color: TEXT_GRAY, marginTop: 6 },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#6FA8A3", // accent green
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },

  saveText: { color: "#fff", fontWeight: "700" },
});
