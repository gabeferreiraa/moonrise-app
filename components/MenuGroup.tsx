import { useMoonLocationCtx } from "@/hooks/useMoonLocation";
import { AnimatePresence, MotiView } from "moti";
import {
  LayoutAnimation,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";

type Link = {
  title: string;
  url?: string;
  action?: "use-location";
};

export default function MenuGroup({
  label,
  links,
  isExpanded,
  onToggle,
  selectedSubId,
  onSubPress,
  closeOnLinkPress = true,
}: {
  label: string;
  links: Link[];
  isExpanded: boolean;
  onToggle: () => void;

  // optional UX helpers
  selectedSubId?: string | null; // e.g. "Modes:Guided"
  onSubPress?: (title: string) => void; // called when a non-URL item is pressed
  closeOnLinkPress?: boolean; // for URL links; default true
}) {
  // Grab shared location controls (provided by MoonLocationProvider)
  const moonLoc = useMoonLocationCtx?.() ?? null;

  const handleLinkPress = async (link: Link) => {
    // 1) External URL → open
    if (link.url) {
      await Linking.openURL(link.url);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (closeOnLinkPress) onToggle();
      return;
    }

    // 2) Location action → trigger permission + location fetch
    const isUseLocation =
      link.action === "use-location" || link.title === "Use My Location";

    if (isUseLocation && moonLoc) {
      await moonLoc.requestLocation();
      // keep menu open/closed per your preference; currently keeps state
      // If you want to auto-close: onToggle();
      return;
    }

    // 3) Otherwise treat as in-app action
    onSubPress?.(link.title);
  };

  const labelStyle = isExpanded
    ? [styles.label, styles.selectedLabel]
    : styles.label;

  // Compute display title for each link (dynamic for "Use My Location")
  const getDisplayTitle = (link: Link) => {
    const isUseLocation =
      link.action === "use-location" || link.title === "Use My Location";
    if (!isUseLocation || !moonLoc) return link.title;

    if (moonLoc.loading) return "Locating…";
    return moonLoc.usingDefault ? "Use My Location" : "Using Your Location ✓";
  };

  return (
    <View style={styles.group}>
      {/* Top-level label */}
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        hitSlop={8}
        style={{ alignSelf: "flex-end" }} // keep the tap target aligned right
      >
        <MotiView
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }}
        >
          <Text style={labelStyle}>{label}</Text>
        </MotiView>
      </Pressable>

      {/* Sub-links */}
      <AnimatePresence>
        {isExpanded && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -6 }}
            transition={{
              type: "timing",
              duration: 280,
              easing: Easing.out(Easing.cubic),
            }}
            style={styles.linksWrap}
          >
            {links.map((link, i) => {
              const id = `${label}:${link.title}`;
              const isSelected = selectedSubId === id;
              const displayTitle = getDisplayTitle(link);

              return (
                <MotiView
                  key={link.title + i}
                  from={{ opacity: 0, translateY: -6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: -6 }}
                  transition={{
                    type: "timing",
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                    delay: i * 60, // stagger
                  }}
                  style={{ alignSelf: "flex-end" }}
                >
                  <Pressable onPress={() => handleLinkPress(link)} hitSlop={6}>
                    <Text
                      style={[
                        styles.link,
                        isSelected && styles.linkSelected, // highlight current
                      ]}
                      numberOfLines={1}
                    >
                      {displayTitle}
                    </Text>
                  </Pressable>
                </MotiView>
              );
            })}
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 12,
    alignSelf: "flex-end", // 👈 anchor the whole group to the right
    alignItems: "flex-end", // 👈 right-align children
    maxWidth: 420, // avoid stretching across screen
  },
  label: {
    fontSize: 18,
    color: "#DEC4A1",
    fontWeight: "500",
    fontFamily: "Lora_400Regular",
    textAlign: "right", // 👈 right-align title text
  },
  selectedLabel: {
    fontSize: 24,
    color: "#E6D2B5",
  },
  linksWrap: {
    marginTop: 6,
    alignSelf: "flex-end", // 👈 keep submenu anchored right under label
    alignItems: "flex-end",
    width: "auto",
  },
  link: {
    fontSize: 16,
    color: "#DEC4A1",
    paddingLeft: 10,
    paddingTop: 4,
    fontFamily: "Lora_400Regular",
    textAlign: "right", // 👈 right-align item text
  },
  linkSelected: {
    color: "#FFECCC",
  },
});
