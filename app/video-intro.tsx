// app/video-intro.tsx (or wherever your intro screen is)
import { intentionAudio } from "@/audio/intentionAudio";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoIntroScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Use refs to prevent any state-based re-renders from interfering
  const hasStartedAudio = useRef(false);
  const hasNavigated = useRef(false);

  // Pre-load intention audio early
  useEffect(() => {
    intentionAudio
      .init()
      .catch((err) => console.warn("Audio init failed:", err));
  }, []);

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
      <Animated.View style={[styles.videoWrapper, { opacity: fadeAnim }]}>
        <Video
          ref={videoRef}
          source={require("../assets/videos/MOONRISE-open-animation-risen-main.mp4")}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          shouldPlay={true}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          // Ensure video actually plays (some devices need this)
          onLoad={() => videoRef.current?.playAsync().catch(() => {})}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
});
