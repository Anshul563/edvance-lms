export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonType = "video" | "article" | "quiz" | "download";
export type Quality = "auto" | "480p" | "720p" | "1080p";
export type VideoVariant = Exclude<Quality, "auto">;

export type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
  type: LessonType;
  preview?: boolean;
  thumbnailUrl: string;
  videoUrl: string;
  videoVariants: Record<VideoVariant, string>;
};

export type CourseSection = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Instructor = {
  name: string;
  title: string;
};

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  instructor: Instructor;
  category: string;
  level: CourseLevel;
  rating: number;
  ratingCount: number;
  studentCount: number;
  durationMinutes: number;
  price: number;
  image: string;
  accent: string;
  description: string;
  outcomes: string[];
  sections: CourseSection[];
  updatedAt: string;
};

export type EnrolledCourse = {
  courseId: string;
  progress: number;
  lastLesson: string;
  nextLessonTitle: string;
};
