import MenuGroup from "@/components/MenuGroup";
import Moon from "@/components/Moon";
import useCrossfadeAudio from "@/hooks/useCrossfadeAudio";
import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SubscribeModal } from "../components/SubscribeModal";
import { MoonLocationProvider } from "../hooks/useMoonLocation";

import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Version = "guided" | "birth" | "life" | "death" | "full";

const AUDIO_URLS: Record<Version, string> = {
  guided:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Invocation%20Stereo%20Printmaster_202050726.mp3?alt=media&token=bb04902e-9d6b-4edc-8634-4b64f16651b7",
  life: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Life%20Stereo%20Printmaster_202050725.mp3?alt=media&token=ad2a909b-16c9-4220-b23e-f33a40b3ba81",
  birth:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Birth%20with%20Invocation%20Stereo%20Printmaster_202050725.mp3?alt=media&token=90cdf52b-3047-4386-b1fd-cf9d893ed4a4",
  death:
    "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Death%20Stereo%20Printmaster_202050725.mp3?alt=media&token=8d601f5e-b894-4cbd-9131-de0cefcca58b",
  full: "https://firebasestorage.googleapis.com/v0/b/moonrise001-5aa1c.firebasestorage.app/o/Moonrise_Full%20Album%20Stereo%20Printmaster_202050725.mp3?alt=media&token=8107d004-0733-4ee7-8c64-28feffd96c66",
};
export default function HomeScreen() {
  const [openMenu, setOpenMenu] = useState<
    "Modes" | "Credits" | "Donate" | "Settings" | "About" | null
  >(null);

  // Idle HUD (8s)
  const IDLE_MS = 8000;
  const [hudVisible, setHudVisible] = useState(false);

  const moonStartYOffset = 300; // ⬅️ where the moon should start (positive = down)
  const MOON_GLIDE_MS = 600_000; // ⬅️ 10 minutes
  const [showMenu, setShowMenu] = useState(false);

  // After the first idle fade, About is enabled in the regular nav
  const [aboutEnabled, setAboutEnabled] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  // After the first idle fade, keep the title hidden unless About is open
  const [titleLockedOff, setTitleLockedOff] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickIdle = () => {
    setHudVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setHudVisible(false);
      setShowMenu(false); // ⬅️ hide menu again on idle
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

  const { version, setVersion } = useCrossfadeAudio(AUDIO_URLS, "full", {
    fadeMs: 1000,
    loop: true,
    autoStart: true,
  });

  const insets = useSafeAreaInsets();
  // Start with HUD visible (title visible/centered); fades after 8s
  useEffect(() => {
    kickIdle();
  }, []);

  const handleAnyTouch = () => {
    setShowMenu(true);
    kickIdle();
  };

  // How far from the physical top you want the moon to start (what your 200px “felt like”)
  const MOON_SIZE = 260; // keep in sync with <Moon size={260} />
  const DESIRED_FROM_TOP = 220; // tweak to taste (try 200–260)
  const maxTop = Math.max(
    0,
    Dimensions.get("window").height - MOON_SIZE - insets.bottom - 16 // leave a little breathing room
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

  // KEEP THE MOON EXACTLY AS IN YOUR CHUNK
  const screenH = Dimensions.get("window").height;
  const moonEndYOffset = -100; // fixed offset

  const isAboutOpen = openMenu === "About";
  const hideMoon = isAboutOpen;
  // Title is ALWAYS centered when visible; visible only at start (pre-fade) or on About
  const showTitle = isAboutOpen || (!titleLockedOff && hudVisible);

  return (
    <SafeAreaView style={styles.container} onTouchStart={handleAnyTouch}>
      {/* Click-away overlay — render BEFORE the menu so the menu stays clickable */}
      <MoonLocationProvider>
        {openMenu && (
          <Pressable
            style={[StyleSheet.absoluteFill, styles.clickAway]} // ⬅️ add zIndex
            onPress={closeAll}
            onTouchStart={handleAnyTouch}
          />
        )}

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: showMenu || !!openMenu ? 1 : 0 }}
          transition={{ type: "timing", duration: 700 }}
          style={styles.menu} // ⬅️ no moonOffset on the menu
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
              ]}
              isExpanded
              onToggle={closeAll}
              selectedSubId={`Modes:${cap(version)}`}
              onSubPress={(title) => {
                const v = title.toLowerCase() as Version;
                if (v !== version) setVersion(v);
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
                  title: "Support on Stripe",
                  url: "https://example.com/donate",
                },
                { title: "Patreon", url: "https://example.com/patreon" },
              ]}
              isExpanded
              onToggle={closeAll}
            />
          )}

          {openMenu === "Settings" && (
            <MenuGroup
              label="Settings"
              links={[
                { title: "Use My Location", action: "use-location" },
                { title: "Subscribe to newsletter" },
              ]}
              isExpanded
              onToggle={closeAll}
              onSubPress={(title) => {
                if (title === "Subscribe to newsletter") {
                  setSubscribeOpen(true);
                }
              }}
            />
          )}

          {/* Top-level labels (About appears here AFTER the first fade) */}
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

          {/* Expanded "About" (optional header state) */}
          {openMenu === "About" && (
            <MenuGroup
              label="About"
              links={[]}
              isExpanded
              onToggle={closeAll}
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

        {/* MOON */}
        <View
          onTouchStart={handleAnyTouch}
          style={{
            position: "absolute",
            top: moonOffset, // ⬅️ safe-area aware vertical anchor
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
              endScale={0.55}
              endYOffset={moonEndYOffset}
            />
          </MotiView>
        </View>
      </MoonLocationProvider>
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
    // paddingTop: 200, // ⬅️ removed so moonOffset fully controls vertical position
    paddingBottom: 32,
  },
  menu: {
    position: "absolute",
    top: 48,
    right: 20,
    alignItems: "flex-end",
    zIndex: 2, // ⬅️ on top of the click-away overlay
  },
  wrapper: {
    marginTop: 100, // ← ensure this is 100, not 24 or something else
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  clickAway: {
    zIndex: 1, // ⬅️ below the menu, above the background
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
