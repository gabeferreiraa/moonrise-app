import Moon from "@/components/Moon";
import useCrossfadeAudio from "@/hooks/useCrossfadeAudio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotiImage, MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { SubscribeModal } from "../components/SubscribeModal";
import {
  MoonLocationProvider,
  useMoonLocationCtx,
} from "../hooks/useMoonLocation";

import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Easing } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MenuPage from "./menu";

type Version = "guided" | "birth" | "life" | "death" | "full";

const AUDIO_URLS: Record<Version, string> = {
  guided:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Full_Guided.mp3?alt=media&token=839c5411-b3c5-4057-83df-319046ee9c23",
  life: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Life%20Stereo%20Printmaster_202050725.mp3?alt=media&token=ad2a909b-16c9-4220-b23e-f33a40b3ba81",
  birth:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Birth%20No%20Invocation_%20Stereo%20Printmaster_202050726.mp3?alt=media&token=bd88f0f9-c57d-4f93-bbb3-f103f52f5734",
  death:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Death%20Stereo%20Printmaster_202050725.mp3?alt=media&token=8d601f5e-b894-4cbd-9131-de0cefcca58b",
  full: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Full_Unguided.mp3?alt=media&token=99a9fbe1-2122-44b7-8c53-8d946e4312d6",
};

const FIRST_LAUNCH_KEY = "@moonrise_first_launch";

export default function HomeScreen() {
  return (
    <MoonLocationProvider>
      <HomeInner />
    </MoonLocationProvider>
  );
}

