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
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

// Use the EXACT same calculation as Moon.tsx component
function calculateMoonPhase(date: Date = new Date()): {
  phase: MoonPhase;
  illumination: number;
} {
  const synodic = 29.530588853;
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));

  // Use local time, same as Moon.tsx
  const days =
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const lunations = (days / synodic) % 1;
  const frac = (lunations + 1) % 1;

  // Calculate illumination (0 = new moon, 0.5 = full moon)
  let illumination: number;
  if (frac <= 0.5) {
    illumination = frac * 2;
  } else {
    illumination = 2 - frac * 2;
  }

  // Determine phase name using same logic as Moon component
  const phaseIndex = Math.floor(frac * 8 + 0.5) % 8;
  const indexToPhase: MoonPhase[] = [
    "new",
    "waxing_crescent",
    "first_quarter",
    "waxing_gibbous",
    "full",
    "waning_gibbous",
    "last_quarter",
    "waning_crescent",
  ];

  return {
    phase: indexToPhase[phaseIndex],
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
