// app/(tabs)/DumaGuideMap/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

import { supabase } from "@/lib/supabase";
import { DsgLayout } from "@/components/DsgLayout";

import { Dimensions } from "react-native";

const { height } = Dimensions.get("window");

const MAP_HEIGHT = Math.round(height * 0.55); // ~55% of screen height


type Place = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function DumaGuideMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [place, setPlace] = useState<Place | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData(id as string);
  }, [id]);

async function loadData(placeId: string) {
  try {
    // 1) Load place from Supabase
    const { data, error } = await supabase
      .from("directory_places")
      .select("id,name,address,latitude,longitude")
      .eq("id", placeId)
      .single();

    if (error || !data) {
      console.error("Place load error:", error);
      Alert.alert("Error", "Could not load place map info.");
      setLoading(false);
      return;
    }

    setPlace(data);

    // If no coordinates exist → show page immediately (no GPS attempt)
    if (!data.latitude || !data.longitude) {
      setLoading(false);
      return;
    }

    // 2) Try to get current user location (NON-BLOCKING)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Disabled",
          "Location permission is not granted. Showing destination only."
        );
        setLoading(false);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Off",
          "Your device location services are disabled. Showing destination only."
        );
        setLoading(false);
        return;
      }

      // ⏱️ SAFETY TIMEOUT — prevents long waiting hangs
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 4000)
        ),
      ]);

      if (!result) throw new Error("timeout");

      setUserLat(result.coords.latitude);
      setUserLng(result.coords.longitude);

    } catch (locErr: any) {
      console.log("GPS failed:", locErr?.message ?? locErr);

      Alert.alert(
        "Current Location Unavailable",
        "We couldn't detect your location. Showing destination only."
      );
      // Continue normally — don’t block UX
    }

    setLoading(false);
  } catch (e) {
    console.error(e);
    Alert.alert("Error", "Something went wrong while loading the map.");
    setLoading(false);
  }
}

  // Build Leaflet HTML whenever we have data
  const html = buildLeafletHtml({
    placeName: place?.name ?? "Location",
    placeLat: place?.latitude ?? null,
    placeLng: place?.longitude ?? null,
    userLat,
    userLng,
  });

  const hasCoords = !!place?.latitude && !!place?.longitude;

  return (
    <DsgLayout activeTab="dumaGuide" subtitle={place?.name ?? "DumaGuide Map"}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.infoText}>Loading map...</Text>
        </View>
      ) : !place ? (
        <View style={styles.center}>
          <Text style={styles.infoText}>Place not found.</Text>
        </View>
      ) : !hasCoords ? (
        <View style={styles.center}>
          <Text style={styles.infoText}>
            This place does not have coordinates saved yet.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{place.name}</Text>
          {place.address ? (
            <Text style={styles.subtitle}>{place.address}</Text>
          ) : null}

          {/* Leaflet map inside WebView */}
          <View style={styles.mapContainer}>
            <WebView
              originWhitelist={["*"]}
              source={{ html }}
              style={styles.map}
            />
          </View>

          <Text style={styles.infoText}>
            Red pin = destination. Blue pin = your location (if permission
            granted). Zoom and drag to explore.
          </Text>
        </View>
      )}
    </DsgLayout>
  );
}

/**
 * Builds a tiny HTML page that renders Leaflet map + markers + line.
 */
function buildLeafletHtml(params: {
  placeName: string;
  placeLat: number | null;
  placeLng: number | null;
  userLat: number | null;
  userLng: number | null;
}) {
  const { placeName, placeLat, placeLng, userLat, userLng } = params;

  if (placeLat == null || placeLng == null) {
    // we won't actually use this if no coords, just a safety fallback
    return "<html><body><p>No coordinates.</p></body></html>";
  }

  // stringify numbers safely for embedding in JS
  const destLat = placeLat.toString();
  const destLng = placeLng.toString();
  const userLatStr = userLat != null ? userLat.toString() : "null";
  const userLngStr = userLng != null ? userLng.toString() : "null";

  const safeName = placeName.replace(/'/g, "\\'");

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
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
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
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    const destLat = ${destLat};
    const destLng = ${destLng};
    const userLat = ${userLatStr};
    const userLng = ${userLngStr};

    const map = L.map('map').setView([destLat, destLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);

    // Destination marker
    const destMarker = L.marker([destLat, destLng]).addTo(map);
    destMarker.bindPopup('${safeName}').openPopup();

    // If we have user location, show it + line
    if (userLat !== null && userLng !== null) {
      const userMarker = L.marker([userLat, userLng], {
        opacity: 0.9
      }).addTo(map);
      userMarker.bindPopup('You are here');

      const polyline = L.polyline(
        [
          [userLat, userLng],
          [destLat, destLng]
        ],
        { color: 'blue', weight: 4, opacity: 0.7 }
      ).addTo(map);

      const bounds = L.latLngBounds([
        [userLat, userLng],
        [destLat, destLng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      // focus on destination only
      map.setView([destLat, destLng], 16);
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  mapContainer: {
    height: MAP_HEIGHT,        // ✅ responsive
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  map: {
    width: "100%",
    height: "100%",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  subtitle: {
    fontSize: 13,
    color: "#555",
  },

  infoText: {
    fontSize: 12,
    color: "#555",
    marginTop: 8,
  },
});
