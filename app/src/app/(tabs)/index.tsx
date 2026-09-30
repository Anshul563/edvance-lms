import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ContinueCard } from "@/components/continue-card";
import { CourseCard, CourseRow } from "@/components/course-card";
import { Screen } from "@/components/screen";
import { Section } from "@/components/section";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { COURSES, ENROLLED, getCourseById } from "@/data/courses";
import { STANDALONE_VIDEOS } from "@/data/videos";
import { StandaloneVideoList } from "@/components/channel/channel-sections";
import { useTheme } from "@/hooks/use-theme";
import { AppBar } from "@/components/app-bar";

const CATEGORIES = ["Development", "Design", "Business", "Data Science", "Marketing"];

export default function HomeScreen() {
  const theme = useTheme();
  const [category, setCategory] = useState<string>("All");

  const continueItems = ENROLLED.flatMap((enrollment) => {
    const course = getCourseById(enrollment.courseId);
    return course ? [{ enrollment, course }] : [];
  });

  const visibleCourses = useMemo(() => {
    const pool = category === "All" ? COURSES : COURSES.filter((c) => c.category === category);
    return [...pool].sort((a, b) => b.rating - a.rating);
  }, [category]);

  const latestVideos = useMemo(
    () => [...STANDALONE_VIDEOS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 5),
    [],
  );

  const openCourse = (id: string) => router.push({ pathname: "/course/[id]", params: { id } });
  const openVideo = (id: string) => router.push({ pathname: "/video/[videoId]", params: { videoId: id } });

  return (
    <Screen edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <AppBar hasUnread />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {["All", ...CATEGORIES].map((item) => {
            const active = item === category;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item} category`}
                onPress={() => setCategory(item)}
                style={({ pressed }) => [
                  styles.chip,
                  active
                    ? { backgroundColor: theme.brand, opacity: pressed ? 0.8 : 1 }
                    : { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}>
                <ThemedText type="smallBold" style={active ? styles.whiteText : undefined}>
                  {item}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {continueItems.length > 0 ? (
          <Section title="Continue learning">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardRow}>
              {continueItems.map(({ course, enrollment }) => (
                <ContinueCard key={course.id} course={course} enrollment={enrollment} />
              ))}
            </ScrollView>
          </Section>
        ) : null}

        {latestVideos.length > 0 ? (
          <Section title="Latest videos" actionLabel="See all" onActionPress={() => router.push("/search")}>
            <StandaloneVideoList
              videos={latestVideos}
              onOpen={(video) => openVideo(video.id)}
              emptyLabel="No videos yet."
            />
          </Section>
        ) : null}

        <Section
          title={category === "All" ? "Top rated" : category}
          actionLabel="See all"
          onActionPress={() =>
            router.push(
              category === "All"
                ? { pathname: "/search" }
                : { pathname: "/search", params: { category } },
            )
          }>
          <View style={styles.courseList}>
            {visibleCourses.map((course) => (
              <CourseRow key={course.id} course={course} onPress={() => openCourse(course.id)} />
            ))}
          </View>
        </Section>

        <Section title="Trending now">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}>
            {visibleCourses.slice(0, 5).map((course) => (
              <CourseCard key={course.id} course={course} onPress={() => openCourse(course.id)} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  headerText: {
    gap: Spacing.half,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredPressable: {
    paddingHorizontal: Spacing.three,
  },
  featuredImage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  featuredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: Spacing.three,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  featuredPill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  featuredBottom: {
    gap: Spacing.half,
  },
  featuredCategory: {
    color: "#E6F1FD",
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  featuredMetaMuted: {
    color: "rgba(255,255,255,0.85)",
  },
  featuredPrice: {
    color: "#FFFFFF",
    marginLeft: "auto",
  },
  whiteText: {
    color: "#FFFFFF",
  },
  chipRow: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  cardRow: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  courseList: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
});
