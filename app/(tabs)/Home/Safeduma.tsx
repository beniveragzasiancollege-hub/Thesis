import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { DsgLayout } from "@/components/DsgLayout";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/* --- Types --- */

type EmergencyContact = {
  id: number;
  name: string;
  category: string;
  phone_number: string;
  description: string | null;
  is_live: boolean;
  sort_order: number;
  is_active: boolean;
};

type SafetyTip = {
  id: number;
  tip: string;
  sort_order: number;
};

export default function SafeDuma() {
  const scheme = useColorScheme();
  const C = Colors[scheme];

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [tips, setTips] = useState<SafetyTip[]>([]);
  const [selectedContact, setSelectedContact] =
    useState<EmergencyContact | null>(null);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  // ⚠️ warning modal
  const [showWarning, setShowWarning] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<null | (() => void)>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: contactsData } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    setContacts(contactsData ?? []);

    const { data: tipsData } = await supabase
      .from("safety_tips")
      .select("*")
      .order("sort_order", { ascending: true });

    setTips(tipsData ?? []);
  }

  function handleSendReport() {
    if (!selectedContact || !description.trim()) {
      Alert.alert(
        "Missing information",
        "Please select a department and enter a description."
      );
      return;
    }

    setPendingAction(() => sendSms);
    setShowWarning(true);
  }

  function sendSms() {
    if (!selectedContact) return;

    setSending(true);
    Linking.openURL(
      `sms:${selectedContact.phone_number}?body=${encodeURIComponent(
        description
      )}`
    );
    setSending(false);
  }

  return (
    <DsgLayout
      activeTab="safeDuma"
      subtitle="Send reports via SMS using your SIM card"
      contentStyle={styles.scroll}
    >
      {/* Emergency Quick Dial */}
      <Text style={styles.sectionTitle}>Emergency Quick Dial</Text>

      <View style={styles.dialGrid}>
        {contacts.map((c, index) => (
          <QuickDialCard
            key={c.id}
            title={c.name}
            number={c.phone_number}
            color={quickDialColor(index, C)}
            isLive={c.is_live}
            onPress={() => {
              setPendingAction(() => () =>
                Linking.openURL(`tel:${c.phone_number}`)
              );
              setShowWarning(true);
            }}
          />
        ))}
      </View>

      {/* Safety Tips */}
      <Text style={styles.sectionTitle}>Dumaguete Safety Tips</Text>
      <View style={styles.tipsList}>
        {tips.map((t) => (
          <Bullet key={t.id} text={t.tip} />
        ))}
      </View>

      {/* Emergency Report */}
      <View style={[styles.reportCard, { borderColor: C.border }]}>
        <Text style={styles.reportTitle}>Submit an Emergency Report</Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: C.textGray }]}>
            Submit Report To
          </Text>

          <TouchableOpacity
            style={[
              styles.selector,
              {
                borderColor: selectedContact ? C.primary : C.border,
                backgroundColor: selectedContact
                  ? C.primarySoft
                  : C.background,
              },
            ]}
            onPress={() => setShowDepartmentModal(true)}
          >
            <View style={styles.selectorInner}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.selectorValue,
                    !selectedContact && styles.selectorPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedContact
                    ? `${selectedContact.name} (${selectedContact.phone_number})`
                    : "Tap to choose where to send the report"}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: C.textGray }]}>▾</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: C.textGray }]}>
            Description & Location
          </Text>
          <TextInput
            multiline
            style={[
              styles.textArea,
              { borderColor: C.border, color: C.text },
            ]}
            placeholder="Describe the incident and location."
            placeholderTextColor={C.textGray}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: C.primaryDark }]}
          onPress={handleSendReport}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>
            {sending ? "Sending..." : "Send via SMS"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Department Modal */}
      <Modal
        visible={showDepartmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepartmentModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowDepartmentModal(false)}
        />

        <View style={[styles.modalSheet, { backgroundColor: C.background }]}>
          <Text style={styles.modalTitle}>Select Department</Text>

          <ScrollView>
            {contacts.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.modalItem, { borderColor: C.border }]}
                onPress={() => {
                  setSelectedContact(c);
                  setShowDepartmentModal(false);
                }}
              >
                <Text style={styles.modalItemTitle}>{c.name}</Text>
                <Text style={[styles.modalItemSub, { color: C.textGray }]}>
                  {c.phone_number}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => setShowDepartmentModal(false)}
          >
            <Text style={[styles.modalCancelText, { color: C.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ⚠️ LEGAL WARNING MODAL */}
      <Modal visible={showWarning} transparent animationType="fade">
        <View style={styles.warningBackdrop}>
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Legal Warning</Text>

            <Text style={styles.warningText}>
              This feature is for REAL emergencies only.
            </Text>

            <Text style={styles.warningText}>
              Under the Cybercrime Prevention Act of 2012 (Republic Act No. 10175),
              false reports, prank calls, or misuse of emergency services are
              punishable by law.
            </Text>

            <Text style={styles.warningText}>
              Proceed only if this is a legitimate emergency.
            </Text>

            <View style={styles.warningActions}>
              <TouchableOpacity
                style={styles.warningCancel}
                onPress={() => {
                  setShowWarning(false);
                  setPendingAction(null);
                }}
              >
                <Text style={styles.warningCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.warningConfirm}
                onPress={() => {
                  setShowWarning(false);
                  pendingAction?.();
                  setPendingAction(null);
                }}
              >
                <Text style={styles.warningConfirmText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DsgLayout>
  );
}

/* ---- Components ---- */

function QuickDialCard({ title, number, color, isLive, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.dialCard, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.dialTitle}>
        {title}
        {isLive ? " (LIVE)" : ""}
      </Text>
      <Text style={styles.dialNumber}>{number}</Text>
    </TouchableOpacity>
  );
}

function Bullet({ text }: { text: string }) {
  const scheme = useColorScheme();
  const C = Colors[scheme];

  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: C.danger }]} />
      <Text style={[styles.bulletText, { color: C.textGray }]}>{text}</Text>
    </View>
  );
}

function quickDialColor(index: number, C: any) {
  const colors = [
    C.primary,
    "#5E9C97",
    C.primaryDark,
    "#3F6E6A",
  ];
  return colors[index % colors.length];
}

/* -------- STYLES -------- */

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 16 },

  dialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dialCard: { width: "48%", borderRadius: 10, padding: 10, marginBottom: 12 },
  dialTitle: { color: "#fff", fontWeight: "700", fontSize: 13 },
  dialNumber: { color: "#fff", fontWeight: "700", fontSize: 14 },

  tipsList: { marginBottom: 16 },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: { fontSize: 13 },

  reportCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  reportTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4 },

  selector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectorInner: { flexDirection: "row", alignItems: "center" },
  selectorValue: { fontSize: 14, fontWeight: "600" },
  selectorPlaceholder: { color: "#999", fontWeight: "400" },
  chevron: { fontSize: 18 },

  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },

  sendButton: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalItemSub: {
    fontSize: 12,
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontWeight: "700",
    fontSize: 14,
  },

  /* ⚠️ Warning styles */
  warningBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  warningBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 400,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#444",
    marginBottom: 8,
  },
  warningActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  warningCancel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  warningCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  warningConfirm: {
    backgroundColor: "#d62828",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  warningConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
