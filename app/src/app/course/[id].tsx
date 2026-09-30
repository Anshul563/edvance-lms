import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { ProgressBar } from "@/components/progress-bar";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import {
  ENROLLED,
  formatCount,
  formatDuration,
  formatPrice,
  getCourseById,
  getCourseLessons,
  totalLessons,
} from "@/data/courses";
import { getChannelIdByInstructorName } from "@/data/instructors";
import { useTheme } from "@/hooks/use-theme";
import type { LucideIcon } from "lucide-react-native";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clock,
  Download,
  FileText,
  Layers,
  Play,
  PlayCircle,
  Share2,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react-native";

import type { LessonType } from "@/types/course";

const LESSON_ICONS: Record<LessonType, LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  quiz: CircleHelp,
  download: Download,
};

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const course = getCourseById(id ?? "");
  const enrollment = ENROLLED.find((item) => item.courseId === id);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    course?.sections[0] ? { [course.sections[0].id]: true } : {},
  );

  if (!course) {
    return (
      <View
        style={[
          styles.fallback,
          { backgroundColor: theme.background, paddingTop: insets.top + Spacing.five },
        ]}>
        <TriangleAlert size={40} color={theme.textSecondary} />
        <ThemedText type="heading">Course not found</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="brand">
            Go back
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  const stats: { icon: LucideIcon; value: string; label: string; tone?: "star" }[] = [
    { icon: Star, value: course.rating.toFixed(1), label: "Rating", tone: "star" },
    {
      icon: Users,
      value: formatCount(course.studentCount),
      label: "Students",
    },
    {
      icon: Clock,
      value: formatDuration(course.durationMinutes),
      label: "Duration",
    },
    { icon: Layers, value: `${totalLessons(course)}`, label: "Lessons" },
  ];

  const courseLessons = getCourseLessons(course);
  const resumeLesson =
    (enrollment
      ? courseLessons.find((item) => item.title === enrollment.nextLessonTitle)
      : undefined) ?? courseLessons[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <CourseThumbnail uri={course.image} accent={course.accent} radius={0} style={styles.hero}>
          <View style={[styles.heroOverlay, { paddingTop: insets.top + Spacing.two }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.circleButton}>
              <ChevronLeft size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share course"
              style={styles.circleButton}>
              <Share2 size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </CourseThumbnail>

        <View style={styles.content}>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: theme.brandMuted }]}>
              <ThemedText type="label" themeColor="brand">
                {course.category}
              </ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="label" themeColor="textSecondary">
                {course.level}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="title">{course.title}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {course.subtitle}
          </ThemedText>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open channel for ${course.instructor.name}`}
            onPress={() =>
              router.push({
                pathname: "/instructor/[instructorId]",
                params: { instructorId: getChannelIdByInstructorName(course.instructor.name) },
              })
            }
            style={({ pressed }) => [styles.instructorRow, { opacity: pressed ? 0.7 : 1 }]}>
            <View style={[styles.avatar, { backgroundColor: course.accent }]}>
              <ThemedText type="heading" style={styles.avatarText}>
                {course.instructor.name.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.instructorText}>
              <ThemedText type="smallBold">{course.instructor.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {course.instructor.title}
              </ThemedText>
            </View>
            <ChevronRight size={16} color={theme.textSecondary} />
          </Pressable>

          <View style={styles.statsRow}>
            {stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <View
                  key={stat.label}
                  style={[styles.statCard, { backgroundColor: theme.backgroundElement }]}>
                  <StatIcon size={16} color={stat.tone === "star" ? theme.star : theme.brand} />
                  <ThemedText type="smallBold">{stat.value}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {stat.label}
                  </ThemedText>
                </View>
              );
            })}
          </View>

          {enrollment ? (
            <View style={[styles.enrolledCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.enrolledHeader}>
                <ThemedText type="smallBold">Your progress</ThemedText>
                <ThemedText type="smallBold" themeColor="brand">
                  {Math.round(enrollment.progress * 100)}%
                </ThemedText>
              </View>
              <ProgressBar value={enrollment.progress} />
              <ThemedText type="small" themeColor="textSecondary">
                Next up: {enrollment.nextLessonTitle}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.block}>
            <ThemedText type="subtitle">What you&apos;ll learn</ThemedText>
            <View style={styles.outcomes}>
              {course.outcomes.map((outcome) => (
                <View key={outcome} style={styles.outcomeRow}>
                  <Check size={18} color={theme.success} strokeWidth={2.5} />
                  <ThemedText type="body" style={styles.outcomeText}>
                    {outcome}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <ThemedText type="subtitle">About this course</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {course.description}
            </ThemedText>
          </View>

          <View style={styles.block}>
            <View style={styles.curriculumHeader}>
              <ThemedText type="subtitle">Curriculum</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {course.sections.length} sections · {totalLessons(course)} lessons
              </ThemedText>
            </View>

            {course.sections.map((section) => {
              const isOpen = expanded[section.id] ?? false;
              const sectionMinutes = section.lessons.reduce(
                (total, lesson) => total + lesson.durationMinutes,
                0,
              );

              return (
                <View
                  key={section.id}
                  style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setExpanded((prev) => ({ ...prev, [section.id]: !isOpen }))
                    }
                    style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderText}>
                      <ThemedText type="smallBold">{section.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {section.lessons.length} lessons · {formatDuration(sectionMinutes)}
                      </ThemedText>
                    </View>
                    {isOpen ? (
                      <ChevronUp size={18} color={theme.textSecondary} />
                    ) : (
                      <ChevronDown size={18} color={theme.textSecondary} />
                    )}
                  </Pressable>

                  {isOpen ? (
                    <View style={styles.lessonList}>
                      {section.lessons.map((lesson) => {
                        const LessonIcon = LESSON_ICONS[lesson.type];
                        return (
                        <Pressable
                          key={lesson.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Play ${lesson.title}`}
                          onPress={() =>
                            router.push({
                              pathname: "/lesson/[lessonId]",
                              params: { lessonId: lesson.id },
                            })
                          }
                          style={styles.lessonRow}>
                          <LessonIcon size={18} color={theme.textSecondary} />
                          <ThemedText type="small" style={styles.lessonTitle}>
                            {lesson.title}
                          </ThemedText>
                          {lesson.preview ? (
                            <View style={[styles.previewTag, { backgroundColor: theme.brandMuted }]}>
                              <ThemedText type="label" themeColor="brand">
                                Preview
                              </ThemedText>
                            </View>
                          ) : null}
                          <ThemedText type="small" themeColor="textSecondary">
                            {lesson.durationMinutes}m
                          </ThemedText>
                          <PlayCircle size={18} color={theme.brand} />
                        </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.three,
          },
        ]}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Full access
          </ThemedText>
          <ThemedText type="price">{formatPrice(course.price)}</ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (resumeLesson) {
              router.push({
                pathname: "/lesson/[lessonId]",
                params: { lessonId: resumeLesson.id },
              });
            }
          }}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: theme.brand, opacity: pressed ? 0.85 : 1 },
          ]}>
          {enrollment ? (
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <BookOpen size={18} color="#FFFFFF" />
          )}
          <ThemedText type="smallBold" style={styles.ctaText}>
            {enrollment ? "Continue learning" : "Enroll now"}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  hero: {
    width: "100%",
    height: 260,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.three,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  tagRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  instructorText: {
    flex: 1,
  },
  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
  },
  enrolledCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  enrolledHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  block: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  outcomes: {
    gap: Spacing.two,
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  outcomeText: {
    flex: 1,
  },
  curriculumHeader: {
    gap: Spacing.half,
  },
  sectionCard: {
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.three,
  },
  sectionHeaderText: {
    gap: Spacing.half,
    flex: 1,
  },
  lessonList: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  lessonTitle: {
    flex: 1,
  },
  previewTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    height: 48,
    borderRadius: Radius.pill,
  },
  ctaText: {
    color: "#FFFFFF",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
