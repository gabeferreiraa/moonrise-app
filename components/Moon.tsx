import { MotiView } from "moti";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Easing } from "react-native-reanimated";

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
  phase?: MoonPhase | "auto";
  date?: Date;
  hemisphere?: "north" | "south";
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;

  /** Animation controls */
  glideMs?: number;
  startAnimation?: boolean;

  /** Simple controls to match website behavior */
  startScale?: number;
  endScale?: number;
  endYOffset?: number;

  /** Tint controls */
  tintColor?: string;
  tintOpacity?: number;
  fadeTintOutAtEnd?: boolean;
};

const phaseToImage: Record<MoonPhase, ImageSourcePropType> = {
  new: require("@/assets/images/output/moon_full.png"),
  "waxing-crescent": require("@/assets/images/output/moon_waxing_crescent.png"),
  "first-quarter": require("@/assets/images/output/moon_first_quarter.png"),
  "waxing-gibbous": require("@/assets/images/output/moon_waxing_gibbous.png"),
  full: require("@/assets/images/output/moon_full.png"),
  "waning-gibbous": require("@/assets/images/output/moon_waning_gibbous.png"),
  "last-quarter": require("@/assets/images/output/moon_last_quarter.png"),
  "waning-crescent": require("@/assets/images/output/moon_waning_crescent.png"),
};

// FIXED: Use October 7, 2025 full moon as reference
function phaseIndexFromDate(d: Date): number {
  // Known full moon: October 7, 2025 at 03:48 UTC
  const knownFullMoon = new Date("2025-10-07T03:48:00Z");
  const lunarCycle = 29.53058867;

  const daysFromFullMoon =
    (d.getTime() - knownFullMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate position in cycle relative to full moon (full moon = 0.5 in cycle)
  let cyclePosition = daysFromFullMoon / lunarCycle + 0.5;

  // Normalize to 0-1 range
  cyclePosition = cyclePosition - Math.floor(cyclePosition);
  if (cyclePosition < 0) cyclePosition += 1;

  // Convert to phase index (0-7)
  return Math.floor(cyclePosition * 8 + 0.5) % 8;
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
  glideMs = 600_000,
  startAnimation = true,

  startScale = 1,
  endScale = 0.35,
  endYOffset = -80,

  tintColor = "#e37a2e",
  tintOpacity = 0.25,
  fadeTintOutAtEnd = true,
}: Props) {
  const [hasStarted, setHasStarted] = useState(false);

  const resolvedPhase = useMemo<MoonPhase>(() => {
    if (phase !== "auto") return phase;
    const i = phaseIndexFromDate(date);
    return indexToPhase[i];
  }, [phase, date]);

  const source = phaseToImage[resolvedPhase];
  const flipScaleX = hemisphere === "south" ? -1 : 1;

  useEffect(() => {
    if (startAnimation) {
      const t = setTimeout(() => setHasStarted(true), 100);
      return () => clearTimeout(t);
    }
  }, [startAnimation]);

  const screenH = Dimensions.get("window").height;
  const startY = screenH * 0.65;
  const endY = endYOffset;

  const MoonContent = (
    <MotiView
      from={{ opacity: 1, scale: startScale, translateY: startY }}
      animate={{
        opacity: 1,
        scale: hasStarted ? endScale : startScale,
        translateY: hasStarted ? endY : startY,
      }}
      transition={{
        type: "timing",
        duration: hasStarted ? glideMs : 0,
        easing: Easing.linear,
      }}
      style={[styles.wrapper, style, { width: size, height: size }]}
    >
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

  if (onPress) return <Pressable onPress={onPress}>{MoonContent}</Pressable>;
  return MoonContent;
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
});
