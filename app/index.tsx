import MenuGroup from "@/components/MenuGroup";
import Moon from "@/components/Moon";
import useCrossfadeAudio from "@/hooks/useCrossfadeAudio";
import { MotiView } from "moti";
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
  View,
} from "react-native";
import { SubscribeModal } from "../components/SubscribeModal";
import {
  MoonLocationProvider,
  useMoonLocationCtx,
} from "../hooks/useMoonLocation";

import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Version =
  | "guided"
  | "birth"
  | "life"
  | "death"
  | "full"
  | "deathBeNotProud";

const AUDIO_URLS: Record<Version, string> = {
  guided:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation%20Stereo%20Printmaster_202050726.mp3?alt=media&token=bb04902e-9d6b-4edc-8634-4b64f16651b7",
  life: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Life%20Stereo%20Printmaster_202050725.mp3?alt=media&token=ad2a909b-16c9-4220-b23e-f33a40b3ba81",
  birth:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Birth%20with%20Invocation%20Stereo%20Printmaster_202050725.mp3?alt=media&token=90cdf52b-3047-4386-b1fd-cf9d893ed4a4",
  death:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Death%20Stereo%20Printmaster_202050725.mp3?alt=media&token=8d601f5e-b894-4cbd-9131-de0cefcca58b",
  full: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Full%20Album%20Stereo%20Printmaster_202050725.mp3?alt=media&token=8107d004-0733-4ee7-8c64-28feffd96c66",
  deathBeNotProud:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Death%20No%20Poem%20Outro_Stereo%20Printmaster_202050726.mp3?alt=media&token=3e18c536-b830-4185-a07e-a56f6604d04c",
};

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
  const [aboutEnabled, setAboutEnabled] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const { requestOnce } = useMoonLocationCtx();
  const [titleLockedOff, setTitleLockedOff] = useState(false);

  // Audio hook - simplified
  const { version, setVersion, isReady } = useCrossfadeAudio(
    AUDIO_URLS,
    "full",
    {
      fadeMs: 1000,
      loop: true,
      autoStart: true,
    }
  );

  // Share app function
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

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickIdle = () => {
    setHudVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setHudVisible(false);
      setShowMenu(false);
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

  return (
    <SafeAreaView
      style={styles.container}
      edges={["left", "right", "top"]}
      onTouchStart={handleAnyTouch}
    >
      {openMenu && (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.clickAway]}
          onPress={closeAll}
          onTouchStart={handleAnyTouch}
        />
      )}

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: showMenu || !!openMenu ? 1 : 0 }}
        transition={{ type: "timing", duration: 700 }}
        style={styles.menu}
        pointerEvents={showMenu || !!openMenu ? "auto" : "none"}
      >
        {openMenu === "Modes" && (
          <MenuGroup
            label="Modes"
            links={[
              { title: "Guided" },
              { title: "Birth" },
              { title: "Life" },
              { title: "Death" },
              { title: "Full" },
              { title: "Death - Be Not Proud" },
            ]}
            isExpanded
            onToggle={closeAll}
            selectedSubId={`Modes:${
              version === "deathBeNotProud"
                ? "Death - Be Not Proud"
                : cap(version)
            }`}
            onSubPress={(title) => {
              let newVersion: Version;

              if (title === "Death - Be Not Proud") {
                newVersion = "deathBeNotProud";
              } else {
                newVersion = title.toLowerCase() as Version;
              }

              console.log("Menu clicked:", title, "->", newVersion);
              console.log("Current version before:", version);

              setVersion(newVersion);

              console.log("setVersion called with:", newVersion);
              kickIdle();
            }}
            closeOnLinkPress={false}
          />
        )}

        {openMenu === "Credits" && (
          <MenuGroup
            label="Credits"
            links={[
              { title: "Alchemy crystal singing bowls – Deva Munay" },
              { title: "Produced by Jeff Bhasker" },
              { title: "Recorded by Greg Morgenstein" },
              { title: "Death Be Not Proud – recited by Penny" },
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
                title: "Share location for correct moon phase",
                action: "use-location",
              },
              { title: "Subscribe to newsletter" },
            ]}
            isExpanded
            onToggle={closeAll}
            onSubPress={async (_title, link) => {
              if (link?.action === "use-location") {
                await requestOnce();
              }
              if (_title === "Subscribe to newsletter") {
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
            links={[{ title: "Share Moonrise", url: undefined }]}
            isExpanded
            onToggle={closeAll}
            onSubPress={(title) => {
              if (title === "Share Moonrise") {
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

      <View
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
        <MotiView
          from={{ opacity: 1 }}
          animate={{ opacity: hideMoon ? 0 : 1 }}
          transition={{ type: "timing", duration: 500 }}
        >
          <Moon
            size={260}
            startScale={1}
            endScale={0.35}
            endYOffset={-80}
            tintColor="#e37a2e"
            tintOpacity={0.6}
            fadeTintOutAtEnd
          />
        </MotiView>
      </View>

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
});
