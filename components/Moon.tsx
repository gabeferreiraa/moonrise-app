import { MotiView } from "moti";
import React, { useMemo } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

// 8 classic phases
export type MoonPhase =
  | "new"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

type Props = {
  /** Force a specific phase or use "auto" to compute from date */
  phase?: MoonPhase | "auto";
  /** Date to compute the phase from (only used when phase="auto") */
  date?: Date;
  /** Northern vs Southern hemisphere flips the lighted side */
  hemisphere?: "north" | "south";
  /** Render size in px (square) */
  size?: number;
  /** Optional press handler (e.g., to cycle phases) */
  onPress?: () => void;
  /** Extra style for container */
  style?: any;
};

const phaseToImage: Record<MoonPhase, ImageSourcePropType> = {
  new: require("@/assets/images/moon_new.png"),
  "waxing-crescent": require("@/assets/images/moon_waxing_crescent.png"),
  "first-quarter": require("@/assets/images/moon_first_quarter.png"),
  "waxing-gibbous": require("@/assets/images/moon_waxing_gibbous.png"),
  full: require("@/assets/images/moon_full.png"),
  "waning-gibbous": require("@/assets/images/moon_waning_gibbous.png"),
  "last-quarter": require("@/assets/images/moon_last_quarter.png"),
  "waning-crescent": require("@/assets/images/moon_waning_crescent.png"),
};

// ---- Simple phase calculation ----
// Returns an index 0..7 for the 8 phases above (UI‑friendly approx).
function phaseIndexFromDate(d: Date): number {
  const synodic = 29.530588853; // days
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14)); // Jan 6 2000 18:14 UTC
  const days = (d.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const lunations = (days / synodic) % 1;
  const frac = (lunations + 1) % 1; // 0..1
  return Math.floor(frac * 8 + 0.5) % 8;
}

const indexToPhase: MoonPhase[] = [
  "new",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
  "full",
  "waning-gibbous",
  "last-quarter",
  "waning-crescent",
];

export default function Moon({
  phase = "auto",
  date = new Date(),
  hemisphere = "north",
  size = 250,
  onPress,
  style,
}: Props) {
  const resolvedPhase = useMemo<MoonPhase>(() => {
    if (phase !== "auto") return phase;
    const i = phaseIndexFromDate(date);
    return indexToPhase[i];
  }, [phase, date]);

  const source = phaseToImage[resolvedPhase];
  const flipScaleX = hemisphere === "south" ? -1 : 1;

  const content = (
    <MotiView
      from={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 400 }}
      style={[styles.wrapper, style, { width: size, height: size }]}
    >
      {/* Subtle glow */}
      <View
        style={[
          styles.glow,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
          },
        ]}
      />
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
          transform: [{ scaleX: flipScaleX }],
        }}
      />
    </MotiView>
  );

  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  //
});
