import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatDate } from "@/data/profile";
import { useTheme } from "@/hooks/use-theme";
import type { Achievement } from "@/types/profile";

type AchievementBadgeProps = {
  achievement: Achievement;
};

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const theme = useTheme();
  const earned = achievement.earned;
  const Icon = achievement.icon;

  return (
    <View
      accessible
      accessibilityLabel={`${achievement.title}. ${achievement.description}. ${earned ? "Earned" : "Locked"}`}
      style={[
        styles.card,
        {
          backgroundColor: earned ? theme.backgroundElement : theme.background,
          borderColor: theme.border,
          opacity: earned ? 1 : 0.6,
        },
      ]}>
      <View
        style={[
          styles.icon,
          { backgroundColor: earned ? theme.brandMuted : theme.backgroundSelected },
        ]}>
        <Icon size={20} color={earned ? theme.brand : theme.textSecondary} />
      </View>

      <ThemedText type="smallBold" numberOfLines={1}>
        {achievement.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
        {achievement.description}
      </ThemedText>
      <ThemedText type="small" themeColor={earned ? "success" : "textSecondary"} numberOfLines={1}>
        {earned && achievement.earnedAt ? formatDate(achievement.earnedAt) : "Locked"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
    marginBottom: Spacing.one,
  },
});
