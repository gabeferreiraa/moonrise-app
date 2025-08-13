import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

// Font imports
import {
  Spectral_400Regular,
  Spectral_700Bold,
  useFonts as useSpectral,
} from "@expo-google-fonts/spectral";

import { Lora_400Regular, useFonts as useLora } from "@expo-google-fonts/lora";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [spectralLoaded] = useSpectral({
    Spectral_700Bold,
    Spectral_400Regular,
  });

  const [loraLoaded] = useLora({
    Lora_400Regular,
  });

  const fontsLoaded = spectralLoaded && loraLoaded;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