function HomeInner() {
  const IDLE_MS = 8000;
  const [hudVisible, setHudVisible] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPageIndicator, setShowPageIndicator] = useState(true);
  const pagerRef = useRef<PagerView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  const { hemisphere, isNewMoon, moonPhase, toggleHemisphere } =
    useMoonLocationCtx();
  const [titleLockedOff, setTitleLockedOff] = useState(false);

  const [guidedEnabled, setGuidedEnabled] = useState(true);

  const { version, setVersion, isReady } = useCrossfadeAudio(
    AUDIO_URLS,
    "guided",
    {
      fadeMs: 1000,
      loop: true,
      autoStart: false,
    }
  );

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        // Only redirect to intention screen if we don't have params from it
        if (!params.intention && !params.audioMode) {
          router.replace("/intention");
          return;
        }

        // Check if first launch for subscribe modal
        const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunchedBefore === null) {
          setIsFirstLaunch(true);
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
        }
      } catch (error) {
        console.error("Error checking first launch:", error);
      }
    };

    checkFirstLaunch();
  }, []);

  // Handle params from intention screen
  useEffect(() => {
    const handleIntentionParams = async () => {
      if (params.intention && params.audioMode) {
        console.log(
          `Received intention: ${params.intention}, Playing: ${params.audioMode}`
        );

        // Set the audio version
        setVersion(params.audioMode as Version);

        // Update guided enabled based on mode
        if (params.audioMode === "guided") {
          setGuidedEnabled(true);
        } else {
          setGuidedEnabled(false);
        }

        // Show subscribe modal on first launch
        if (isFirstLaunch) {
          setTimeout(() => {
            setSubscribeOpen(true);
          }, 800);
        }
      }
    };

    handleIntentionParams();
  }, [params]);

  useEffect(() => {
    console.log(
      `Current moon phase: ${moonPhase}, isNewMoon: ${isNewMoon}, hemisphere: ${hemisphere}`
    );
  }, [moonPhase, isNewMoon, hemisphere]);

  // Fade out page indicator after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPageIndicator(false);
    }, IDLE_MS);

    return () => clearTimeout(timer);
  }, []);

  const getSelectedModes = () => {
    if (version === "birth" || version === "life" || version === "death") {
      return [version];
    }

    if (guidedEnabled) {
      return ["full", "guided"];
    } else {
      return ["full", "unguided"];
    }
  };

  const selectedModes = getSelectedModes();

  const handleModePress = (title?: string, link?: any) => {
    if (!title) return;
    const mode = title.toLowerCase() as Version | "unguided";

    if (mode === "guided" || mode === "unguided") {
      const newGuidedEnabled = !guidedEnabled;
      setGuidedEnabled(newGuidedEnabled);

      if (newGuidedEnabled) {
        setVersion("guided");
      } else {
        setVersion("full");
      }
    } else if (mode === "full") {
      if (version === "birth" || version === "life" || version === "death") {
        setGuidedEnabled(true);
        setVersion("guided");
      }
    } else {
      setGuidedEnabled(false);
      setVersion(mode as Version);
    }

    kickIdle();
  };

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickIdle = () => {
    setHudVisible(true);
    setShowPageIndicator(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setHudVisible(false);
      setTitleLockedOff(true);
      setShowPageIndicator(false);
    }, IDLE_MS);
  };

  const [fontsLoaded] = useFonts({ CormorantGaramond_700Bold });

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    kickIdle();
  }, []);

  const handleAnyTouch = () => {
    kickIdle();
  };

  const MOON_SIZE = 260;
  const DESIRED_FROM_TOP = 220;
  const maxTop = Math.max(
    0,
    Dimensions.get("window").height - MOON_SIZE - insets.bottom - 16
  );
  const moonOffset = Math.min(
    maxTop,
    Math.max(0, DESIRED_FROM_TOP - insets.top)
  );

  const showTitle = !titleLockedOff && hudVisible;

  return (
    <SafeAreaView
      style={styles.container}
      edges={["left", "right", "top"]}
      onTouchStart={handleAnyTouch}
    >
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => {
          setCurrentPage(e.nativeEvent.position);
          kickIdle();
        }}
      >
        {/* Page 1: Moon Screen */}
        <View style={styles.page} key="1">
          {isNewMoon && (
            <MotiImage
              source={require("@/assets/images/moonrise_backdrop_block.png")}
              style={styles.starsBackground}
              resizeMode="cover"
              from={{ opacity: 0.65 }}
              animate={{
                opacity: [1, 0.7, 1, 0.5, 1],
              }}
              transition={{
                type: "timing",
                duration: 1500,
                loop: true,
                easing: Easing.inOut(Easing.quad),
              }}
            />
          )}

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: showTitle ? 1 : 0 }}
            transition={{ type: "timing", duration: 700 }}
            style={styles.centerFill}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.title,
                fontsLoaded && { fontFamily: "CormorantGaramond_700Bold" },
              ]}
            >
              MOONRISE
            </Text>
            <Text style={styles.subtitle}>Deva Munay</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 1200, delay: 300 }}
            onTouchStart={handleAnyTouch}
            style={{
              position: "absolute",
              top: moonOffset,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Moon
              size={260}
              startScale={1}
              endScale={0.35}
              endYOffset={-80}
              hemisphere={hemisphere}
            />
          </MotiView>
        </View>

        {/* Page 2: Menu Screen */}
        <View style={styles.page} key="2">
          <MenuPage
            version={version}
            guidedEnabled={guidedEnabled}
            selectedModes={selectedModes}
            hemisphere={hemisphere}
            onModePress={handleModePress}
            onSubscribeOpen={() => setSubscribeOpen(true)}
            onToggleHemisphere={toggleHemisphere}
            onKickIdle={kickIdle}
          />
        </View>
      </PagerView>

      {/* Page Indicator Dots */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: showPageIndicator ? 1 : 0 }}
        transition={{ type: "timing", duration: 700 }}
        style={styles.pageIndicator}
        pointerEvents="none"
      >
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, currentPage === 0 && styles.dotActive]} />
          <View style={[styles.dot, currentPage === 1 && styles.dotActive]} />
        </View>
      </MotiView>

      <SubscribeModal
        visible={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: "#0C0C0C",
  },
  centerFill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    color: "#F7EBD6",
    fontWeight: "bold",
    marginTop: 0,
    fontFamily: "System",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 18,
    color: "#D4C7B0",
    marginTop: 4,
    fontFamily: "Spectral_400Regular",
  },
  starsBackground: {
    position: "absolute",
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: -1,
    opacity: 0.6,
  },
  pageIndicator: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DEC4A1",
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    backgroundColor: "#E6D2B5",
  },
});
