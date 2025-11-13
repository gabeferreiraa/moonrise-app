import { Audio, ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INTENTION_AUDIO_URL =
  "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/intention_wheel.m4a?alt=media&token=fc0b4e9c-61c2-45d4-b4fd-085e0f0deea1";

export default function VideoIntroScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [hasNavigated, setHasNavigated] = useState(false);
  const [videoStatus, setVideoStatus] = useState("loading");
  const intentionAudioRef = useRef<Audio.Sound | null>(null);
  const hasStartedAudioRef = useRef(false);

  const startIntentionAudio = async () => {
    if (hasStartedAudioRef.current) return;
    hasStartedAudioRef.current = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: INTENTION_AUDIO_URL },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.2,
        }
      );

      intentionAudioRef.current = sound;
      console.log("Intention audio started from video screen");
    } catch (error) {
      console.error("Failed to start intention audio:", error);
    }
  };

  const handleVideoEnd = () => {
    if (hasNavigated) return;
    setHasNavigated(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace({
        pathname: "/intention",
        params: {
          audioPreloaded: "true",
        },
      });
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <Animated.View
          style={[
            styles.videoContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Video
            ref={videoRef}
            source={require("@/assets/videos/MOONRISE-open-animation-risen-main.mp4")}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false}
            volume={1.0}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                // Start intention audio 1 second before video ends
                const timeRemaining =
                  (status.durationMillis || 0) - status.positionMillis;
                if (timeRemaining <= 1000 && timeRemaining > 0) {
                  startIntentionAudio();
                }

                if (status.didJustFinish) {
                  handleVideoEnd();
                }
              } else if ("error" in status) {
                console.error("Video error:", status.error);
                setVideoStatus("error");
              }
            }}
            onLoad={() => {
              console.log("Video loaded successfully");
              setVideoStatus("playing");
            }}
            onError={(error) => {
              console.error("Video load error:", error);
              setVideoStatus("error");
            }}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
  },
  safeArea: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0C0C0C",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  debugOverlay: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
