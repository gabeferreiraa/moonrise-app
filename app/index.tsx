import MenuGroup from "@/components/MenuGroup";
import Moon from "@/components/Moon";
import useCrossfadeAudio from "@/hooks/useCrossfadeAudio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotiImage, MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  UIManager,
} from "react-native";
import { SubscribeModal } from "../components/SubscribeModal";
import { Unsubscribe } from "../components/Unsubscribe";
import {
  MoonLocationProvider,
  useMoonLocationCtx,
} from "../hooks/useMoonLocation";

import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";
import { Easing } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
  const [openMenu, setOpenMenu] = useState<
    "Modes" | "Credits" | "Donate" | "Settings" | "About" | null
  >(null);

  const IDLE_MS = 8000;
  const [hudVisible, setHudVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuActive, setMenuActive] = useState(true);
  const [aboutEnabled, setAboutEnabled] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  const { toggleHemisphere, hemisphere, isNewMoon, moonPhase } =
    useMoonLocationCtx();
  const [titleLockedOff, setTitleLockedOff] = useState(false);

  const [guidedEnabled, setGuidedEnabled] = useState(true);

  const { version, setVersion, isReady } = useCrossfadeAudio(
    AUDIO_URLS,
    "guided",
    {
      fadeMs: 1000,
      loop: true,
      autoStart: true,
    }
  );

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunchedBefore === null) {
          setIsFirstLaunch(true);
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
          const timer = setTimeout(() => {
            setSubscribeOpen(true);
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Error checking first launch:", error);
      }
    };

    checkFirstLaunch();
  }, []);

  useEffect(() => {
    console.log(
      `Current moon phase: ${moonPhase}, isNewMoon: ${isNewMoon}, hemisphere: ${hemisphere}`
    );
  }, [moonPhase, isNewMoon, hemisphere]);

  async function shareApp() {
    try {
      const url =
        "https://apps.apple.com/us/app/moonrise-meditation/id6751916223";
      const shareTitle = "Moonrise — ambient album app";

      await Share.share(
        Platform.select({
          ios: { url, shareTitle },
          android: { message: `${shareTitle}\n${url}` },
        })!
      );
    } catch (error) {
      Alert.alert("Could not share", String(error));
    }
  }

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
    setMenuActive(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setHudVisible(false);
      if (!openMenu) {
        setShowMenu(false);
      }
      setMenuActive(false);
      setAboutEnabled(true);
      setTitleLockedOff(true);
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
    setShowMenu(true);
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

  const open = (g: "Modes" | "Credits" | "Donate" | "Settings" | "About") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu((prev) => (prev === g ? null : g));
    kickIdle();
  };

  const closeAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu(null);
    kickIdle();
  };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const isAboutOpen = openMenu === "About";
  const hideMoon = isAboutOpen;
  const showTitle = isAboutOpen || (!titleLockedOff && hudVisible);

  const getMenuOpacity = () => {
    if (openMenu) {
      return menuActive ? 1 : 0;
    } else {
      return showMenu ? 1 : 0;
    }
  };

  const menuOpacity = getMenuOpacity();
  const menuPointerEvents = openMenu || showMenu ? "auto" : "none";

  return (
    <SafeAreaView
      style={styles.container}
      edges={["left", "right", "top"]}
      onTouchStart={handleAnyTouch}
    >
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

      {openMenu && menuActive && (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.clickAway]}
          onPress={closeAll}
          onTouchStart={handleAnyTouch}
        />
      )}

      {openMenu && !menuActive && (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.clickAway]}
          onPress={() => {
            kickIdle();
          }}
        />
      )}

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: menuOpacity }}
        transition={{ type: "timing", duration: 700 }}
        style={styles.menu}
        pointerEvents={menuPointerEvents}
        onTouchStart={handleAnyTouch}
      >
        {openMenu === "Modes" && (
          <MenuGroup
            label="Modes"
            links={[
              { title: "Full" },
              { title: guidedEnabled ? "Guided" : "Unguided" },
              { title: "Birth" },
              { title: "Life" },
              { title: "Death" },
            ]}
            isExpanded
            onToggle={closeAll}
            selectedSubIds={selectedModes.map((mode) => `Modes:${cap(mode)}`)}
            onSubPress={handleModePress}
            closeOnLinkPress={false}
            specialColors={{
              "Modes:Guided": "#A0B5A8",
              "Modes:Unguided": "#A0B5A8",
            }}
          />
        )}

        {openMenu === "Credits" && (
          <MenuGroup
            label="Credits"
            links={[
              { title: "Alchemy crystal singing bowls — Deva Munay" },
              { title: "Produced by Jeff Bhasker" },
              { title: "Recorded by Greg Morgenstein" },
              { title: "Death Be Not Proud — recited by Penny" },
              { title: "Recorded at Ft. Sufi Big Sur 2024" },
              { title: "Hear360" },
            ]}
            isExpanded
            onToggle={closeAll}
          />
        )}

        {openMenu === "Donate" && (
          <MenuGroup
            label="Donate"
            links={[
              {
                title: "Donate to charity",
                url: "https://example.com/donate",
              },
              { title: "Other charity", url: "https://example.com/patreon" },
            ]}
            isExpanded
            onToggle={closeAll}
          />
        )}

        {openMenu === "Settings" && (
          <MenuGroup
            label="Settings"
            links={[
              {
                title: `Hemisphere: ${
                  hemisphere === "north" ? "Northern" : "Southern"
                }`,
                action: "toggle-hemisphere",
              },
              {
                title: "Join the community",
                action: "subscribe-newsletter",
              },
            ]}
            isExpanded
            onToggle={closeAll}
            onSubPress={(_title, link) => {
              if (link?.action === "toggle-hemisphere") {
                toggleHemisphere();
              } else if (link?.action === "subscribe-newsletter") {
                setSubscribeOpen(true);
              }
            }}
          />
        )}

        {!openMenu && (
          <>
            <MenuGroup
              label="Modes"
              links={[]}
              isExpanded={false}
              onToggle={() => open("Modes")}
            />
            <MenuGroup
              label="Credits"
              links={[]}
              isExpanded={false}
              onToggle={() => open("Credits")}
            />
            <MenuGroup
              label="Donate"
              links={[]}
              isExpanded={false}
              onToggle={() => open("Donate")}
            />
            <MenuGroup
              label="Settings"
              links={[]}
              isExpanded={false}
              onToggle={() => open("Settings")}
            />
            {aboutEnabled && (
              <MenuGroup
                label="About"
                links={[]}
                isExpanded={false}
                onToggle={() => open("About")}
              />
            )}
          </>
        )}

        {openMenu === "About" && (
          <MenuGroup
            label="About"
            links={[
              {
                title: "",
                icon: "share-outline",
                url: undefined,
              },
            ]}
            isExpanded
            onToggle={closeAll}
            onSubPress={(title) => {
              if (title === "") {
                shareApp();
              }
            }}
          />
        )}
      </MotiView>

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
        animate={{ opacity: hideMoon ? 0 : 1 }}
        transition={{ type: "timing", duration: 1200, delay: 300 }}
        onTouchStart={handleAnyTouch}
        style={{
          position: "absolute",
          top: moonOffset,
          left: 0,
          right: 0,
          alignItems: "center",
          pointerEvents: hideMoon ? "none" : "auto",
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

      <SubscribeModal
        visible={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
      {openMenu === "Settings" && <Unsubscribe />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
    paddingBottom: 32,
  },
  menu: {
    position: "absolute",
    top: 60,
    right: 20,
    alignItems: "flex-end",
    zIndex: 2,
  },
  wrapper: {
    marginTop: 100,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  clickAway: {
    zIndex: 1,
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
});
