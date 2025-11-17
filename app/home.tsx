import Moon from "@/components/Moon";
import useCrossfadeAudio from "@/hooks/useCrossfadeAudio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  Platform,
  StyleSheet,
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MenuPage from "./menu";

type Version = "guided" | "birth" | "life" | "death" | "full";

const AUDIO_URLS: Record<Version, string> = {
  guided:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation_With_Death_No_Penny_32Bit_96kHz.m4a?alt=media&token=ac51c3c1-4154-4f93-b2a4-4ec0eb984428",
  life: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation_With_Life_32Bit_96kHz.m4a?alt=media&token=ad8c870e-f722-43ee-a91d-024d7bb75106",
  birth:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation_With_Birth_32Bit_96kHz.m4a?alt=media&token=2b02efe4-5738-400a-95bf-1efa493174ce",
  death:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation_With_Death_With_Penny_32Bit_96kHz.m4a?alt=media&token=1a086a17-d34b-4f01-b547-1a81e385eb36",
  full: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation_With_Death_With_Penny_32Bit_96kHz.m4a?alt=media&token=1a086a17-d34b-4f01-b547-1a81e385eb36",
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
  const hasStartedAudioRef = useRef(false);

  const { version, setVersion, isReady, setInitialVolume } = useCrossfadeAudio(
    AUDIO_URLS,
    "guided",
    {
      fadeMs: 1000,
      loop: false,
      autoStart: false,
    }
  );
  const screenOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if we should fade in from intention screen
    const fadeInAudio = params.fadeInAudio === "true";
    const initialDelay = fadeInAudio ? 200 : 600; // Shorter delay if coming from intention

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: fadeInAudio ? 1200 : 600, // Longer fade if from intention
        useNativeDriver: true,
      }).start();
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [params.fadeInAudio]);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
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

  useEffect(() => {
    const handleIntentionParams = async () => {
      if (
        params.intention &&
        params.audioMode &&
        isReady &&
        !hasStartedAudioRef.current
      ) {
        hasStartedAudioRef.current = true;

        console.log(
          `Received intention: ${params.intention}, Playing: ${params.audioMode}`
        );

        const targetMode = params.audioMode as Version;
        const fadeInAudio = params.fadeInAudio === "true";

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Set initial volume based on fade preference
        if (!fadeInAudio) {
          await setInitialVolume(1);
        }

        // Start playing the selected track
        await setVersion(targetMode);

        // If fading in, do the fade AFTER audio has started
        if (fadeInAudio) {
          await setInitialVolume(0);

          const fadeInDuration = 2000;
          const fadeSteps = 20;
          const stepDuration = fadeInDuration / fadeSteps;

          for (let i = 0; i <= fadeSteps; i++) {
            const volume = i / fadeSteps;
            await setInitialVolume(volume);
            await new Promise((resolve) => setTimeout(resolve, stepDuration));
          }
        }

        // Set the guided enabled state based on target mode
        if (targetMode === "guided") {
          setGuidedEnabled(true);
        } else {
          setGuidedEnabled(false);
        }

        // Show subscribe modal if first launch
        if (isFirstLaunch) {
          setTimeout(() => {
            setSubscribeOpen(true);
          }, 800);
        }
      }
    };

    handleIntentionParams();
  }, [params, isReady, isFirstLaunch, setInitialVolume, setVersion]);

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

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
      {isNewMoon && (
        <ImageBackground
          source={require("@/assets/images/moonrise_backdrop_block.png")}
          style={styles.starsBackground}
          resizeMode="stretch"
        />
      )}
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
                zIndex: 1,
              }}
            >
              <Moon
                size={260}
                startScale={1}
                endScale={0.35}
                endYOffset={-80}
                hemisphere={hemisphere}
                phase={moonPhase}
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
    </Animated.View>
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
