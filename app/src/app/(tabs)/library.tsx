import type { LucideIcon } from "lucide-react-native";
import { BookOpen, Clock, TrendingUp } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";

import { CourseCard } from "@/components/course-card";
import { CourseListItem } from "@/components/course-list-item";
import { Screen } from "@/components/screen";
import { Section } from "@/components/section";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { COURSES, ENROLLED, getCourseById } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";

export default function LibraryScreen() {
  const theme = useTheme();

  const inProgress = ENROLLED.flatMap((enrollment) => {
    const course = getCourseById(enrollment.courseId);
    return course ? [{ enrollment, course }] : [];
  });

  const enrolledIds = new Set(ENROLLED.map((item) => item.courseId));
  const saved = COURSES.filter((course) => !enrolledIds.has(course.id)).slice(0, 4);
  const totalMinutes = inProgress.reduce((total, item) => total + item.course.durationMinutes, 0);
  const averageProgress =
    inProgress.length === 0
      ? 0
      : inProgress.reduce((total, item) => total + item.enrollment.progress, 0) / inProgress.length;

  const stats: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: BookOpen, label: "Courses", value: `${inProgress.length}` },
    { icon: Clock, label: "Hours", value: `${Math.round(totalMinutes / 60)}` },
    {
      icon: TrendingUp,
      label: "Avg. progress",
      value: `${Math.round(averageProgress * 100)}%`,
    },
  ];

  return (
    <Screen edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">My Library</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pick up where you left off
          </ThemedText>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: theme.backgroundElement }]}>
                <StatIcon size={18} color={theme.brand} />
                <ThemedText type="subtitle">{stat.value}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {stat.label}
                </ThemedText>
              </View>
            );
          })}
        </View>

        <Section title="Continue learning">
          {inProgress.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                You have not enrolled in any courses yet.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.list}>
              {inProgress.map(({ course, enrollment }) => (
                <CourseListItem
                  key={course.id}
                  course={course}
                  progress={enrollment.progress}
                  footnote={enrollment.lastLesson}
                />
              ))}
            </View>
          )}
        </Section>

        <Section title="Saved for later">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}>
            {saved.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </ScrollView>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  statCard: {
    flex: 1,
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  cardRow: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  empty: {
    paddingHorizontal: Spacing.three,
  },
});
