import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatDuration } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { DailyActivity } from "@/types/profile";

const BAR_HEIGHT = 56;

type ActivityWeekProps = {
  week: DailyActivity[];
};

export function ActivityWeek({ week }: ActivityWeekProps) {
  const theme = useTheme();
  const peak = Math.max(...week.map((day) => day.minutes), 1);
  const total = week.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">This week</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(total)} watched
        </ThemedText>
      </View>

      <View style={styles.chart}>
        {week.map((day, index) => {
          const ratio = day.minutes / peak;
          const height = day.minutes === 0 ? 3 : Math.max(6, ratio * BAR_HEIGHT);

          return (
            <View key={`${day.label}-${index}`} style={styles.column}>
              <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: day.minutes === 0 ? theme.textSecondary : theme.brand,
                    },
                  ]}
                />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {day.label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  column: {
    flex: 1,
    gap: Spacing.one,
  },
  barTrack: {
    height: BAR_HEIGHT,
    justifyContent: "flex-end",
    borderRadius: Radius.small,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: Radius.small,
  },
});
