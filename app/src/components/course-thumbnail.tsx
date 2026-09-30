import { Image } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius } from "@/constants/theme";

type CourseThumbnailProps = {
  uri: string;
  accent: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function CourseThumbnail({
  uri,
  accent,
  radius = Radius.medium,
  style,
  children,
}: CourseThumbnailProps) {
  return (
    <View style={[styles.wrapper, { backgroundColor: accent, borderRadius: radius }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
});
