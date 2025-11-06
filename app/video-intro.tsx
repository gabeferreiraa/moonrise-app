import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoIntroScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [hasNavigated, setHasNavigated] = useState(false);
  const [videoStatus, setVideoStatus] = useState("loading");

  const handleVideoEnd = () => {
    if (hasNavigated) return;
    setHasNavigated(true);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/intention");
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
                // Log video progress
                if (status.positionMillis && status.durationMillis) {
                  const progress = Math.floor(
                    (status.positionMillis / status.durationMillis) * 100
                  );
                  if (progress % 20 === 0) {
                    console.log(`Video playing: ${progress}%`);
                  }
                }

                if (status.didJustFinish) {
                  console.log("Video playback finished");
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
