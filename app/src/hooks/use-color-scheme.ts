import { useColorScheme as useDeviceColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

export function useColorScheme(): ColorScheme {
  return useDeviceColorScheme() === "dark" ? "dark" : "light";
}
