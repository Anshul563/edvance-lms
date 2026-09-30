import { Play } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { ProgressBar } from "@/components/progress-bar";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Course, EnrolledCourse } from "@/types/course";

type ContinueCardProps = {
  course: Course;
  enrollment: EnrolledCourse;
};

export function ContinueCard({ course, enrollment }: ContinueCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${course.title}`}
      onPress={() => router.push({ pathname: "/course/[id]", params: { id: course.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}>
      <CourseThumbnail uri={course.image} accent={course.accent} style={styles.thumbnail}>
        <View style={styles.playButton}>
          <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </CourseThumbnail>

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {course.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          Next: {enrollment.nextLessonTitle}
        </ThemedText>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <ProgressBar value={enrollment.progress} height={5} />
          </View>
          <ThemedText type="smallBold" themeColor="brand">
            {Math.round(enrollment.progress * 100)}%
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 252,
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 118,
  },
  playButton: {
    position: "absolute",
    right: Spacing.two,
    bottom: Spacing.two,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  progressBar: {
    flex: 1,
  },
});
