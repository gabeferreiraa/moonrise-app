import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export function SubscribeModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setMsg(null);

    // Fake a delay to mimic a request
    setTimeout(() => {
      setSubmitting(false);
      setMsg("You're in. We’ll keep you posted ✨");
      setTimeout(() => {
        setName("");
        setEmail("");
        onClose();
        setMsg(null);
      }, 900);
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={m.overlay}>
        <View style={m.card}>
          <Text style={m.title}>Get event updates</Text>
          <TextInput
            style={m.input}
            placeholder="Name (optional)"
            placeholderTextColor="#9A8E7A"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={m.input}
            placeholder="Email"
            placeholderTextColor="#9A8E7A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!msg && <Text style={m.msg}>{msg}</Text>}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Pressable onPress={onClose} style={[m.btn, m.btnGhost]}>
              <Text style={m.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSubmit} style={m.btn} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator />
              ) : (
                <Text style={m.btnText}>Subscribe</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  title: {
    color: "#F4F2ED",
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    color: "#EDE7DB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  msg: { color: "#DEC4A1", marginTop: 8 },
  btn: {
    backgroundColor: "#E6D2B5",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: { color: "#141414", fontWeight: "600" },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  btnGhostText: { color: "#DEC4A1" },
});
