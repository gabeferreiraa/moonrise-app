import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Hemisphere = "north" | "south";
export type MoonPhase =
  | "new"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

// Use the EXACT same calculation as Moon.tsx component
function calculateMoonPhase(date: Date = new Date()): {
  phase: MoonPhase;
  illumination: number;
} {
  // Using a well-known new moon as reference
  // September 3, 2024 at 01:55 UTC was a new moon
  const knownNewMoon = new Date("2024-09-03T01:55:00Z");
  const lunarCycle = 29.53058867;

  const daysFromNewMoon =
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate position in cycle (0 = new moon, 0.5 = full moon)
  let cyclePosition = (daysFromNewMoon / lunarCycle) % 1;

  // Normalize to 0-1 range
  if (cyclePosition < 0) cyclePosition += 1;

  // Convert to phase index (0-7)
  const phaseIndex = Math.floor(cyclePosition * 8) % 8;

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

  const phase = indexToPhase[phaseIndex];

  // Calculate illumination based on cycle position
  let illumination: number;
  if (cyclePosition <= 0.5) {
    illumination = cyclePosition * 2;
  } else {
    illumination = 2 - cyclePosition * 2;
  }

  console.log(`Moon calculation for ${date.toDateString()}:`, {
    daysFromNewMoon: daysFromNewMoon.toFixed(2),
    cyclePosition: cyclePosition.toFixed(3),
    phaseIndex,
    phase,
    illumination: illumination.toFixed(2),
    debug: `October 20, 2024 should be ~47 days from Sep 3, which is ~1.59 cycles`,
  });

  return {
    phase,
    illumination,
  };
}

export function useMoonLocation() {
  // Start with northern hemisphere by default
  const [hemisphere, setHemisphere] = useState<Hemisphere>("north");

  const [moonPhaseData, setMoonPhaseData] = useState(() =>
    calculateMoonPhase()
  );

  // Update moon phase every hour
  useEffect(() => {
    const updateMoonPhase = () => {
      setMoonPhaseData(calculateMoonPhase());
    };

    // Update immediately
    updateMoonPhase();

    // Update every hour
    const interval = setInterval(updateMoonPhase, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const isNewMoon = useMemo(
    () => moonPhaseData.phase === "new",
    [moonPhaseData.phase]
  );

  // Toggle between north and south
  const toggleHemisphere = useCallback(() => {
    setHemisphere((prev) => (prev === "north" ? "south" : "north"));
  }, []);

  return {
    hemisphere,
    moonPhase: moonPhaseData.phase,
    moonIllumination: moonPhaseData.illumination,
    isNewMoon,
    toggleHemisphere,
  };
}

type Ctx = ReturnType<typeof useMoonLocation>;
const MoonLocationCtx = createContext<Ctx | null>(null);

export function MoonLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useMoonLocation();
  return (
    <MoonLocationCtx.Provider value={value}>
      {children}
    </MoonLocationCtx.Provider>
  );
}

export function useMoonLocationCtx() {
  const ctx = useContext(MoonLocationCtx);
  if (!ctx) throw new Error("Wrap your tree in <MoonLocationProvider>.");
  return ctx;
}
