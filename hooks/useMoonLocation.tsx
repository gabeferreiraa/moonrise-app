import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";

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
  /** Hemisphere guess based on latitude (>=0 -> north) */
  hemisphere: Hemisphere;
  /** Whether we have location permission */
  permission: Location.PermissionStatus | "unknown";
  /** Request permission (lazy; never auto-requests on mount) */
  requestPermission: () => Promise<Location.PermissionStatus>;
  /** Clear coords (privacy-friendly) */
  clear: () => void;
};

const MoonLocationCtx = createContext<MoonLocation | null>(null);

/** Basic hemisphere inference */
function inferHemisphere(lat?: number | null): Hemisphere {
  if (typeof lat !== "number") return "north";
  return lat >= 0 ? "north" : "south";
}

/** Provider */
export function MoonLocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permission, setPermission] = useState<Location.PermissionStatus | "unknown">("unknown");

  // Lazy permission request
  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    if (status === Location.PermissionStatus.GRANTED) {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: current.coords.latitude, longitude: current.coords.longitude });
    }
    return status;
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
  }, []);

  const hemisphere = useMemo(() => inferHemisphere(coords?.latitude ?? null), [coords?.latitude]);

  const value = useMemo<MoonLocation>(() => ({
    coords,
    hemisphere,
    permission,
    requestPermission,
    clear,
  }), [coords, hemisphere, permission, requestPermission, clear]);

  return <MoonLocationCtx.Provider value={value}>{children}</MoonLocationCtx.Provider>;
}

export function useMoonLocationCtx() {
  const ctx = useContext(MoonLocationCtx);
  if (!ctx) throw new Error("Wrap your tree in <MoonLocationProvider>.");
  return ctx;
}
