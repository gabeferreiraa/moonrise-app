import { MotiView } from "moti";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
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
};

const phaseToImage: Record<MoonPhase, ImageSourcePropType | null> = {
  new: null, // No image for new moon (dark moon)
  "waxing-crescent": require("@/assets/images/output/moon_waxing_crescent.png"),
  "first-quarter": require("@/assets/images/output/moon_first_quarter.png"),
  "waxing-gibbous": require("@/assets/images/output/moon_waxing_gibbous.png"),
  full: require("@/assets/images/output/moon_full.png"),
  "waning-gibbous": require("@/assets/images/output/moon_waning_gibbous.png"),
  "last-quarter": require("@/assets/images/output/moon_last_quarter.png"),
  "waning-crescent": require("@/assets/images/output/moon_waning_crescent.png"),
};

// Use September 3, 2024 new moon as reference (same as useMoonLocation)
function phaseIndexFromDate(d: Date): number {
  // Known new moon: September 3, 2024 at 01:55 UTC
  const knownNewMoon = new Date("2024-09-03T01:55:00Z");
  const lunarCycle = 29.53058867;

  const daysFromNewMoon =
    (d.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate position in cycle (0 = new moon, 0.5 = full moon)
  let cyclePosition = (daysFromNewMoon / lunarCycle) % 1;

  // Normalize to 0-1 range
  if (cyclePosition < 0) cyclePosition += 1;

  // Convert to phase index (0-7)
  const phaseIndex = Math.floor(cyclePosition * 8 + 0.5) % 8;

  return phaseIndex;
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
}: Props) {
  const [hasStarted, setHasStarted] = useState(false);

  const resolvedPhase = useMemo<MoonPhase>(() => {
    if (phase !== "auto") {
      return phase;
    }
    const i = phaseIndexFromDate(date);
    const calculatedPhase = indexToPhase[i];
    return calculatedPhase;
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
  const startY = screenH * 0.70;
  const endY = endYOffset;

  // If it's a new moon (no image), return a transparent view so background shows through
  if (source === null) {
    const EmptyMoon = (
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
        style={[
          styles.wrapper,
          style,
          { width: size, height: size, backgroundColor: "transparent" },
        ]}
      >
        {/* Empty transparent view for new moon - allows star background to show */}
        <View style={{ width: size, height: size }} />
      </MotiView>
    );

    if (onPress) return <Pressable onPress={onPress}>{EmptyMoon}</Pressable>;
    return EmptyMoon;
  }

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
