// app/intention.tsx
import { intentionAudio } from "@/audio/intentionAudio";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// All intentions as a readonly tuple → perfect literal types
export const INTENTIONS = [
  "Extended Experience",
  "Clarity",
  "Healing and restoration",
  "Release",
  "Connection",
  "Gratitude",
  "Peace",
  "Love",
  "Strength",
  "Creativity",
  "Vision",
  "Balance",
  "Renewal",
  "Confidence",
  "Donuts",
  "Nada Yoga",
  "Joy!",
  "Generosity",
  "Surrender and trust",
  "Happiness",
  "Curiosity",
  "Fierce compassion",
  "Focus",
  "Patience",
  "Custom...",
] as const;

type Intention = (typeof INTENTIONS)[number];

type Version = "full" | "guided" | "birth" | "life" | "death";

// These are the only ones that always force guided mode
const ALWAYS_GUIDED_INTENTIONS = ["Extended Experience", "Custom..."] as const;
type AlwaysGuidedIntention = (typeof ALWAYS_GUIDED_INTENTIONS)[number];

// Helper: is this intention one that forces guided mode?
const isAlwaysGuided = (
  intention: Intention
): intention is AlwaysGuidedIntention =>
  ALWAYS_GUIDED_INTENTIONS.includes(intention as AlwaysGuidedIntention);

// All non-special intentions (for cycling birth/life/death)
const NON_SPECIAL_INTENTIONS = INTENTIONS.filter(
  (i) => !ALWAYS_GUIDED_INTENTIONS.includes(i as any)
) as readonly Exclude<Intention, AlwaysGuidedIntention>[];

const MODE_SEQUENCE: readonly Version[] = ["birth", "life", "death"] as const;

const getAudioModeForIntention = (intention: Intention): Version => {
  if (isAlwaysGuided(intention)) return "guided";

  const index = NON_SPECIAL_INTENTIONS.indexOf(intention as any);
  return MODE_SEQUENCE[index % MODE_SEQUENCE.length];
};

export default function IntentionScreen() {
  const [selectedIntention, setSelectedIntention] = useState<Intention>(
    INTENTIONS[0]
  );
  const [customIntention, setCustomIntention] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
  // Start and fade in the intention wheel audio
  const startAudio = async () => {
    if (!intentionAudio.isLoaded) {
      await intentionAudio.init();
    }
    intentionAudio.fadeIn(2000, 0.5);
  };
  
  startAudio();

  Animated.timing(screenFadeAnim, {
    toValue: 1,
    duration: 800,
    useNativeDriver: true,
  }).start();
}, []);

  const handleIntentionChange = (value: Intention) => {
    setSelectedIntention(value);
    setShowCustomInput(value === "Custom...");
    if (value !== "Custom...") setCustomIntention("");
  };

  const handleConfirm = async () => {
    if (isTransitioning) return;

    const finalIntention =
      showCustomInput && customIntention.trim()
        ? customIntention.trim()
        : selectedIntention;

    const audioMode: Version = showCustomInput
      ? "guided"
      : getAudioModeForIntention(selectedIntention);

    setIsTransitioning(true);

    // Fade out the looping wheel
    await intentionAudio.fadeOut(1250);

    // Fade out screen and navigate
    Animated.timing(screenFadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace({
        pathname: "/home",
        params: {
          intention: finalIntention,
          audioMode,
          startWithGuided: "true",
          fadeInAudio: "true",
        },
      });
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Animated.View
        style={[styles.contentWrapper, { opacity: screenFadeAnim }]}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Set Your Intention</Text>
          <Text style={styles.subtitle}>
            What would you like to invite into this moment?
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedIntention}
              onValueChange={handleIntentionChange}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#FFECCC"
            >
              {INTENTIONS.map((intention) => (
                <Picker.Item
                  key={intention}
                  label={intention}
                  value={intention}
                  color="#FFECCC"
                />
              ))}
            </Picker>
          </View>

          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter your intention..."
                placeholderTextColor="#CBBCA4"
                value={customIntention}
                onChangeText={setCustomIntention}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={isTransitioning}
            >
              <Text style={styles.confirmButtonText}>Begin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ← Styles exactly the same as before (unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 500,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: "Lora_400Regular",
    color: "#FFECCC",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "Lora_400Regular",
    color: "#DEC4A1",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 24,
  },
  pickerContainer: {
    width: "100%",
    height: 240,
    backgroundColor: "#121212",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A1715",
    overflow: "hidden",
    marginBottom: 24,
  },
  picker: {
    width: "100%",
    height: 240,
    backgroundColor: "transparent",
  },
  pickerItem: {
    fontSize: 19,
    color: "#FFECCC",
    height: 240,
    fontFamily: "System",
  },
  customInputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  customInput: {
    backgroundColor: "#121212",
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    color: "#FFECCC",
    borderWidth: 1,
    borderColor: "#A0B5A8",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: "#E6D2B5",
    borderColor: "#E6D2B5",
  },
  confirmButtonText: {
    fontSize: 17,
    color: "#0C0C0C",
    fontWeight: "600",
  },
});
