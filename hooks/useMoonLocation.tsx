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

export function useMoonLocation() {
  const [coords, setCoords] = useState(BIG_SUR);
  const [usingDefault, setUsingDefault] = useState(true);
  const [permission, setPermission] = useState<
    "undetermined" | "granted" | "denied"
  >("undetermined");
  const [loading, setLoading] = useState(false);

  const hemisphere: Hemisphere = useMemo(
    () => (coords.latitude >= 0 ? "north" : "south"),
    [coords.latitude]
  );

  const requestLocation = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(
        status === Location.PermissionStatus.GRANTED ? "granted" : "denied"
      );
      if (status !== "granted") {
        setUsingDefault(true);
        return false;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setUsingDefault(false);
      return true;
    } catch {
      setUsingDefault(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    coords,
    hemisphere,
    usingDefault,
    permission,
    loading,
    requestLocation,
  };
}

// ------------------
// Context built-in
// ------------------
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
