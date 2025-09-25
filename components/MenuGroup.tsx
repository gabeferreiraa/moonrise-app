import { Ionicons } from "@expo/vector-icons"; // Add this import
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

export type Link = {
  title: string;
  url?: string;
  action?: "use-location";
  icon?: string;
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
  selectedSubId?: string | null;
  onSubPress?: (title?: string, link?: Link) => void;
  closeOnLinkPress?: boolean;
}) {
  const handleLinkPress = async (link: Link) => {
    if (link.url) {
      await Linking.openURL(link.url);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (closeOnLinkPress) onToggle();
      return;
    }
    onSubPress?.(link.title, link);
  };

  const labelStyle = isExpanded
    ? [styles.label, styles.selectedLabel]
    : styles.label;

  return (
    <View style={styles.group}>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        hitSlop={8}
        style={{ alignSelf: "flex-end" }}
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
                    delay: i * 60,
                  }}
                  style={{ alignSelf: "flex-end" }}
                >
                  <Pressable onPress={() => handleLinkPress(link)} hitSlop={6}>
                    <View style={styles.linkContainer}>
                      {link.icon && (
                        <Ionicons
                          name={link.icon as any}
                          size={16}
                          color={isSelected ? "#FFECCC" : "#CBBCA4"}
                          style={styles.linkIcon}
                        />
                      )}
                      <Text
                        style={[styles.link, isSelected && styles.linkSelected]}
                        numberOfLines={1}
                      >
                        {link.title}
                      </Text>
                    </View>
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
    alignSelf: "flex-end",
    alignItems: "flex-end",
    maxWidth: 420,
  },
  label: {
    fontSize: 18,
    color: "#DEC4A1",
    fontWeight: "500",
    fontFamily: "Lora_400Regular",
    textAlign: "right",
  },
  selectedLabel: {
    fontSize: 24,
    color: "#E6D2B5",
  },
  linksWrap: {
    marginTop: 6,
    alignSelf: "flex-end",
    alignItems: "flex-end",
    width: "auto",
  },
  linkContainer: {
    flexDirection: "row-reverse", // This reverses the order, putting icon on the right
    alignItems: "center",
    justifyContent: "flex-start", // Since we're using row-reverse, flex-start aligns to the right
  },
  linkIcon: {
    marginLeft: 6, // Keep marginLeft since row-reverse flips the layout
  },
  link: {
    fontSize: 16,
    color: "#CBBCA4",
    paddingLeft: 10,
    paddingTop: 4,
    fontFamily: "Lora_400Regular",
    textAlign: "right",
  },
  linkSelected: {
    color: "#FFECCC",
    fontWeight: "condensed",
  },
});
