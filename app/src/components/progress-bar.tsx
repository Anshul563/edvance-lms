import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ProgressBarProps = {
  value: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ value, color, height = 6 }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View style={[styles.track, { height, backgroundColor: theme.backgroundSelected }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color ?? theme.brand, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
