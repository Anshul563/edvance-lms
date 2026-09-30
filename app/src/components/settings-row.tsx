import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { IconName } from "@/types/profile";

type SettingsRowProps = {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
};

export function SettingsRow({ icon, label, value, onPress, showChevron = false }: SettingsRowProps) {
  const theme = useTheme();
  const interactive = typeof onPress === "function";
  const Icon = icon;

  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: theme.brandMuted }]}>
        <Icon size={16} color={theme.brand} />
      </View>

      <ThemedText type="body" numberOfLines={1} style={styles.label}>
        {label}
      </ThemedText>

      {value ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </ThemedText>
      ) : null}

      {showChevron ? <ChevronRight size={18} color={theme.textSecondary} /> : null}
    </>
  );

  if (!interactive) {
    return <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.large,
  },
  icon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
  },
  label: {
    flex: 1,
  },
  value: {
    maxWidth: "55%",
  },
});
