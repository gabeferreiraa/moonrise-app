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
  "Donuts 🍩",
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

export default function IntentionScreen() {
  const [selectedIntention, setSelectedIntention] = useState(INTENTIONS[0]);
  const [customIntention, setCustomIntention] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cycleIndexRef = useRef(0);
  const screenFadeAnim = useRef(new Animated.Value(0)).current;
  const blackFadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const intentionAudioRef = useRef<Audio.Sound | null>(null);
  const isUnmountingRef = useRef(false);

  const INTENTION_AUDIO_URL =
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/intentionwheel.m4a?alt=media&token=5b5d4239-8ca0-4be9-a07e-db8f1b1e6220";

  // Fade in from black when screen loads
  useEffect(() => {
    Animated.timing(screenFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    let mounted = true;
    let sound: Audio.Sound | null = null;

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        // Create and load the sound with shouldPlay: true to start immediately
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: INTENTION_AUDIO_URL },
          {
            shouldPlay: true, // Changed from false to true - starts playing as soon as possible
            isLooping: true,
            volume: 0.5,
          }
        );

        if (!mounted) {
          // Component unmounted while loading
          await newSound.unloadAsync();
          return;
        }

        sound = newSound;
        intentionAudioRef.current = newSound;

        // No need to check status and play manually anymore since shouldPlay: true
        // The audio will start as soon as enough data is buffered
      } catch (error) {
        console.error("Failed to load intention audio:", error);
      }
    };

    setupAudio();

    // Cleanup when component unmounts
    return () => {
      mounted = false;
      isUnmountingRef.current = true;

      // Clean up the audio
      if (sound) {
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
      } else if (intentionAudioRef.current) {
        intentionAudioRef.current.stopAsync().catch(() => {});
        intentionAudioRef.current.unloadAsync().catch(() => {});
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

  const getAudioMode = (intention: string): Version => {
    // Only "Extended Experience" and "Custom..." play guided
    if (intention === "Extended Experience" || showCustomInput) {
      return "guided";
    }

    // Everything else cycles through birth, life, death
    const modes: Version[] = ["birth", "life", "death"];
    const mode = modes[cycleIndexRef.current % 3];
    cycleIndexRef.current += 1;

    return mode;
  };

  const handleConfirm = async () => {
    const finalIntention =
      showCustomInput && customIntention.trim()
        ? customIntention.trim()
        : selectedIntention;

    const audioMode = getAudioMode(selectedIntention);

    setIsTransitioning(true);
    isUnmountingRef.current = true; // Prevent any further audio operations

    // Start a very gradual audio fade (3 seconds)
    if (intentionAudioRef.current) {
      const fadeOutDuration = 3000;
      const fadeSteps = 30;
      const stepDuration = fadeOutDuration / fadeSteps;
      const startVolume = 0.2;

      // Don't await this - let it run in background
      (async () => {
        try {
          const sound = intentionAudioRef.current;
          if (!sound) return;

          // Check if sound is still loaded before each operation
          for (let i = fadeSteps; i >= 0; i--) {
            if (isUnmountingRef.current) {
              const status = await sound.getStatusAsync();
              if (!status.isLoaded) break;

              const volume = (startVolume * i) / fadeSteps;
              await sound.setVolumeAsync(volume);
              await new Promise((resolve) => setTimeout(resolve, stepDuration));
            }
          }

          // Final cleanup if still loaded
          if (isUnmountingRef.current) {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              await sound.stopAsync();
              await sound.unloadAsync();
            }
          }
        } catch (error) {
          // Silently catch errors - component might be unmounted
          console.log("Audio fade cleanup handled gracefully");
        }
      })();
    }

    // Use a gentle fade to black instead of white flash
    Animated.sequence([
      // Fade content out
      Animated.timing(screenFadeAnim, {
        toValue: 0,
        duration: 2000, // Increased from 1200ms to 2000ms (2 seconds)
        useNativeDriver: true,
      }),
      // Small pause in black
      Animated.delay(400), // Increased from 400ms to 600ms
    ]).start(() => {
      // Navigate after visual transition completes
      router.replace({
        pathname: "/home",
        params: {
          intention: finalIntention,
          audioMode: audioMode,
          startWithGuided: "true",
          fadeInAudio: "true",
        },
      });
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: screenFadeAnim,
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Set Your Intention</Text>
          <Text style={styles.subtitle}>
            What would you like to invite into this moment?
          </Text>

          {/* Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedIntention}
              onValueChange={handleIntentionChange}
              style={styles.picker}
              itemStyle={styles.pickerItem}
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

          {/* Custom Input */}
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

          {/* Buttons */}
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
    fontFamily: "Lora_400Regular",
    fontWeight: "600",
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
    fontFamily: "System",
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
    backgroundColor: "#A0B5A8",
    borderColor: "#A0B5A8",
  },
  confirmButtonText: {
    fontSize: 17,
    color: "#0C0C0C",
    fontFamily: "System",
    fontWeight: "600",
  },
});
