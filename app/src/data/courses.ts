import type {
  Course,
  CourseSection,
  EnrolledCourse,
  Lesson,
  LessonType,
  Quality,
  VideoVariant,
} from "@/types/course";

export const QUALITY_OPTIONS: Quality[] = ["auto", "480p", "720p", "1080p"];

const DEFAULT_VARIANT: VideoVariant = "720p";
const SAMPLE_VIDEO_NAMES = ["bunny", "cat", "corgi", "test"];

function variants(name: string): Record<VideoVariant, string> {
  return {
    "480p": `https://lorem.video/${name}_480p_h264_30fps.mp4`,
    "720p": `https://lorem.video/${name}_720p_h264_30fps.mp4`,
    "1080p": `https://lorem.video/${name}_1080p_h264_30fps.mp4`,
  };
}

export const SAMPLE_VIDEOS: Record<string, Record<VideoVariant, string>> = Object.fromEntries(
  SAMPLE_VIDEO_NAMES.map((name) => [name, variants(name)]),
);

let lessonSeq = 0;

function poster(seed: string) {
  return `https://picsum.photos/seed/${seed}/480/270`;
}

function lesson(title: string, durationMinutes: number, type: LessonType = "video", preview?: boolean): Lesson {
  lessonSeq += 1;
  const videoVariants = SAMPLE_VIDEOS[SAMPLE_VIDEO_NAMES[(lessonSeq - 1) % SAMPLE_VIDEO_NAMES.length]];

  return {
    id: `lesson-${lessonSeq}`,
    title,
    durationMinutes,
    type,
    preview,
    thumbnailUrl: poster(`lesson-${lessonSeq}`),
    videoUrl: videoVariants[DEFAULT_VARIANT],
    videoVariants,
  };
}

