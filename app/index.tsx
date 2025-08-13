import MenuGroup from "@/components/MenuGroup";
import Moon from "@/components/Moon";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

export default function HomeScreen() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Enable layout animations on Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleMenu = (menu: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const closeMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMenu(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Dismiss overlay */}
      {openMenu && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      )}

      {/* Menu */}
      <View style={styles.menu}>
        {openMenu === "Modes" && (
          <MenuGroup
            label="Modes"
            links={[
              { title: "Guided", url: "https://example.com/ambient" },
              { title: "Birth", url: "https://example.com/ambient" },
              { title: "Life", url: "https://example.com/ambient" },
              { title: "Death", url: "https://example.com/ambient" },
              { title: "Full", url: "https://example.com/ambient" },
            ]}
            isExpanded={true}
            onToggle={closeMenu}
          />
        )}
        {openMenu === "Credits" && (
          <MenuGroup
            label="Credits"
            links={[
              { title: "Deva Munay", url: "https://example.com/credits" },
            ]}
            isExpanded={true}
            onToggle={closeMenu}
          />
        )}
        {openMenu === "Donate" && (
          <MenuGroup
            label="Donate"
            links={[{ title: "Support", url: "https://example.com/donate" }]}
            isExpanded={true}
            onToggle={closeMenu}
          />
        )}
        {openMenu === "Settings" && (
          <MenuGroup
            label="Settings"
            links={[
              { title: "App Settings", url: "https://example.com/settings" },
            ]}
            isExpanded={true}
            onToggle={closeMenu}
          />
        )}

        {/* Show all top-level labels if no menu is open */}
        {!openMenu && (
          <>
            <MenuGroup
              label="Modes"
              links={[]}
              isExpanded={false}
              onToggle={() => toggleMenu("Modes")}
            />
            <MenuGroup
              label="Credits"
              links={[]}
              isExpanded={false}
              onToggle={() => toggleMenu("Credits")}
            />
            <MenuGroup
              label="Donate"
              links={[]}
              isExpanded={false}
              onToggle={() => toggleMenu("Donate")}
            />
            <MenuGroup
              label="Settings"
              links={[]}
              isExpanded={false}
              onToggle={() => toggleMenu("Settings")}
            />
          </>
        )}
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
        style={styles.titleContainer}
      >
        <Text style={styles.title}>MOONRISE</Text>
        <Text style={styles.subtitle}>Deva Munay</Text>
      </MotiView>

      {/* Moon: choose a fixed phase or use auto */}
      {/* Auto (based on current date): */}
      <Moon phase="auto" size={250} hemisphere="north" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 140,
    paddingBottom: 120,
    backgroundColor: "#0C0C0C",
    flexGrow: 1,
  },
  menu: {
    position: "absolute",
    top: 100,
    right: 20,
    alignItems: "flex-start",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 250,
    marginBottom: -50,
  },
  title: {
    fontSize: 28,
    color: "#F7EBD6",
    fontWeight: "bold",
    fontFamily: "Spectral_700Bold",
  },
  subtitle: {
    fontSize: 18,
    color: "#D4C7B0",
    marginTop: 4,
    fontFamily: "Spectral_400Regular",
  },
});
