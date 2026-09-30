import { Image } from "expo-image";
import { router } from "expo-router";
import { Star, Users } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Hairline,
  Radius,
  Spacing,
} from "@/constants/theme";
import { ENROLLED, formatCount, formatPrice } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { Course } from "@/types/course";

type ChannelCourseCardProps = {
  course: Course;
  isLast?: boolean;
};

export function ChannelCourseCard({ course, isLast }: ChannelCourseCardProps) {
  const theme = useTheme();
  const enrolled = ENROLLED.some((item) => item.courseId === course.id);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${course.title} by ${course.instructor.name}, ${formatPrice(course.price)}`}
        onPress={() => router.push({ pathname: "/course/[id]", params: { id: course.id } })}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.9 : 1 },
        ]}>
        <View style={styles.header}>
          <ThemedText type="heading" numberOfLines={2}>
            {course.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {course.subtitle}
          </ThemedText>
        </View>

        <View style={[styles.thumbnail, { backgroundColor: course.accent }]}>
          <Image
            source={{ uri: course.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          {course.price === 0 ? (
            <View style={[styles.ribbon, { backgroundColor: course.accent }]}>
              <ThemedText type="label" style={styles.ribbonText}>
                FREE
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={13} color={theme.star} fill={theme.star} />
              <ThemedText type="label">{course.rating.toFixed(1)}</ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Users size={13} color={theme.textSecondary} />
              <ThemedText type="label" themeColor="textSecondary">
                {formatCount(course.studentCount)}
              </ThemedText>
            </View>
            <ThemedText type="label" themeColor="textSecondary">
              · {course.level}
            </ThemedText>
          </View>

          <View style={styles.buyRow}>
            <ThemedText type="price">{formatPrice(course.price)}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: enrolled }}
              accessibilityLabel={enrolled ? `Continue ${course.title}` : `Enroll in ${course.title}`}
              hitSlop={6}
              onPress={() => router.push({ pathname: "/course/[id]", params: { id: course.id } })}
              style={({ pressed }) => [
                styles.enroll,
                {
                  backgroundColor: enrolled ? theme.backgroundSelected : theme.brand,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText
                type="label"
                style={enrolled ? undefined : styles.enrollLabel}>
                {enrolled ? "Enrolled" : "Enroll"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Pressable>

      {isLast ? null : <View style={[styles.separator, { backgroundColor: theme.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 0,
    overflow: "hidden",
  },
  separator: {
    ...Hairline,
    marginVertical: Spacing.three,
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  ribbon: {
    position: "absolute",
    left: Spacing.one,
    top: Spacing.one,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  ribbonText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  header: {
    gap: 2,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  body: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.half,
  },
  buyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.one,
  },
  enroll: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  enrollLabel: {
    color: "#FFFFFF",
  },
});
