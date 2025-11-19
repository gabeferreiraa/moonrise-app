import { Picker } from "@react-native-picker/picker";
import { Audio } from "expo-av";
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
];

type Version = "full" | "guided" | "birth" | "life" | "death";

const ALWAYS_GUIDED_INTENTIONS = ["Extended Experience", "Custom..."] as const;
const NON_SPECIAL_INTENTIONS = INTENTIONS.filter(
  (item) => !ALWAYS_GUIDED_INTENTIONS.includes(item)
);
const MODE_SEQUENCE: Version[] = ["birth", "life", "death"];

const getAudioModeForIntention = (intention: string): Version => {
  if (ALWAYS_GUIDED_INTENTIONS.includes(intention as any)) {
    return "guided";
  }

  const index = NON_SPECIAL_INTENTIONS.indexOf(intention);
  if (index === -1) return "guided";

  return MODE_SEQUENCE[index % MODE_SEQUENCE.length];
};

const INTENTION_AUDIO_URL =
  "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/intentionwheel.m4a?alt=media&token=5b5d4239-8ca0-4be9-a07e-db8f1b1e6220";

export default function IntentionScreen() {
  const [selectedIntention, setSelectedIntention] = useState(INTENTIONS[0]);
  const [customIntention, setCustomIntention] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const intentionAudioRef = useRef<Audio.Sound | null>(null);
  const isUnmountingRef = useRef(false);
  const router = useRouter();

  // Fade in on mount
  useEffect(() => {
    Animated.timing(screenFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Setup looping background audio
  useEffect(() => {
    let sound: Audio.Sound | null = null;

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: INTENTION_AUDIO_URL },
          { isLooping: true, volume: 0.5, shouldPlay: true }
        );

        sound = newSound;
        intentionAudioRef.current = newSound;
      } catch (error) {
        console.error("Failed to load intention audio:", error);
      }
    };

    setupAudio();

    return () => {
      isUnmountingRef.current = true;
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleIntentionChange = (value: string) => {
    setSelectedIntention(value);
    if (value === "Custom...") {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomIntention("");
    }
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
    isUnmountingRef.current = true;

    // Fade out background audio smoothly
    if (intentionAudioRef.current) {
      Animated.timing(new Animated.Value(0.5), {
        toValue: 0,
        duration: 2500,
        useNativeDriver: false,
      }).start(async () => {
        try {
          await intentionAudioRef.current?.setVolumeAsync(0);
          await intentionAudioRef.current?.stopAsync();
          await intentionAudioRef.current?.unloadAsync();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });

      // Animate volume down using Animated value
      const volumeAnim = new Animated.Value(0.5);
      volumeAnim.addListener(({ value }) => {
        intentionAudioRef.current?.setVolumeAsync(value).catch(() => {});
      });

      Animated.timing(volumeAnim, {
        toValue: 0,
        duration: 2500,
        useNativeDriver: false,
      }).start();
    }

    // Fade out screen and navigate
    Animated.sequence([
      Animated.timing(screenFadeAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.delay(400),
    ]).start(() => {
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
