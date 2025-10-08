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
  selectedSubId,
  selectedSubIds,
  onSubPress,
  closeOnLinkPress = true,
  specialColors = {},
}: {
  label: string;
  links: Link[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedSubId?: string | null;
  selectedSubIds?: string[];
  onSubPress?: (title?: string, link?: Link) => void;
  closeOnLinkPress?: boolean;
  specialColors?: Record<string, string>;
}) {
  const handleLinkPress = async (link: Link) => {
    // Always call onSubPress first for actions
    if (link.action || !link.url) {
      onSubPress?.(link.title, link);
      // Only close if closeOnLinkPress is true
      if (closeOnLinkPress) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle();
      }
      return;
    }

    // Handle URL links
    if (link.url) {
      await Linking.openURL(link.url);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (closeOnLinkPress) onToggle();
      return;
    }
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
        style={{ alignSelf: "center" }}
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
                  style={{ alignSelf: "center" }}
                >
                  <Pressable onPress={() => handleLinkPress(link)} hitSlop={6}>
                    <View style={styles.linkContainer}>
                      {link.icon && (
                        <Ionicons
                          name={link.icon as any}
                          size={19}
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
    marginBottom: 18,
    alignSelf: "center",
    alignItems: "center",
    maxWidth: 420,
  },
  label: {
    fontSize: 22,
    color: "#DEC4A1",
    fontWeight: "500",
    fontFamily: "Lora_400Regular",
    textAlign: "center",
  },
  selectedLabel: {
    fontSize: 29,
    color: "#E6D2B5",
  },
  linksWrap: {
    marginTop: 10,
    alignSelf: "center",
    alignItems: "center",
    width: "auto",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  linkIcon: {
    marginRight: 6,
  },
  link: {
    fontSize: 19,
    paddingHorizontal: 10,
    paddingTop: 6,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
  },
  linkSelected: {
    fontWeight: "condensed",
  },
});
