import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

const HAS_SEEN_VIDEO_KEY = "@has_seen_video";

export default function Index() {
  const [hasSeenVideo, setHasSeenVideo] = useState<boolean | null>(null);

  useEffect(() => {
    checkVideoStatus();
  }, []);

  const checkVideoStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem(HAS_SEEN_VIDEO_KEY);
      setHasSeenVideo(seen === "true");
    } catch (error) {
      console.error("Error checking video status:", error);
      setHasSeenVideo(false);
    }
  };

  if (hasSeenVideo === null) {
    return null;
  }

  return <Redirect href="/video-intro" />;
}
