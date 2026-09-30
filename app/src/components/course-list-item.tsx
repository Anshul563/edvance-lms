import { ChevronRight, Clock, Star } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { ProgressBar } from "@/components/progress-bar";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatDuration, formatPrice } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { Course } from "@/types/course";

type CourseListItemProps = {
  course: Course;
  progress?: number;
  footnote?: string;
};

export function CourseListItem({ course, progress, footnote }: CourseListItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${course.title} by ${course.instructor.name}`}
      onPress={() => router.push({ pathname: "/course/[id]", params: { id: course.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}>
      <CourseThumbnail
        uri={course.image}
        accent={course.accent}
        radius={Radius.medium}
        style={styles.thumbnail}
      />

      <View style={styles.content}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {course.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {course.instructor.name}
        </ThemedText>

        {progress === undefined ? (
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={12} color={theme.star} fill={theme.star} />
              <ThemedText type="small" themeColor="textSecondary">
                {course.rating.toFixed(1)}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatDuration(course.durationMinutes)}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" themeColor="brand">
              {formatPrice(course.price)}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.progressBlock}>
            <ProgressBar value={progress} height={5} />
            <View style={styles.progressMeta}>
              <ThemedText type="small" themeColor="textSecondary">
                {footnote ?? `${Math.round(progress * 100)}% complete`}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="brand">
                {Math.round(progress * 100)}%
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      <ChevronRight size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.large,
  },
  thumbnail: {
    width: 104,
    height: 72,
  },
  content: {
    flex: 1,
    gap: Spacing.half,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
  progressBlock: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  progressMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
