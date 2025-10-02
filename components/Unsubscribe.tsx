import { MotiView } from "moti";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { newsletterService } from "../lib/supabase";

export function Unsubscribe() {
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnsubscribe = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const result = await newsletterService.unsubscribe(email);

      if (result.success) {
        Alert.alert("Success", result.message, [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              setEmail("");
            },
          },
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 700, delay: 1000 }}
        style={styles.container}
      >
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Unsubscribe</Text>
        </Pressable>
      </MotiView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Unsubscribe</Text>
            <Text style={styles.modalDescription}>
              Enter your email to unsubscribe from updates
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setEmail("");
                }}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalButton,
                  styles.unsubButton,
                  loading && styles.unsubButtonDisabled,
                ]}
                onPress={handleUnsubscribe}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0C0C0C" size="small" />
                ) : (
                  <Text style={styles.unsubButtonText}>Unsubscribe</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonText: {
    color: "#999",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F7EBD6",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#0C0C0C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#F7EBD6",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "500",
  },
  unsubButton: {
    backgroundColor: "#D4C7B0",
  },
  unsubButtonDisabled: {
    opacity: 0.5,
  },
  unsubButtonText: {
    color: "#0C0C0C",
    fontSize: 16,
    fontWeight: "600",
  },
});
