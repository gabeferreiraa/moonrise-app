// hooks/useMoonLocation.ts
import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const BIG_SUR = { latitude: 36.2704, longitude: -121.8081 };

export type Hemisphere = "north" | "south";
type PermissionState = "undetermined" | "granted" | "denied";

export function useMoonLocation() {
  const [coords, setCoords] = useState(BIG_SUR);
  const [usingDefault, setUsingDefault] = useState(true);
  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const [loading, setLoading] = useState(false);

  // We’re foreground-only; keep this for API parity
  const bgRunning = false;

  const hemisphere: Hemisphere = useMemo(
    () => (coords.latitude >= 0 ? "north" : "south"),
    [coords.latitude]
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
      // keep whatever we have unless we know it’s denied.
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
    requestOnce, // ← call this from your “Use My Location” menu item
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
