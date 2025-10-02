import ErrorBoundary from "@/components/ErrorBoundry";
import { MoonLocationProvider } from "@/hooks/useMoonLocation";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <MoonLocationProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
          </Stack>
        </MoonLocationProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