export const COURSES: Course[] = [
  {
    id: "react-native-mastery",
    title: "React Native Mastery",
    subtitle: "Build production cross-platform apps with Expo and Expo Router",
    instructor: { name: "Maya Chen", title: "Staff Mobile Engineer" },
    category: "Development",
    level: "intermediate",
    rating: 4.9,
    ratingCount: 2841,
    studentCount: 48210,
    durationMinutes: 612,
    price: 89,
    image: "https://picsum.photos/seed/react-native-mastery/800/450",
    accent: "#3B82F6",
    description:
      "Go from a working prototype to a production-grade mobile app. This course covers navigation, state, animations, native modules, offline support, and shipping to the App Store and Google Play with confidence.",
    outcomes: [
      "Architect scalable navigation with Expo Router",
      "Animate 60fps interfaces with Reanimated",
      "Persist and sync data for offline-first apps",
      "Profile and eliminate jank on real devices",
      "Ship builds with EAS and over-the-air updates",
    ],
    sections: [
      {
        id: "s1",
        title: "Foundations",
        lessons: [
          lesson("Welcome and course roadmap", 6, "video", true),
          lesson("Project setup with Expo", 14),
          lesson("File-based routing deep dive", 22),
          lesson("Styling systems that scale", 18, "article"),
        ],
      },
      {
        id: "s2",
        title: "Motion and interaction",
        lessons: [
          lesson("Reanimated fundamentals", 26),
          lesson("Gesture-driven cards", 31),
          lesson("Shared element transitions", 24),
          lesson("Performance checklist", 12, "article"),
        ],
      },
      {
        id: "s3",
        title: "Ship it",
        lessons: [
          lesson("Handling auth and secure storage", 28),
          lesson("Offline sync patterns", 33),
          lesson("EAS build and submit", 20),
          lesson("Final assessment", 15, "quiz"),
        ],
      },
    ],
    updatedAt: "August 2026",
  },
  {
    id: "figma-to-production-ui",
    title: "Figma to Production UI",
    subtitle: "Turn designs into pixel-perfect, accessible interfaces",
    instructor: { name: "Diego Alvarez", title: "Product Designer & Engineer" },
    category: "Design",
    level: "beginner",
    rating: 4.8,
    ratingCount: 1967,
    studentCount: 31840,
    durationMinutes: 428,
    price: 69,
    image: "https://picsum.photos/seed/figma-to-production-ui/800/450",
    accent: "#EC4899",
    description:
      "A practical bridge between design and engineering. Learn to read Figma files like a developer, extract tokens, and implement layouts that match the design system without guesswork.",
    outcomes: [
      "Translate Figma specs into layout code",
      "Build a reusable design token system",
      "Handle responsive breakpoints gracefully",
      "Meet WCAG color and touch target rules",
    ],
    sections: [
      {
        id: "s1",
        title: "Reading design files",
        lessons: [
          lesson("Auto layout mental models", 16, "video", true),
          lesson("Spacing, sizing, and constraints", 19),
          lesson("Extracting color and type tokens", 21, "article"),
        ],
      },
      {
        id: "s2",
        title: "Implementing interfaces",
        lessons: [
          lesson("Flexbox for designers", 24),
          lesson("Accessible components", 27),
          lesson("Responsive without breakpoint soup", 23),
          lesson("Design review checklist", 10, "download"),
        ],
      },
    ],
    updatedAt: "July 2026",
  },
  {
    id: "typescript-for-teams",
    title: "TypeScript for Teams",
    subtitle: "Write types that catch real bugs and onboard new engineers fast",
    instructor: { name: "Priya Nair", title: "Principal Engineer" },
    category: "Development",
    level: "advanced",
    rating: 4.9,
    ratingCount: 1420,
    studentCount: 22590,
    durationMinutes: 505,
    price: 99,
    image: "https://picsum.photos/seed/typescript-for-teams/800/450",
    accent: "#06B6D4",
    description:
      "Move beyond `any`. This course teaches the type-level thinking used by large engineering teams to model domains, enforce invariants at compile time, and keep refactors safe.",
    outcomes: [
      "Model domains with discriminated unions",
      "Build generic helpers that stay readable",
      "Infer types from runtime schemas",
      "Design APIs that are hard to misuse",
    ],
    sections: [
      {
        id: "s1",
        title: "Type-level thinking",
        lessons: [
          lesson("Structural typing in practice", 18, "video", true),
          lesson("Narrowing and exhaustiveness", 25),
          lesson("Generics that read well", 29),
        ],
      },
      {
        id: "s2",
        title: "Advanced patterns",
        lessons: [
          lesson("Conditional and mapped types", 34),
          lesson("Inference from validators", 31),
          lesson("Migration strategy for legacy code", 22),
          lesson("Knowledge check", 12, "quiz"),
        ],
      },
    ],
    updatedAt: "September 2026",
  },
  {
    id: "product-analytics-foundations",
    title: "Product Analytics Foundations",
    subtitle: "Measure what matters and make decisions with data",
    instructor: { name: "Sofia Rossi", title: "Head of Analytics" },
    category: "Business",
    level: "beginner",
    rating: 4.7,
    ratingCount: 985,
    studentCount: 17420,
    durationMinutes: 356,
    price: 59,
    image: "https://picsum.photos/seed/product-analytics-foundations/800/450",
    accent: "#F59E0B",
    description:
      "A friendly introduction to product analytics. Learn to define metrics, instrument events, build funnels, and run experiments that produce trustworthy results.",
    outcomes: [
      "Choose north-star and guardrail metrics",
      "Design an event tracking plan",
      "Build funnels and retention curves",
      "Interpret A/B tests without fooling yourself",
    ],
    sections: [
      {
        id: "s1",
        title: "Metrics that matter",
        lessons: [
          lesson("The metric tree", 15, "video", true),
          lesson("Vanity vs actionable metrics", 14),
          lesson("North-star workshop", 18, "article"),
        ],
      },
      {
        id: "s2",
        title: "Measurement",
        lessons: [
          lesson("Event tracking plans", 21),
          lesson("Funnels and cohorts", 24),
          lesson("Reading an experiment", 19),
          lesson("Final quiz", 10, "quiz"),
        ],
      },
    ],
    updatedAt: "June 2026",
  },
  {
    id: "design-systems-at-scale",
    title: "Design Systems at Scale",
    subtitle: "Build a component library your whole org can trust",
    instructor: { name: "Diego Alvarez", title: "Product Designer & Engineer" },
    category: "Design",
    level: "intermediate",
    rating: 4.8,
    ratingCount: 1204,
    studentCount: 20130,
    durationMinutes: 462,
    price: 79,
    image: "https://picsum.photos/seed/design-systems-at-scale/800/450",
    accent: "#8B5CF6",
    description:
      "Design systems fail for social reasons as often as technical ones. Learn governance, versioning, accessibility, and adoption strategies that keep a library alive.",
    outcomes: [
      "Define tokens and theming architecture",
      "Version and document components",
      "Automate visual regression testing",
      "Drive adoption across teams",
    ],
    sections: [
      {
        id: "s1",
        title: "Foundations",
        lessons: [
          lesson("What makes a system stick", 17, "video", true),
          lesson("Token architecture", 26),
          lesson("Theming and dark mode", 23),
        ],
      },
      {
        id: "s2",
        title: "Scale",
        lessons: [
          lesson("Versioning strategy", 20),
          lesson("Accessibility as a default", 24),
          lesson("Visual regression pipelines", 28),
          lesson("Adoption playbook", 15, "article"),
        ],
      },
    ],
    updatedAt: "May 2026",
  },
  {
    id: "machine-learning-in-practice",
    title: "Machine Learning in Practice",
    subtitle: "From notebook experiments to reliable production features",
    instructor: { name: "Dr. Aaron Blake", title: "ML Engineer" },
    category: "Data Science",
    level: "advanced",
    rating: 4.9,
    ratingCount: 2210,
    studentCount: 36980,
    durationMinutes: 688,
    price: 119,
    image: "https://picsum.photos/seed/machine-learning-in-practice/800/450",
    accent: "#10B981",
    description:
      "Close the gap between a promising notebook and a dependable feature. Cover data validation, evaluation, deployment, monitoring, and the messy reality of drift.",
    outcomes: [
      "Frame problems as ML tasks",
      "Build reliable evaluation sets",
      "Deploy and version models safely",
      "Monitor for drift and silent failures",
    ],
    sections: [
      {
        id: "s1",
        title: "Problem framing",
        lessons: [
          lesson("When ML is the wrong tool", 18, "video", true),
          lesson("Datasets and leakage", 27),
          lesson("Baselines first", 22),
        ],
      },
      {
        id: "s2",
        title: "Production",
        lessons: [
          lesson("Feature pipelines", 32),
          lesson("Model packaging", 29),
          lesson("Monitoring and drift", 31),
          lesson("Incident postmortem", 21, "article"),
          lesson("Capstone quiz", 14, "quiz"),
        ],
      },
    ],
    updatedAt: "September 2026",
  },
  {
    id: "growth-marketing-systems",
    title: "Growth Marketing Systems",
    subtitle: "Build repeatable channels instead of one-off campaigns",
    instructor: { name: "Lena Fischer", title: "Growth Lead" },
    category: "Marketing",
    level: "intermediate",
    rating: 4.6,
    ratingCount: 742,
    studentCount: 12860,
    durationMinutes: 398,
    price: 65,
    image: "https://picsum.photos/seed/growth-marketing-systems/800/450",
    accent: "#EF4444",
    description:
      "Stop guessing which channel to bet on. Build acquisition loops, define experiments, and create content systems that compound instead of burning out.",
    outcomes: [
      "Map acquisition loops",
      "Design a content engine",
      "Prioritize experiments with ICE",
      "Attribute growth without self-deception",
    ],
    sections: [
      {
        id: "s1",
        title: "Loops and channels",
        lessons: [
          lesson("Loops over funnels", 16, "video", true),
          lesson("Auditing your channels", 19),
          lesson("Positioning that travels", 22, "article"),
        ],
      },
      {
        id: "s2",
        title: "Running the engine",
        lessons: [
          lesson("Content systems", 24),
          lesson("Experiment prioritization", 18),
          lesson("Reporting to leadership", 17),
        ],
      },
    ],
    updatedAt: "August 2026",
  },
  {
    id: "cloud-foundations",
    title: "Cloud Foundations",
    subtitle: "Deploy and operate apps with confidence on modern cloud platforms",
    instructor: { name: "Maya Chen", title: "Staff Mobile Engineer" },
    category: "Development",
    level: "beginner",
    rating: 4.7,
    ratingCount: 1310,
    studentCount: 24970,
    durationMinutes: 444,
    price: 55,
    image: "https://picsum.photos/seed/cloud-foundations/800/450",
    accent: "#0EA5E9",
    description:
      "A beginner-friendly path to the cloud. Understand compute, storage, databases, DNS, and deployments by building and shipping a real service end to end.",
    outcomes: [
      "Reason about compute and storage trade-offs",
      "Deploy containerized services",
      "Configure DNS and TLS correctly",
      "Set up logs, alerts, and backups",
    ],
    sections: [
      {
        id: "s1",
        title: "Core building blocks",
        lessons: [
          lesson("How the cloud is organized", 15, "video", true),
          lesson("Compute options compared", 20),
          lesson("Storage and databases", 23),
        ],
      },
      {
        id: "s2",
        title: "Operating services",
        lessons: [
          lesson("Containers and deployments", 27),
          lesson("DNS, TLS, and domains", 18),
          lesson("Observability basics", 21),
          lesson("Cost sanity check", 12, "article"),
        ],
      },
    ],
    updatedAt: "July 2026",
  },
];

