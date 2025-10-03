import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Types */
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

type MoonLocation = {
  /** Last known coordinates, if permission granted */
  coords?: { latitude: number; longitude: number } | null;
  /** Hemisphere guess based on latitude (>=0 -> north) or manually set */
  hemisphere: Hemisphere;
  /** Whether we have location permission */
  permission: Location.PermissionStatus | "unknown";
  /** Request permission (lazy; never auto-requests on mount) */
  requestPermission: () => Promise<Location.PermissionStatus>;
  /** Clear coords (privacy-friendly) */
  clear: () => void;
  /** Toggle hemisphere manually */
  toggleHemisphere: () => void;
  /** Current moon phase */
  moonPhase: MoonPhase;
  /** Is it a new moon? */
  isNewMoon: boolean;
};

const MoonLocationCtx = createContext<MoonLocation | null>(null);
const HEMISPHERE_KEY = "@moonrise_hemisphere";

/** Basic hemisphere inference */
function inferHemisphere(lat?: number | null): Hemisphere {
  if (typeof lat !== "number") return "north";
  return lat >= 0 ? "north" : "south";
}

/** Calculate moon phase */
function calculateMoonPhase(): MoonPhase {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Known new moon: January 11, 2024
  const knownNewMoon = new Date(2024, 0, 11);
  const synodicMonth = 29.53058867; // Days in lunar cycle

  const currentDate = new Date(year, month - 1, day);
  const daysSinceKnownNewMoon =
    (currentDate.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  const cyclePosition = daysSinceKnownNewMoon % synodicMonth;
  const phasePercentage = cyclePosition / synodicMonth;

  if (phasePercentage < 0.0625 || phasePercentage >= 0.9375) return "new";
  if (phasePercentage < 0.1875) return "waxing-crescent";
  if (phasePercentage < 0.3125) return "first-quarter";
  if (phasePercentage < 0.4375) return "waxing-gibbous";
  if (phasePercentage < 0.5625) return "full";
  if (phasePercentage < 0.6875) return "waning-gibbous";
  if (phasePercentage < 0.8125) return "last-quarter";
  return "waning-crescent";
}

/** Provider */
export function MoonLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permission, setPermission] = useState<
    Location.PermissionStatus | "unknown"
  >("unknown");
  const [manualHemisphere, setManualHemisphere] = useState<Hemisphere | null>(
    null
  );

  // Load saved hemisphere preference
  useEffect(() => {
    AsyncStorage.getItem(HEMISPHERE_KEY).then((saved) => {
      if (saved === "north" || saved === "south") {
        setManualHemisphere(saved);
      }
    });
  }, []);

  // Lazy permission request
  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    if (status === Location.PermissionStatus.GRANTED) {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    }
    return status;
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
  }, []);

  const toggleHemisphere = useCallback(() => {
    setManualHemisphere((prev) => {
      const newHemisphere = prev === "north" ? "south" : "north";
      AsyncStorage.setItem(HEMISPHERE_KEY, newHemisphere);
      return newHemisphere;
    });
  }, []);

  // Use manual hemisphere if set, otherwise infer from coords
  const hemisphere = useMemo(() => {
    if (manualHemisphere) return manualHemisphere;
    return inferHemisphere(coords?.latitude ?? null);
  }, [manualHemisphere, coords?.latitude]);

  const moonPhase = useMemo(() => calculateMoonPhase(), []);
  const isNewMoon = moonPhase === "new";

  const value = useMemo<MoonLocation>(
    () => ({
      coords,
      hemisphere,
      permission,
      requestPermission,
      clear,
      toggleHemisphere,
      moonPhase,
      isNewMoon,
    }),
    [
      coords,
      hemisphere,
      permission,
      requestPermission,
      clear,
      toggleHemisphere,
      moonPhase,
      isNewMoon,
    ]
  );

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
