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
  glideMs?: number; // default 60_000 (1 minute)
  startAnimation?: boolean; // default true

  /** NEW: simple controls to match website behavior */
  startScale?: number; // default 1
  endScale?: number;
  endYOffset?: number;
  /** Tint controls */
  tintColor?: string;
  tintOpacity?: number;

  fadeTintOutAtEnd?: boolean; // <- add this
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

function phaseIndexFromDate(d: Date): number {
  const synodic = 29.530588853;
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
  const days = (d.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const lunations = (days / synodic) % 1;
  const frac = (lunations + 1) % 1;
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
  glideMs = 600_000,
  startAnimation = true,

  // NEW defaults to match your site
  startScale = 1,
  endScale = 0.35,
  endYOffset = -80, // negative = move up

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

  // if (resolvedPhase === "new") {
  //   return null;
  // }

  const screenH = Dimensions.get("window").height;
  const startY = screenH * 0.65;
  const endY = endYOffset;

  const MoonContent = (
    <MotiView
      from={{ opacity: 1, scale: startScale, translateY: startY }}
      animate={{
        opacity: 1,
        scale: hasStarted ? endScale : startScale, // 1 → 0.55
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
