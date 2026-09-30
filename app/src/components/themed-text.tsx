import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { Fonts, Inter, PlusJakartaSans, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextType =
  | "default"
  | "title"
  | "subtitle"
  | "heading"
  | "body"
  | "small"
  | "smallBold"
  | "label"
  | "price"
  | "code";

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = "default", themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? "text"], fontFamily: Fonts.sans },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Inter.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  body: {
    fontFamily: Inter.regular,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "400",
  },
  title: {
    fontFamily: PlusJakartaSans.bold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: PlusJakartaSans.bold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: PlusJakartaSans.bold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  small: {
    fontFamily: Inter.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  smallBold: {
    fontFamily: Inter.bold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  label: {
    fontFamily: PlusJakartaSans.bold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  price: {
    fontFamily: PlusJakartaSans.bold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: "700" }) ?? "500",
    fontSize: 12,
  },
});
