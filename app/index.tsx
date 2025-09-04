// app/index.tsx
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
    "Modes" | "Credits" | "Donate" | "Settings" | null
  >(null);

  // Idle HUD (8s)
  const IDLE_MS = 8000;
  const [hudVisible, setHudVisible] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickIdle = () => {
    setHudVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setHudVisible(false), IDLE_MS);
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

  useEffect(() => {
    kickIdle();
  }, []);

  const handleAnyTouch = () => kickIdle();

  const open = (g: "Modes" | "Credits" | "Donate" | "Settings") => {
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

  const screenH = Dimensions.get("window").height;
  const moonEndYOffset = -Math.round(screenH * 0.05);

  return (
    <View style={styles.container} onTouchStart={handleAnyTouch}>
      {openMenu && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeAll}
          onTouchStart={handleAnyTouch}
        />
      )}

      {/* MENU */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: hudVisible ? 1 : 0 }}
        transition={{ type: "timing", duration: 700 }}
        style={styles.menu}
        pointerEvents={hudVisible ? "auto" : "none"}
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
              { title: "Location" },
              { title: "Subscribe to newsletter" },
            ]}
            isExpanded
            onToggle={closeAll}
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
          </>
        )}
      </MotiView>

      {/* TITLE — moved up */}
      <MotiView
        from={{ opacity: 0, translateY: 7 }}
        animate={{
          opacity: hudVisible ? 1 : 0,
          translateY: hudVisible ? 0 : 7,
        }}
        transition={{ type: "timing", duration: 700 }}
        style={styles.titleContainer}
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

      {/* MOON — scaled 1 → 0.55 and ends in top third */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
    paddingTop: 40, // ⬅️ CHANGED: was 100, brings everything higher
    paddingBottom: 32, // slight tighten
  },
  menu: {
    position: "absolute",
    top: 48, // ⬅️ CHANGED: was 100, keep menu closer to top
    right: 20,
    alignItems: "flex-end",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 100, // ⬅️ CHANGED: was 220; places title well above the moon
    marginBottom: -10, // ⬅️ CHANGED: gentler overlap if needed
  },
  title: {
    fontSize: 28,
    color: "#F7EBD6",
    fontWeight: "bold",
    marginTop: 10, // ⬅️ CHANGED: was 20
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 18,
    color: "#D4C7B0",
    marginTop: 4,
    fontFamily: "Spectral_400Regular",
  },
});
