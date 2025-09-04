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
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";

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

  // After the first idle fade, About is enabled in the regular nav
  const [aboutEnabled, setAboutEnabled] = useState(false);

  // After the first idle fade, keep the title hidden unless About is open
  const [titleLockedOff, setTitleLockedOff] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickIdle = () => {
    setHudVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setHudVisible(false);
      setAboutEnabled(true); // About shows up in the regular nav from now on
      setTitleLockedOff(true); // Title stays hidden after the first fade
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

  const { version, setVersion } = useCrossfadeAudio(AUDIO_URLS, "guided", {
    fadeMs: 1000,
    loop: true,
    autoStart: true,
  });

  // Start with HUD visible (title visible/centered); fades after 8s
  useEffect(() => {
    kickIdle();
  }, []);

  const handleAnyTouch = () => {
    // After the first fade, this will NOT bring the title back (locked off),
    // but it will bring the menu back as usual.
    kickIdle();
  };

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
  // Title is ALWAYS centered when visible; visible only at start (pre-fade) or on About
  const showTitle = isAboutOpen || (!titleLockedOff && hudVisible);

  return (
    <View style={styles.container} onTouchStart={handleAnyTouch}>
      {/* Click-away overlay — render BEFORE the menu so the menu stays clickable */}
      {openMenu && (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.clickAway]} // ⬅️ add zIndex
          onPress={closeAll}
          onTouchStart={handleAnyTouch}
        />
      )}

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: hudVisible || !!openMenu ? 1 : 0 }} // ⬅️ was hudVisible ? 1 : 0
        transition={{ type: "timing", duration: 700 }}
        style={[styles.menu]}
        pointerEvents={hudVisible || !!openMenu ? "auto" : "none"} // ⬅️ was hudVisible only
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
              { title: "Support on Stripe", url: "https://example.com/donate" },
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
              { title: "Location" },
              { title: "Subscribe to newsletter" },
            ]}
            isExpanded
            onToggle={closeAll}
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
          <MenuGroup label="About" links={[]} isExpanded onToggle={closeAll} />
        )}
      </MotiView>

      {/* TITLE — ALWAYS CENTERED when visible; does NOT affect layout */}
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

      {/* MOON — UNCHANGED */}
      <View onTouchStart={handleAnyTouch}>
        <Moon
          size={260}
          startScale={1}
          endScale={0.55}
          endYOffset={moonEndYOffset}
        />
      </View>
    </View>
  );
}

// Styles: leave container/menu exactly as you had them.
// Centered title overlay is absolute so it WON'T push or move the moon.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
    paddingTop: 200,
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
