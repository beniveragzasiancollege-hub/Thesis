// app/(tabs)/DumaGuide/Dumaguide.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { DsgLayout } from "@/components/DsgLayout";

const RED = "#d62828";
const LIGHT_GRAY = "#f2f2f2";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";
const ACCENT = "#6FA8A3";

/* --- types to match your SQL --- */
type DirectoryCategory = {
  id: number;
  name: string;
  color: string | null;
};

type DirectoryPlace = {
  id: string;
  category_id: number;
  name: string;
  address: string | null;
  contact_number: string | null;
  latitude: number | null;
  longitude: number | null;
  created_by?: string | null;
};

type DisplayPlace = DirectoryPlace & {
  categoryName: string;
  categoryColor?: string | null;
  canEdit?: boolean;
};

export default function DumaGuide() {
  const [categories, setCategories] = useState<DirectoryCategory[]>([]);
  const [places, setPlaces] = useState<DisplayPlace[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ✅ ADD: role state
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  const loadDirectory = useCallback(async () => {
    try {
      setLoading(true);

      // 1) current user
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? null;

      setCurrentUserId(uid);
      setIsLoggedIn(!!uid);

      // ✅ ADD: load role (safe, no recursion)
      let resolvedRole: "admin" | "user" | null = null;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .single();

        resolvedRole = (profile?.role as "admin" | "user") ?? "user";
      }
      setRole(resolvedRole);

      // 2) categories
      const { data: catData, error: catErr } = await supabase
        .from("directory_categories")
        .select("*")
        .order("name", { ascending: true });

      if (catErr) return;

      const categories = catData ?? [];
      setCategories(categories);

      // 3) places
      const { data: placeData, error: placeErr } = await supabase
        .from("directory_places")
        .select("*")
        .order("name", { ascending: true });

      if (placeErr) return;

      const categoryMap = new Map<number, DirectoryCategory>();
      categories.forEach((c) => categoryMap.set(c.id, c));

      const displayPlaces: DisplayPlace[] =
        (placeData ?? []).map((p: DirectoryPlace) => {
          const cat = categoryMap.get(p.category_id);

          // ✅ UPDATED: role-aware canEdit
          const canEdit =
            role === "admin" ||
            (!!uid && !!p.created_by && p.created_by === uid);

          return {
            ...p,
            categoryName: cat?.name ?? "Unknown",
            categoryColor: cat?.color ?? null,
            canEdit,
          };
        }) ?? [];

      // ✅ ADD: role-based visibility
      const visiblePlaces = displayPlaces.filter((p) => {
        if (role === "admin") return true;
        if (!uid) return p.created_by === null;
        return p.created_by === null || p.created_by === uid;
      });

      setPlaces(visiblePlaces);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadDirectory();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadDirectory();
    });
    return () => subscription.subscription.unsubscribe();
  }, [loadDirectory]);

  useFocusEffect(
    useCallback(() => {
      loadDirectory();
    }, [loadDirectory])
  );

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places.filter((p) => {
      if (activeCategoryId !== "all" && p.category_id !== activeCategoryId) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    });
  }, [places, activeCategoryId, search]);

  function confirmCall(place: DisplayPlace) {
    if (!place.contact_number) return;
    Alert.alert(
      "Contact emergency?",
      `Are you sure you want to contact ${place.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          style: "destructive",
          onPress: () => Linking.openURL(`tel:${place.contact_number}`),
        },
      ]
    );
  }

  function openMap(place: DisplayPlace) {
    if (!place.latitude || !place.longitude) {
      Alert.alert("No coordinates", "This place doesn't have map coordinates yet.");
      return;
    }
    router.push(`../DumaGuideMap/${place.id}`);
  }

  function goToAdd() {
    router.push("/DumaGuide/AddDumaGuide");
  }

  function goToEdit(placeId: string) {
    router.push({
      pathname: "/DumaGuide/DumaGuideEdit",
      params: { id: placeId },
    });
  }

  async function deletePlace(placeId: string) {
    if (!currentUserId) return;
    await supabase.from("directory_places").delete().eq("id", placeId);
    loadDirectory();
  }

  return (
    <DsgLayout
      activeTab="dumaGuide"
      subtitle='Backend: **Supabase Mock**. PNP number updates every 10s.'
      contentStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.searchWrapper}>
          <TextInput
            placeholder="Search directory (Hotel, Hospital, etc.)"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterRow}>
          <FilterChip
            label="All"
            active={activeCategoryId === "all"}
            onPress={() => setActiveCategoryId("all")}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.name}
              active={activeCategoryId === cat.id}
              onPress={() => setActiveCategoryId(cat.id)}
            />
          ))}
        </View>

        <Text style={styles.mainContact}>Contact: 0354221137</Text>

        {(role === "admin" || role === "user") && (
          <View style={styles.addRow}>
            <TouchableOpacity style={styles.addButton} onPress={goToAdd}>
              <Text style={styles.addButtonText}>+ Add Duma Guide Place</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <Text style={styles.loading}>Loading places...</Text>
        ) : filteredPlaces.length === 0 ? (
          <Text style={styles.loading}>No places found.</Text>
        ) : (
          filteredPlaces.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{item.categoryName}</Text>
                {item.canEdit && <Text style={styles.myBadge}>My place</Text>}
              </View>

              <View style={styles.cardBody}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.address && (
                    <Text style={styles.cardAddress}>{item.address}</Text>
                  )}
                  {item.contact_number && (
                    <Text style={styles.cardContact}>
                      Contact: {item.contact_number}
                    </Text>
                  )}
                  {item.canEdit && (
                    <TouchableOpacity
                      style={styles.editLink}
                      onPress={() => goToEdit(item.id)}
                    >
                      <Text style={styles.editLinkText}>Edit place</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.iconColumn}>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => openMap(item)}
                  >
                    <Text style={styles.mapIcon}>🗺️</Text>
                  </TouchableOpacity>

                  {item.canEdit && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePlace(item.id)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  )}

                  {!item.canEdit && item.contact_number && (
                    <TouchableOpacity
                      style={[styles.callButton, { marginTop: 6 }]}
                      onPress={() => confirmCall(item)}
                    >
                      <Text style={styles.callIcon}>📞</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </DsgLayout>
  );
}

/* Small components */

function FilterChip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* styles unchanged */


/* STYLES – middle content only */

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },

  searchWrapper: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ffffff",
  },
  searchInput: {
    fontSize: 13,
    paddingVertical: 4,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#ffffff",
  },
  chipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  chipText: {
    fontSize: 11,
    color: TEXT_GRAY,
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },

  mainContact: {
    fontSize: 12,
    color: TEXT_GRAY,
    marginBottom: 4,
  },

  addRow: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  loading: {
    fontSize: 13,
    color: TEXT_GRAY,
    marginTop: 12,
  },

  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardType: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: "700",
  },
  myBadge: {
    fontSize: 10,
    color: "#ffffff",
    backgroundColor: ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardBody: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 12,
    color: TEXT_GRAY,
    marginBottom: 2,
  },
  cardContact: {
    fontSize: 12,
    color: TEXT_GRAY,
  },

  editLink: {
    marginTop: 4,
  },
  editLinkText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: "600",
  },

  iconColumn: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  mapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LIGHT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  mapIcon: {
    fontSize: 18,
  },

  callRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LIGHT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  callIcon: {
    fontSize: 18,
    color: "#ffffff",
  },
});
