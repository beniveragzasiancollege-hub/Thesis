import React, { useEffect, useState } from "react";
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
import { Image } from "react-native";
import * as ImagePicker from "expo-image-picker";

const RED = "#d62828";
const LIGHT_GRAY = "#f2f2f2";
const BORDER_GRAY = "#dddddd";
const TEXT_GRAY = "#555555";

type EmergencyReport = {
  id: string;
  report_type: string;
  department: string;
  description: string;
  status: string;
  created_at: string;
};

export default function Profile() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [editing, setEditing] = useState(false);

  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    loadProfileAndReports();
  }, []);

  async function loadProfileAndReports() {
    try {
      setLoadingProfile(true);

      const { data: authData, error } = await supabase.auth.getUser();

      if (error) {
        console.error("auth.getUser error:", error);
        Alert.alert("Error", "Could not load profile.");
        setLoadingProfile(false);
        setLoadingReports(false);
        return;
      }

      if (!authData.user) {
        router.replace("/Auth/sign-in");
        return;
      }

      const u = authData.user;
      setUserId(u.id);
      setEmail(u.email ?? "");

      // 1) load profile row
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone, address, avatar_url")
        .eq("id", u.id)
        .maybeSingle();

      if (profileError) {
        console.error("profiles select error:", profileError);
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setAddress(profile.address ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
      } else {
        // no row yet => create empty row so RLS works and we have something
        const { error: insertError } = await supabase.from("profiles").insert({
          id: u.id,
          full_name: "",
          phone: null,
          address: null,
        });

        if (insertError) {
          console.error("profiles insert error:", insertError);
        }
      }

      // 2) load emergency reports
      await loadReports(u.id);
    } catch (e: any) {
      console.error("loadProfileAndReports error:", e);
      Alert.alert("Error", "Something went wrong while loading data.");
      setLoadingReports(false);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadReports(userId: string) {
    try {
      setLoadingReports(true);

      const { data, error } = await supabase
        .from("emergency_reports")
        .select(
          "id, report_type, department, description, status, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("loadReports error:", error);
        setLoadingReports(false);
        return;
      }

      setReports(data ?? []);
    } catch (e: any) {
      console.error("loadReports unexpected error:", e);
    } finally {
      setLoadingReports(false);
    }
  }

 async function pickAvatar() {
  if (!userId) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

  if (result.canceled) return;

  const asset = result.assets[0];
  if (!asset.base64) {
    Alert.alert("Error", "Failed to read image data.");
    return;
  }

  const ext = asset.uri.split(".").pop() || "jpg";
  const filePath = `${userId}.${ext}`;

  // Convert base64 → ArrayBuffer
  const byteString = atob(asset.base64);
  const arrayBuffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    arrayBuffer[i] = byteString.charCodeAt(i);
  }

  const base64 = result.assets[0].base64;

  if (!base64) {
    throw new Error("No base64 data");
  }

  const uint8Array = Uint8Array.from(
    atob(base64),
    (c) => c.charCodeAt(0)
  );

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, uint8Array, {
      contentType: `image/${ext}`,
      upsert: true,
    });


  if (error) {
    console.error("Upload error:", error);
    Alert.alert("Error", "Failed to upload avatar.");
    return;
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  setAvatarUrl(data.publicUrl);
}

const debugStorage = async () => {
  const { data: user } = await supabase.auth.getUser();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  console.log("USER:", user.user);
  console.log("BUCKETS:", buckets, error);
};
debugStorage();
  

  async function saveProfile() {
    if (!userId) return;

    try {
      setSaving(true);

      // 1) update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          updated_at: new Date().toISOString(),
          avatar_url: avatarUrl,

        });

      if (profileError) {
        console.error("profiles upsert error:", profileError);
        Alert.alert("Error", "Failed to save profile (database).");
        setSaving(false);
        return;
      }

      // 2) update auth.user_metadata (for Display name / Phone in dashboard)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        },
      });

      if (authError) {
        console.error("updateUser error:", authError);
        Alert.alert(
          "Warning",
          "Profile saved, but failed to update authentication metadata."
        );
        setSaving(false);
        return;
      }

      Alert.alert("Saved", "Profile updated successfully.");
      setEditing(false);
    } catch (e: any) {
      console.error("Unexpected error:", e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function confirmClearProfile() {
    Alert.alert(
      "Delete profile data?",
      "This will clear your saved name, address, and phone number from this app. Your account and email login will remain active.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: clearProfileData,
        },
      ]
    );
  }

  async function clearProfileData() {
    if (!userId) return;

    try {
      setSaving(true);

      // clear profiles row
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: null,
          phone: null,
          address: null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("clearProfileData profiles error:", profileError);
        Alert.alert("Error", "Failed to delete profile data.");
        setSaving(false);
        return;
      }

      // clear auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: null,
          phone: null,
          address: null,
        },
      });

      if (authError) {
        console.error("clearProfileData auth error:", authError);
      }

      setFullName("");
      setPhone("");
      setAddress("");

      Alert.alert("Deleted", "Profile data cleared.");
    } catch (e: any) {
      console.error("clearProfileData unexpected error:", e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/Auth/sign-in");
  }

  function prettyDate(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  }

  function prettyStatus(status: string) {
    if (!status) return "";
    return status.replace(/_/g, " ");
  }

  return (
    <DsgLayout
      activeTab="profile"
      subtitle="Manage your SafeDumaGuide account and report history."
      contentStyle={styles.content}
    >
      <Text style={styles.title}>Account Profile</Text>

      {loadingProfile ? (
        <Text style={styles.loading}>Loading profile...</Text>
      ) : (
        <>
          {/* PROFILE CARD (view mode) */}
          <View style={styles.profileCard}>
              <TouchableOpacity onPress={pickAvatar}>
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={{ width: 74, height: 74, borderRadius: 37 }}
                    />
                  ) : (
                    <Text style={styles.avatarEmoji}>👤</Text>
                  )}
                </View>
              </TouchableOpacity>
            <Text style={styles.profileName}>{fullName || "Your name"}</Text>
            <Text style={styles.profileEmail}>
              {email || "No email available"}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>
                {address || "No address saved yet."}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>
                {phone || "No phone number saved yet."}
              </Text>
            </View>

            <View style={styles.profileButtonsRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmClearProfile}
                disabled={saving}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* EDIT CARD */}
          {editing && (
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Edit Profile</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street, Barangay, Dumaguete"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(text) => {
                    // Only allow numbers and +
                    const sanitized = text.replace(/[^0-9+]/g, "");
                    setPhone(sanitized);
                  }}
                  placeholder="09XXXXXXXXX"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editButtonsRow}>
                <TouchableOpacity
                  style={styles.updateBtn}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  <Text style={styles.updateBtnText}>
                    {saving ? "Updating..." : "Update"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* REPORTS HISTORY */}
          <View style={styles.reportsSection}>
            <Text style={styles.reportsTitle}>Reports History</Text>

            {loadingReports ? (
              <Text style={styles.reportsInfo}>Loading reports...</Text>
            ) : reports.length === 0 ? (
              <Text style={styles.reportsInfo}>
                You have not submitted any reports yet.
              </Text>
            ) : (
              reports.map((r) => (
                <View key={r.id} style={styles.reportCard}>
                  <Text style={styles.reportField}>
                    <Text style={styles.reportLabel}>Type: </Text>
                    <Text style={styles.reportValue}>
                      {r.report_type || "N/A"}
                    </Text>
                  </Text>

                  <Text style={styles.reportField}>
                    <Text style={styles.reportLabel}>Description: </Text>
                    <Text style={styles.reportValue}>
                      {r.description || "No description"}
                    </Text>
                  </Text>

                  <Text style={styles.reportField}>
                    <Text style={styles.reportLabel}>Submitted to: </Text>
                    <Text style={styles.reportValue}>
                      {r.department || "N/A"}
                    </Text>
                  </Text>

                  <Text style={styles.reportField}>
                    <Text style={styles.reportLabel}>Status: </Text>
                    <Text
                      style={[
                        styles.reportValue,
                        r.status === "resolved"
                          ? styles.reportStatusResolved
                          : r.status === "in_progress"
                          ? styles.reportStatusInProgress
                          : styles.reportStatusPending,
                      ]}
                    >
                      {prettyStatus(r.status || "pending")}
                    </Text>
                  </Text>

                  <Text style={styles.reportField}>
                    <Text style={styles.reportLabel}>Date: </Text>
                    <Text style={styles.reportValue}>
                      {prettyDate(r.created_at)}
                    </Text>
                  </Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </>
      )}
    </DsgLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
  },

  loading: { textAlign: "center", color: TEXT_GRAY },

  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    marginBottom: 18,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "#f7f7f7",
  },
  avatarEmoji: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: TEXT_GRAY,
    marginBottom: 12,
  },
  infoRow: {
    width: "100%",
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: TEXT_GRAY,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 12,
    color: "#222222",
  },
  profileButtonsRow: {
    flexDirection: "row",
    marginTop: 16,
    width: "100%",
    justifyContent: "space-between",
  },
  editBtn: {
    flex: 1,
    marginRight: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#1db954",
    alignItems: "center",
  },
  editBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    marginLeft: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#ff5252",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  editCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    padding: 18,
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
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
    backgroundColor: "#fff",
  },
  editButtonsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  updateBtn: {
    flex: 1,
    marginRight: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#1db954",
    alignItems: "center",
  },
  updateBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    marginLeft: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: LIGHT_GRAY,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#333333",
    fontWeight: "700",
    fontSize: 14,
  },

  reportsSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  reportsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  reportsInfo: {
    fontSize: 12,
    color: TEXT_GRAY,
  },
  reportCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  reportField: {
    fontSize: 12,
    marginBottom: 2,
  },
  reportLabel: {
    fontWeight: "700",
    color: "#222222",
  },
  reportValue: {
    color: "#333333",
  },
  reportStatusResolved: {
    color: "#1db954",
    fontWeight: "700",
  },
  reportStatusInProgress: {
    color: "#f39c12",
    fontWeight: "700",
  },
  reportStatusPending: {
    color: "#e74c3c",
    fontWeight: "700",
  },

  logoutBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  logoutText: { color: RED, fontWeight: "700" },
});
