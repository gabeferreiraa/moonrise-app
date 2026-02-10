import { BlurView } from "expo-blur";
import React from "react";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface CompletionModalProps {
  visible: boolean;
  onBack: () => void;
  onChooseNew: () => void;
}

export function CompletionModal({
  visible,
  onBack,
  onChooseNew,
}: CompletionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onBack}
    >
      <BlurView intensity={40} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.message}>
            We dedicate the merits of our time together to our brave hearts,
            daring souls, curious minds, and to the strength of love, for the
            greatest good of all beings.
          </Text>
          <Text style={styles.namaste}>Namaste</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={onBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={onChooseNew}
            >
              <Text style={styles.continueButtonText}>Choose New Intention</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.85)",
  },
  content: {
    backgroundColor: "#1A1715",
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 24,
    maxWidth: 400,
    width: Dimensions.get("window").width - 48,
    borderWidth: 1,
    borderColor: "#2A2522",
  },
  message: {
    fontSize: 17,
    lineHeight: 26,
    color: "#DEC4A1",
    textAlign: "center",
    fontFamily: "Lora_400Regular",
    marginBottom: 32,
  },
  namaste: {
    fontSize: 19,
    color: "#E6D2B5",
    textAlign: "center",
    fontFamily: "Lora_400Regular",
    fontStyle: "italic",
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  backButton: {
    backgroundColor: "transparent",
    borderColor: "#DEC4A1",
  },
  backButtonText: {
    fontSize: 16,
    color: "#DEC4A1",
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: "#E6D2B5",
    borderColor: "#E6D2B5",
  },
  continueButtonText: {
    fontSize: 16,
    color: "#0C0C0C",
    fontWeight: "600",
  },
});