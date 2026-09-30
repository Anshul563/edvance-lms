import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#09090B",
    textSecondary: "#60646C",
    background: "#FFFFFF",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    backgroundElevated: "#FFFFFF",
    border: "#E4E4E7",
    brand: "#A32CC4",
    brandMuted: "#F8EEFA",
    success: "#16A34A",
    warning: "#D97706",
    star: "#F5A623",
  },
  dark: {
    text: "#FAFAFA",
    textSecondary: "#B0B4BA",
    background: "#000000",
    backgroundElement: "#1B1B1E",
    backgroundSelected: "#2E3135",
    backgroundElevated: "#151517",
    border: "#2A2A2E",
    brand: "#C070D7",
    brandMuted: "#310D3B",
    success: "#22C55E",
    warning: "#F59E0B",
    star: "#F5C451",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Theme = (typeof Colors)[keyof typeof Colors];

export const Inter = {
  regular: "Inter18pt-Regular",
  medium: "Inter18pt-Medium",
  semibold: "Inter18pt-SemiBold",
  bold: "Inter18pt-Bold",
} as const;

export const PlusJakartaSans = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semibold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: Inter.regular,
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: Inter.regular,
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: Inter.regular,
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 900;

export const Hairline = { height: 1 } as const;
