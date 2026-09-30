import { Star, Users } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatCount, formatPrice } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { Course } from "@/types/course";

type CourseCardProps = {
  course: Course;
  width?: number;
  onPress?: () => void;
};

export function CourseCard({ course, width = 248, onPress }: CourseCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${course.title} by ${course.instructor.name}`}
      onPress={onPress ?? (() => router.push({ pathname: "/course/[id]", params: { id: course.id } }))}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
      ]}>
      <CourseThumbnail uri={course.image} accent={course.accent} style={styles.thumbnail}>
        <View style={[styles.levelBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
          <ThemedText type="label" style={styles.levelText}>
            {course.level}
          </ThemedText>
        </View>
      </CourseThumbnail>

      <View style={styles.body}>
        <ThemedText type="heading" numberOfLines={2} style={styles.title}>
          {course.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {course.instructor.name}
        </ThemedText>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Star size={13} color={theme.star} fill={theme.star} />
            <ThemedText type="smallBold">{course.rating.toFixed(1)}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Users size={13} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {formatCount(course.studentCount)}
            </ThemedText>
          </View>
          <ThemedText type="price" style={styles.price}>
            {formatPrice(course.price)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

type CourseRowProps = {
  course: Course;
  onPress?: () => void;
};

export function CourseRow({ course, onPress }: CourseRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${course.title} by ${course.instructor.name}, ${course.rating.toFixed(1)} stars, ${formatPrice(course.price)}`}
      onPress={onPress ?? (() => router.push({ pathname: "/course/[id]", params: { id: course.id } }))}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <CourseThumbnail uri={course.image} accent={course.accent} style={styles.rowThumb}>
        <View style={[styles.rowLevelBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
          <ThemedText type="label" style={styles.levelText}>
            {course.level}
          </ThemedText>
        </View>
      </CourseThumbnail>

      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={2} style={styles.rowTitle}>
          {course.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.rowSubtitle}>
          {course.instructor.name}
        </ThemedText>

        <View style={styles.rowMeta}>
          <View style={styles.metaItem}>
            <Star size={13} color={theme.star} fill={theme.star} />
            <ThemedText type="smallBold">{course.rating.toFixed(1)}</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
            {formatCount(course.studentCount)} students
          </ThemedText>
          <ThemedText type="smallBold" themeColor="brand" style={styles.price}>
            {formatPrice(course.price)}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 134,
  },
  levelBadge: {
    position: "absolute",
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "center",
  },
  rowThumb: {
    width: 148,
    aspectRatio: 16 / 9,
    borderRadius: Radius.medium,
    overflow: "hidden",
  },
  rowLevelBadge: {
    position: "absolute",
    left: Spacing.one,
    bottom: Spacing.one,
    paddingHorizontal: Spacing.one + 1,
    paddingVertical: 1,
    borderRadius: Radius.small,
  },
  metaText: {
    flexShrink: 1,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    minHeight: 48,
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
  price: {
    marginLeft: "auto",
  },
});
