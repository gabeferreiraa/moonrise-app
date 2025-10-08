import MenuGroup from "@/components/MenuGroup";
import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Unsubscribe } from "../components/Unsubscribe";

type Version = "guided" | "birth" | "life" | "death" | "full";

interface MenuPageProps {
  version: Version;
  guidedEnabled: boolean;
  selectedModes: string[];
  hemisphere: "north" | "south";
  onModePress: (title?: string, link?: any) => void;
  onSubscribeOpen: () => void;
  onToggleHemisphere: () => void;
  onKickIdle: () => void;
}

export default function MenuPage({
  hemisphere,
  onModePress,
  onSubscribeOpen,
  onToggleHemisphere,
  onKickIdle,
}: MenuPageProps) {
  const [openMenu, setOpenMenu] = useState<
    "Modes" | "Credits" | "Donate" | "Settings" | "About" | null
  >(null);
  const [menuActive, setMenuActive] = useState(true);
  const [aboutEnabled, setAboutEnabled] = useState(true);
  const router = useRouter();
  const [fontsLoaded] = useFonts({ CormorantGaramond_700Bold });

  const open = (g: "Modes" | "Credits" | "Donate" | "Settings" | "About") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu((prev) => (prev === g ? null : g));
    setMenuActive(true);
    onKickIdle();
  };

  const closeAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu(null);
    onKickIdle();
  };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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

  const isAboutOpen = openMenu === "About";
  const showTitle = isAboutOpen;

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: showTitle ? 1 : 0 }}
        transition={{ type: "timing", duration: 300 }}
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

      <View style={styles.menuContainer} pointerEvents="box-none">
        {openMenu && menuActive && (
          <Pressable
            style={[StyleSheet.absoluteFill, styles.clickAway]}
            onPress={closeAll}
            onTouchStart={onKickIdle}
          />
        )}

        {openMenu && !menuActive && (
          <Pressable
            style={[StyleSheet.absoluteFill, styles.clickAway]}
            onPress={onKickIdle}
          />
        )}

        <View style={styles.menuContent}>
          {/* {openMenu === "Modes" && (
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
              onSubPress={(title, link) => {
                console.log("Mode pressed:", title);
                onModePress(title, link);
              }}
              closeOnLinkPress={false}
              specialColors={{
                "Modes:Guided": "#A0B5A8",
                "Modes:Unguided": "#A0B5A8",
              }}
            />
          )} */}

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
                  title: "Subscribe to newsletter",
                  action: "subscribe-newsletter",
                },
              ]}
              isExpanded
              onToggle={closeAll}
              closeOnLinkPress={false}
              onSubPress={(_title, link) => {
                console.log("Settings pressed:", _title, link?.action);
                if (link?.action === "toggle-hemisphere") {
                  console.log("Toggling hemisphere");
                  onToggleHemisphere();
                } else if (link?.action === "subscribe-newsletter") {
                  console.log("Opening subscribe");
                  onSubscribeOpen();
                }
              }}
            />
          )}

          {!openMenu && (
            <>
              {/* <MenuGroup
                label="Modes"
                links={[]}
                isExpanded={false}
                onToggle={() => open("Modes")}
              /> */}
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
              <MenuGroup
                label="Community"
                links={[]}
                isExpanded={false}
                onToggle={() => {
                  setOpenMenu(null);
                  router.push("/chatboard");
                }}
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
              links={[]}
              isExpanded
              onToggle={closeAll}
            />
          )}
        </View>
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {openMenu === "About" && (
          <Pressable
            pointerEvents="auto"
            style={styles.shareButton}
            onPress={shareApp}
          >
            <Text style={styles.shareIcon}>↗</Text>
          </Pressable>
        )}
      </View>

      {openMenu === "Settings" && <Unsubscribe />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0C",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "33%",
    alignItems: "center",
    transform: [{ translateY: -10 }],
  },
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  menuContent: {
    zIndex: 2,
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
    fontSize: 36,
    color: "#F7EBD6",
    fontWeight: "bold",
    marginTop: 0,
    fontFamily: "Lora_400Regular",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 24,
    color: "#D4C7B0",
    marginTop: 4,
    fontFamily: "Spectral_400Regular",
  },
  shareButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    padding: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(247,235,214,0.35)",
    backgroundColor: "rgba(247,235,214,0.08)",
    zIndex: 9999,
    elevation: 9999,
  },
  shareIcon: {
    fontSize: 22,
    color: "#F7EBD6",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
