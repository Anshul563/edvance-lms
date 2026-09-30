import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { MaxContentWidth } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ScreenProps = PropsWithChildren<{
  edges?: readonly Edge[];
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, edges = ["top"], padded = false, style }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: theme.background }, style]}>
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  padded: {
    paddingHorizontal: 16,
  },
});
