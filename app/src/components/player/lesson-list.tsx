import type { LucideIcon } from "lucide-react-native";
import { Check, CircleHelp, Download, FileText, Play, PlayCircle, Volume2 } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { CourseThumbnail } from "@/components/course-thumbnail";
import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { formatDuration, formatSeconds } from "@/data/courses";
import { useTheme } from "@/hooks/use-theme";
import type { Course, LessonType } from "@/types/course";

const LESSON_ICONS: Record<LessonType, LucideIcon> = {
  video: PlayCircle,
  article: FileText,
  quiz: CircleHelp,
  download: Download,
};

type LessonListProps = {
  course: Course;
  currentLessonId: string;
  completedIds: Set<string>;
  onSelect: (lessonId: string) => void;
};

export function LessonList({ course, currentLessonId, completedIds, onSelect }: LessonListProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {course.sections.map((section) => {
        const sectionMinutes = section.lessons.reduce(
          (total, lesson) => total + lesson.durationMinutes,
          0,
        );

        return (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="smallBold">{section.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {section.lessons.length} lessons · {formatDuration(sectionMinutes)}
              </ThemedText>
            </View>

            <View style={[styles.list, { borderColor: theme.border }]}>
              {section.lessons.map((lesson, index) => {
                const active = lesson.id === currentLessonId;
                const done = completedIds.has(lesson.id) && !active;
                const LessonIcon = LESSON_ICONS[lesson.type];

                return (
                  <Pressable
                    key={lesson.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${lesson.title}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => onSelect(lesson.id)}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 ? [styles.rowDivided, { borderTopColor: theme.border }] : null,
                      active ? { backgroundColor: theme.background } : null,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <CourseThumbnail
                      uri={lesson.thumbnailUrl}
                      accent={course.accent}
                      radius={6}
                      style={styles.thumb}>
                      {lesson.type === "video" ? (
                        <View style={styles.thumbPlay} pointerEvents="none">
                          <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.thumbPlay} pointerEvents="none">
                          <LessonIcon size={14} color="#FFFFFF" />
                        </View>
                      )}

                      <View style={styles.thumbDuration} pointerEvents="none">
                        <ThemedText type="label" style={styles.thumbDurationText}>
                          {formatSeconds(lesson.durationMinutes * 60)}
                        </ThemedText>
                      </View>

                    </CourseThumbnail>

                    <View style={styles.rowText}>
                      <View style={styles.titleRow}>
                        <ThemedText
                          type={active ? "smallBold" : "small"}
                          themeColor={done ? "textSecondary" : active ? "brand" : "text"}
                          style={done ? styles.titleDone : undefined}
                          numberOfLines={2}>
                          {lesson.title}
                        </ThemedText>
                        {done ? <Check size={14} color={theme.success} strokeWidth={3} /> : null}
                      </View>

                      <View style={styles.rowMeta}>
                        {lesson.preview ? (
                          <View style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
                            <ThemedText type="label" themeColor="textSecondary">
                              Preview
                            </ThemedText>
                          </View>
                        ) : null}
                        {active ? (
                          <View style={[styles.tag, { backgroundColor: theme.brand }]}>
                            <ThemedText type="label" style={styles.tagActiveText}>
                              Now playing
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {active ? <Volume2 size={16} color={theme.brand} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.three,
  },
  list: {
    marginHorizontal: Spacing.three,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: 0,
    paddingVertical: Spacing.two,
  },
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 112,
    aspectRatio: 16 / 9,
  },
  thumbPlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDuration: {
    position: "absolute",
    right: 4,
    bottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.small,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  thumbDurationText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 13,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  titleDone: {
    textDecorationLine: "line-through",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  tagActiveText: {
    color: "#FFFFFF",
  },
});
