import { Ionicons } from "@expo/vector-icons";
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
  action?: string;
  icon?: string;
};

export default function MenuGroup({
  label,
  links,
  isExpanded,
  onToggle,
  selectedSubId, // Keep for backwards compatibility
  selectedSubIds, // New prop for multiple selections
  onSubPress,
  closeOnLinkPress = true,
  specialColors = {}, // New prop for special colors
}: {
  label: string;
  links: Link[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedSubId?: string | null; // Keep for backwards compatibility
  selectedSubIds?: string[]; // New prop for multiple selections
  onSubPress?: (title?: string, link?: Link) => void;
  closeOnLinkPress?: boolean;
  specialColors?: Record<string, string>; // New prop for special colors
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

  const isItemSelected = (id: string) => {
    if (selectedSubIds) {
      return selectedSubIds.includes(id);
    }
    return selectedSubId === id;
  };

  const getItemColor = (id: string, isSelected: boolean) => {
    if (specialColors[id]) {
      if (id === "Modes:Guided" && isSelected) {
        return "#D8F0DD";
      }
      return specialColors[id];
    }
    return isSelected ? "#FFECCC" : "#CBBCA4";
  };

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
              const isSelected = isItemSelected(id);
              const itemColor = getItemColor(id, isSelected);

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
                          color={itemColor}
                          style={styles.linkIcon}
                        />
                      )}
                      <Text
                        style={[
                          styles.link,
                          { color: itemColor },
                          isSelected && styles.linkSelected,
                        ]}
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
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  linkIcon: {
    marginLeft: 6,
  },
  link: {
    fontSize: 16,
    paddingLeft: 10,
    paddingTop: 4,
    fontFamily: "Lora_400Regular",
    textAlign: "right",
  },
  linkSelected: {
    fontWeight: "condensed",
  },
});
