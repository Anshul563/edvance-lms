import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

type SectionProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: ReactNode;
};

export function Section({ title, actionLabel, onActionPress, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <ThemedText type="subtitle">{title}</ThemedText>
        {actionLabel ? (
          <Pressable accessibilityRole="button" onPress={onActionPress} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="brand">
              {actionLabel}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
});
