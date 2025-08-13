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

type Link = { title: string; url: string };

export default function MenuGroup({
  label,
  links,
  isExpanded,
  onToggle,
}: {
  label: string;
  links: Link[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const handleLinkPress = async (url: string) => {
    await Linking.openURL(url);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle(); // close after link click
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
            {links.map((link, i) => (
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
              >
                <Pressable
                  onPress={() => handleLinkPress(link.url)}
                  hitSlop={6}
                >
                  <Text style={styles.link}>{link.title}</Text>
                </Pressable>
              </MotiView>
            ))}
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 12,
    display: "flex",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 18,
    color: "#F7EBD6",
    fontWeight: "500",
    fontFamily: "Lora_400Regular",
  },
  selectedLabel: {
    fontSize: 24, // bigger when selected
    color: "#E6D2B5",
  },
  linksWrap: {
    marginTop: 6,
  },
  link: {
    fontSize: 16,
    color: "#BCA98F",
    paddingLeft: 10,
    paddingTop: 4,
    fontFamily: "Lora_400Regular",
  },
});
