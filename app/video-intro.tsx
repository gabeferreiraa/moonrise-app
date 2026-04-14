
import { intentionAudio } from "@/audio/intentionAudio";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoIntroScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tapPromptFade = useRef(new Animated.Value(0)).current;

  // State to track if user has tapped to start
  const [hasUserTapped, setHasUserTapped] = useState(false);

  // Use refs to prevent any state-based re-renders from interfering
  const hasStartedAudio = useRef(false);
  const hasNavigated = useRef(false);

  // Pre-load intention audio early
  useEffect(() => {
    intentionAudio
      .init()
      .catch((err) => console.warn("Audio init failed:", err));
  }, []);

  // Show tap prompt after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(tapPromptFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleScreenTap = async () => {
    if (hasUserTapped) return;

    setHasUserTapped(true);

    // Fade out tap prompt
    Animated.timing(tapPromptFade, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Start video playback
    try {
      await videoRef.current?.playAsync();
      console.log("Video playback started by user interaction");
    } catch (err) {
      console.error("Failed to start video:", err);
    }
  };

  const handlePlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error("Video playback error:", status.error);
      }
      return;
    }

    const duration = status.durationMillis ?? 0;
    const position = status.positionMillis ?? 0;

    // Start intention audio 2 seconds before end
    if (
      duration > 0 &&
      position >= duration - 2000 &&
      !hasStartedAudio.current
    ) {
      hasStartedAudio.current = true;
      console.log("Starting intention wheel audio (-2s)");

      await intentionAudio.init();
      intentionAudio.fadeIn(1800, 0.5);
    }

    // Video finished → navigate
    if (status.didJustFinish && !hasNavigated.current) {
      hasNavigated.current = true;
      console.log("Video finished → navigating to /intention");

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        router.replace("/intention");
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.pressableContainer}
        onPress={handleScreenTap}
        disabled={hasUserTapped}
      >
        <Animated.View style={[styles.videoWrapper, { opacity: fadeAnim }]}>
          <Video
            ref={videoRef}
            source={require("../assets/videos/MOONRISE-open-animation-risen-main.mp4")}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            shouldPlay={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </Animated.View>

        {!hasUserTapped && (
          <Animated.View
            style={[styles.tapPrompt, { opacity: tapPromptFade }]}
            pointerEvents="none"
          >
            <Text style={styles.tapPromptText}>Tap to begin</Text>
          </Animated.View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  pressableContainer: {
    flex: 1,
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  tapPrompt: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tapPromptText: {
    color: "#FFECCC",
    fontSize: 18,
    fontFamily: "Lora_400Regular",
    letterSpacing: 1,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});