import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";

const INTENTIONS = ["Peace", "Clarity", "Gratitude"] as const;
export type Intention = (typeof INTENTIONS)[number];

interface IntentionModalProps {
  visible: boolean;
  onSelect: (intention: Intention) => void;
}

export function IntentionModal({ visible, onSelect }: IntentionModalProps) {
  const [selected, setSelected] = useState<Intention | null>(null);

  const handleSelect = (intention: Intention) => {
    setSelected(intention);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={StyleSheet.absoluteFill}>
        <View style={styles.container}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 400 }}
            style={styles.content}
          >
            <Text style={styles.title}>Set Your Intention</Text>
            <Text style={styles.subtitle}>
              Choose an intention for your practice
            </Text>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.intentionsContainer}
              showsVerticalScrollIndicator={false}
            >
              {INTENTIONS.map((intention) => (
                <Pressable
                  key={intention}
                  onPress={() => handleSelect(intention)}
                  style={({ pressed }) => [
                    styles.intentionCard,
                    selected === intention && styles.intentionCardSelected,
                    pressed && styles.intentionCardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      selected === intention && styles.radioOuterSelected,
                    ]}
                  >
                    {selected === intention && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.intentionText,
                      selected === intention && styles.intentionTextSelected,
                    ]}
                  >
                    {intention}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleConfirm}
              disabled={!selected}
              style={({ pressed }) => [
                styles.confirmButton,
                !selected && styles.confirmButtonDisabled,
                pressed && selected && styles.confirmButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  !selected && styles.confirmButtonTextDisabled,
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </MotiView>
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
    backgroundColor: "rgba(12, 12, 12, 0.8)",
    padding: 24,
  },
  content: {
    backgroundColor: "#1A1A1C",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    maxHeight: Dimensions.get("window").height * 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#F7EBD6",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#D4C7B0",
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
  },
  scrollView: {
    maxHeight: 300,
  },
  intentionsContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  intentionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252527",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  intentionCardSelected: {
    backgroundColor: "#2A2A2C",
    borderColor: "#FFECCC",
  },
  intentionCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D4C7B0",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#FFECCC",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFECCC",
  },
  intentionText: {
    fontSize: 20,
    color: "#D4C7B0",
    fontWeight: "500",
  },
  intentionTextSelected: {
    color: "#FFECCC",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#FFECCC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: "#3A3A3C",
  },
  confirmButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0C0C0C",
  },
  confirmButtonTextDisabled: {
    color: "#666668",
  },
});
