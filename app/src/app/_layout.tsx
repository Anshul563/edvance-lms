import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Inter, PlusJakartaSans } from "@/constants/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    [Inter.regular]: require("../../assets/fonts/Inter/static/Inter18pt-Regular.ttf"),
    [Inter.medium]: require("../../assets/fonts/Inter/static/Inter18pt-Medium.ttf"),
    [Inter.semibold]: require("../../assets/fonts/Inter/static/Inter18pt-SemiBold.ttf"),
    [Inter.bold]: require("../../assets/fonts/Inter/static/Inter18pt-Bold.ttf"),
    [PlusJakartaSans.regular]: require("../../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Regular.ttf"),
    [PlusJakartaSans.medium]: require("../../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Medium.ttf"),
    [PlusJakartaSans.semibold]: require("../../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-SemiBold.ttf"),
    [PlusJakartaSans.bold]: require("../../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="lesson/[lessonId]" />
        <Stack.Screen name="video/[videoId]" />
        <Stack.Screen name="instructor/[instructorId]" />
      </Stack>
    </>
  );
}
