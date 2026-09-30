import { COURSES, getCourseById, getCourseLessons } from "@/data/courses";
import type { Course } from "@/types/course";

export type Recommendation = {
  id: string;
  lessonId: string;
  title: string;
  courseTitle: string;
  courseId: string;
  channelName: string;
  thumbnailUrl: string;
  accent: string;
  durationSeconds: number;
  views: number;
  reason: string;
};

const CATALOG: {
  lessonId: string;
  courseId: string;
  views: number;
  reason: string;
}[] = [
  { lessonId: "lesson-1", courseId: "react-native-mastery", views: 48200, reason: "Start here" },
  { lessonId: "lesson-2", courseId: "react-native-mastery", views: 39100, reason: "Same course" },
  { lessonId: "lesson-3", courseId: "react-native-mastery", views: 27400, reason: "Popular in this course" },
  { lessonId: "lesson-4", courseId: "react-native-mastery", views: 21300, reason: "Popular in this course" },
  { lessonId: "lesson-5", courseId: "react-native-mastery", views: 16800, reason: "Popular in this course" },
  { lessonId: "lesson-6", courseId: "react-native-mastery", views: 12400, reason: "Up next in this course" },
  { lessonId: "lesson-7", courseId: "react-native-mastery", views: 9800, reason: "Up next in this course" },
  { lessonId: "lesson-8", courseId: "react-native-mastery", views: 7600, reason: "Up next in this course" },
  { lessonId: "lesson-9", courseId: "typescript-for-teams", views: 22400, reason: "Because you watched React Native" },
  { lessonId: "lesson-10", courseId: "typescript-for-teams", views: 18900, reason: "Trending this week" },
  { lessonId: "lesson-11", courseId: "typescript-for-teams", views: 15200, reason: "Trending this week" },
  { lessonId: "lesson-12", courseId: "figma-to-production-ui", views: 19800, reason: "Design track" },
  { lessonId: "lesson-13", courseId: "figma-to-production-ui", views: 14300, reason: "Design track" },
  { lessonId: "lesson-14", courseId: "design-systems-at-scale", views: 11700, reason: "Design track" },
  { lessonId: "lesson-15", courseId: "cloud-foundations", views: 20500, reason: "Deployment deep dive" },
  { lessonId: "lesson-16", courseId: "cloud-foundations", views: 13400, reason: "Deployment deep dive" },
  { lessonId: "lesson-17", courseId: "machine-learning-in-practice", views: 26300, reason: "Popular with learners like you" },
  { lessonId: "lesson-18", courseId: "machine-learning-in-practice", views: 17800, reason: "Popular with learners like you" },
  { lessonId: "lesson-19", courseId: "product-analytics-foundations", views: 9200, reason: "Skill gap filler" },
  { lessonId: "lesson-20", courseId: "growth-marketing-systems", views: 8100, reason: "Skill gap filler" },
];

const LESSON_INDEX = new Map<string, { course: Course; title: string; thumbnailUrl: string; durationMinutes: number }>();

for (const course of COURSES) {
  for (const lesson of getCourseLessons(course)) {
    LESSON_INDEX.set(lesson.id, {
      course,
      title: lesson.title,
      thumbnailUrl: lesson.thumbnailUrl,
      durationMinutes: lesson.durationMinutes,
    });
  }
}

export function getRecommendations(
  currentLessonId: string,
  currentCourseId?: string,
  limit = 8,
): Recommendation[] {
  const ranked = CATALOG.map((entry, index) => {
    const lesson = LESSON_INDEX.get(entry.lessonId);
    if (!lesson) return null;

    let score = entry.views / 1000;

    if (lesson.course.id === currentCourseId) score += 12;
    if (entry.lessonId === currentLessonId) score -= 1000;

    return {
      rank: index,
      score,
      entry,
      lesson,
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return ranked
    .sort((a, b) => b.score - a.score || a.rank - b.rank)
    .slice(0, limit)
    .map(({ entry, lesson }) => ({
      id: `${entry.courseId}-${entry.lessonId}`,
      lessonId: entry.lessonId,
      title: lesson.title,
      courseTitle: lesson.course.title,
      courseId: entry.courseId,
      channelName: lesson.course.instructor.name,
      thumbnailUrl: lesson.thumbnailUrl,
      accent: lesson.course.accent,
      durationSeconds: lesson.durationMinutes * 60,
      views: entry.views,
      reason: entry.reason,
    }));
}

export function getCourseName(courseId: string): string {
  return getCourseById(courseId)?.title ?? "";
}
