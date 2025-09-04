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

type Link = { title: string; url?: string };

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
  const handleLinkPress = async (link: Link) => {
    // If link has a URL → open external
    if (link.url) {
      await Linking.openURL(link.url);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (closeOnLinkPress) onToggle();
      return;
    }
    // Otherwise treat as in-app action (e.g., pick audio version)
    onSubPress?.(link.title);
  };

  const labelStyle = isExpanded
    ? [styles.label, styles.selectedLabel]
    : styles.label;

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
                      {link.title}
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
    color: "#F7EBD6",
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
    color: "#BCA98F",
    paddingLeft: 10,
    paddingTop: 4,
    fontFamily: "Lora_400Regular",
    textAlign: "right", // 👈 right-align item text
  },
  linkSelected: {
    color: "#FFECCC",
  },
});
