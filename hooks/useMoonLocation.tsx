import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

const BIG_SUR = { latitude: 36.2704, longitude: -121.8081 };

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
type PermissionState = "undetermined" | "granted" | "denied";

// Calculate moon phase based on date
function calculateMoonPhase(date: Date = new Date()): {
  phase: MoonPhase;
  illumination: number;
} {
  // Known new moon reference: January 21, 2023 20:53 UTC
  const knownNewMoon = new Date("2023-01-21T20:53:00.000Z");
  const lunarCycle = 29.53058867; // Average lunar cycle in days

  const daysSinceKnownNewMoon =
    (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const currentCycle = daysSinceKnownNewMoon / lunarCycle;
  const phase = currentCycle - Math.floor(currentCycle);

  // Calculate illumination percentage (0 = new moon, 0.5 = full moon)
  let illumination: number;
  if (phase <= 0.5) {
    illumination = phase * 2; // 0 to 1
  } else {
    illumination = 2 - phase * 2; // 1 to 0
  }

  // Determine phase name
  let phaseName: MoonPhase;
  if (phase < 0.033 || phase > 0.967) {
    phaseName = "new";
  } else if (phase < 0.216) {
    phaseName = "waxing_crescent";
  } else if (phase < 0.284) {
    phaseName = "first_quarter";
  } else if (phase < 0.466) {
    phaseName = "waxing_gibbous";
  } else if (phase < 0.533) {
    phaseName = "full";
  } else if (phase < 0.716) {
    phaseName = "waning_gibbous";
  } else if (phase < 0.784) {
    phaseName = "last_quarter";
  } else {
    phaseName = "waning_crescent";
  }

  return { phase: phaseName, illumination };
}

export function useMoonLocation() {
  const [coords, setCoords] = useState(BIG_SUR);
  const [usingDefault, setUsingDefault] = useState(true);
  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const [loading, setLoading] = useState(false);
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

  // We're foreground-only; keep this for API parity
  const bgRunning = false;

  const hemisphere: Hemisphere = useMemo(
    () => (coords.latitude >= 0 ? "north" : "south"),
    [coords.latitude]
  );

  const isNewMoon = useMemo(
    () => moonPhaseData.phase === "new",
    [moonPhaseData.phase]
  );

  /** Foreground one-shot fetch (Expo Go / expo-location) */
  const requestOnce = useCallback(async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setPermission(granted ? "granted" : "denied");

      if (!granted) {
        setUsingDefault(true);
        return false;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });

      if (!pos?.coords) throw new Error("Invalid position data");

      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setUsingDefault(false);
      return true;
    } catch (e) {
      console.error("[Location] requestOnce failed:", e);
      setUsingDefault(true);
      // If we got here, permission might still be undetermined or denied;
      // keep whatever we have unless we know it's denied.
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** No-op stubs to keep your old API intact */
  const startBackground = useCallback(async () => {
    // Foreground-only by design
    return false;
  }, []);
  const stopBackground = useCallback(async () => {
    return false;
  }, []);

  return {
    coords,
    hemisphere,
    usingDefault,
    permission,
    loading,
    bgRunning,
    moonPhase: moonPhaseData.phase,
    moonIllumination: moonPhaseData.illumination,
    isNewMoon,
    requestOnce, // ← call this from your "Use My Location" menu item
    startBackground, // no-op
    stopBackground, // no-op
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
