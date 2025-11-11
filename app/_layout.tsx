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

import { NotificationManager } from "@/components/NotificationManager"; // Add this import
import { useColorScheme } from "@/hooks/useColorScheme";

import { Lora_400Regular, useFonts as useLora } from "@expo-google-fonts/lora";
import {
  Spectral_400Regular,
  Spectral_700Bold,
  useFonts as useSpectral,
} from "@expo-google-fonts/spectral";

import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [spectralLoaded] = useSpectral({
    Spectral_700Bold,
    Spectral_400Regular,
  });
  const [loraLoaded] = useLora({ Lora_400Regular });
  const fontsLoaded = spectralLoaded && loraLoaded;

  useEffect(() => {
    if (fontsLoaded) {
      // Hide splash screen once fonts are loaded
      // The video intro will take over from here
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NotificationManager>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#0C0C0C",
              },
            }}
          >
            <Stack.Screen
              name="video-intro"
              options={{
                animation: "none",
                contentStyle: {
                  backgroundColor: "#0C0C0C",
                },
              }}
            />
            <Stack.Screen
              name="intention"
              options={{
                animation: "none",
                contentStyle: {
                  backgroundColor: "#0C0C0C",
                },
              }}
            />
            <Stack.Screen
              name="index"
              options={{
                animation: "none",
                contentStyle: {
                  backgroundColor: "#0C0C0C",
                },
              }}
            />
            <Stack.Screen
              name="chatboard"
              options={{
                animation: "fade",
                animationDuration: 200,
                contentStyle: {
                  backgroundColor: "#000000",
                },
              }}
            />
            <Stack.Screen name="menu" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </NotificationManager>
    </SafeAreaProvider>
  );
}