export const ENROLLED: EnrolledCourse[] = [
  {
    courseId: "react-native-mastery",
    progress: 0.62,
    lastLesson: "22 min left",
    nextLessonTitle: "Gesture-driven cards",
  },
  {
    courseId: "product-analytics-foundations",
    progress: 0.28,
    lastLesson: "Starts at 12:40",
    nextLessonTitle: "Event tracking plans",
  },
  {
    courseId: "typescript-for-teams",
    progress: 0.85,
    lastLesson: "Nearly done",
    nextLessonTitle: "Knowledge check",
  },
];

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}

export function getCourseTitle(id: string): string {
  return getCourseById(id)?.title ?? "Course";
}

export function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return `${count}`;
}

export function totalLessons(course: Course): number {
  return course.sections.reduce((total, section) => total + section.lessons.length, 0);
}

export function getCourseLessons(course: Course): Lesson[] {
  return course.sections.flatMap((section) => section.lessons);
}

export type LessonContext = {
  course: Course;
  section: CourseSection;
  lesson: Lesson;
  index: number;
  total: number;
};

export function getLessonContext(lessonId: string): LessonContext | undefined {
  for (const course of COURSES) {
    const lessons = getCourseLessons(course);
    const index = lessons.findIndex((item) => item.id === lessonId);
    if (index === -1) continue;

    const lesson = lessons[index];
    const section = course.sections.find((item) =>
      item.lessons.some((entry) => entry.id === lessonId),
    );
    if (!section) continue;

    return { course, section, lesson, index, total: lessons.length };
  }
  return undefined;
}

export function formatSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const seconds = Math.floor(totalSeconds) % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}
