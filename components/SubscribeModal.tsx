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
import { newsletterService } from "../lib/supabase";

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
  const [msg, setMsg] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  const onSubmit = async () => {
    setMsg(null);

    if (!email.trim()) {
      setMsg({ text: "Please enter your email address", isError: true });
      return;
    }

    setSubmitting(true);

    try {
      const result = await newsletterService.subscribe(
        email.trim(),
        name.trim() || undefined
      );

      if (result.success) {
        setMsg({ text: result.message, isError: false });

        // Clear form and close modal after showing success message
        setTimeout(() => {
          setName("");
          setEmail("");
          setMsg(null);
          onClose();
        }, 3000);
      } else {
        setMsg({ text: result.message, isError: true });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setMsg({
        text: "Something went wrong. Please try again.",
        isError: true,
      });
    } finally {
      setSubmitting(false);
    }
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
          <Text style={m.subtitle}>DEVA MUNAY&#39;s MOONRISE</Text>
          <Text style={m.title}>Subscribe to Newsletter</Text>
          <TextInput
            style={m.input}
            placeholder="Name (optional)"
            placeholderTextColor="#9A8E7A"
            value={name}
            onChangeText={setName}
            editable={!submitting}
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
            editable={!submitting}
            onSubmitEditing={onSubmit}
            returnKeyType="done"
            blurOnSubmit={true}
          />
          {msg && (
            <Text style={[m.msg, msg.isError && m.msgError]}>{msg.text}</Text>
          )}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={onClose}
              style={[m.btn, m.btnGhost]}
              disabled={submitting}
            >
              <Text style={m.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              style={[m.btn, submitting && m.btnDisabled]}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#141414" />
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
  subtitle: {
    color: "#CBBCA4",
    fontSize: 11,
    fontFamily: "System",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: "#F7EBD6",
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
  msg: {
    color: "#DEC4A1",
    marginTop: 8,
  },
  msgError: {
    color: "#E88B7E",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btn: {
    backgroundColor: "#F7EBD6",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: {
    color: "#141414",
    fontWeight: "600",
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  btnGhostText: {
    color: "#DEC4A1",
  },
});
