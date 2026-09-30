import { AtSign, Globe, MonitorPlay } from "lucide-react-native";

import { COURSES, formatCount, getCourseById, getCourseLessons } from "@/data/courses";
import { getChannelVideoById, getChannelVideoIds } from "@/data/videos";
import type { Channel, ChannelPost, ChannelVideo, StandaloneVideo } from "@/types/instructor";

type ChannelSeed = {
  name: string;
  handle: string;
  bio: string;
  company: string;
  location: string;
  followers: number;
  expertise: string[];
  links: Channel["links"];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SEEDS: ChannelSeed[] = [
  {
    name: "Maya Chen",
    handle: "@mayabuilds",
    bio: "I build mobile apps that stay fast after launch. Ten years shipping React Native at scale, from architecture reviews to the last 5% of animation polish. My courses are the systems I wish someone had handed me earlier.",
    company: "Northwind Labs",
    location: "Vancouver, Canada",
    followers: 184300,
    expertise: ["React Native", "Expo", "TypeScript", "Mobile Architecture", "Performance"],
    links: [
      { label: "Website", handle: "mayachen.dev", icon: Globe },
      { label: "Code", handle: "@mayacodes", icon: AtSign },
      { label: "Channel", handle: "@mayabuilds", icon: MonitorPlay },
    ],
  },
  {
    name: "Diego Alvarez",
    handle: "@diegopixels",
    bio: "Designer who codes and engineer who ships design systems. I spend my days making sure the spacing scale in Figma survives contact with production CSS, and my evenings explaining how to get there.",
    company: "Linear Labs",
    location: "Barcelona, Spain",
    followers: 96200,
    expertise: ["Design Systems", "Figma", "React", "Accessibility", "Motion"],
    links: [
      { label: "Website", handle: "diegoalvarez.design", icon: Globe },
      { label: "Channel", handle: "@diegopixels", icon: MonitorPlay },
    ],
  },
  {
    name: "Priya Nair",
    handle: "@priyanair",
    bio: "Principal engineer focused on TypeScript at the seams: public APIs, migrations, and the type rules that stop a codebase from rotting. Formerly led the platform team at a fintech with 200 engineers.",
    company: "Ledgerline",
    location: "Bengaluru, India",
    followers: 74100,
    expertise: ["TypeScript", "API Design", "Monorepos", "Testing", "Refactoring"],
    links: [
      { label: "Website", handle: "priyanair.dev", icon: Globe },
      { label: "Code", handle: "@priyanair", icon: AtSign },
    ],
  },
  {
    name: "Sofia Rossi",
    handle: "@sofiarossi",
    bio: "Head of analytics. I teach the habit of asking one good question of your data, then the tooling to answer it. Numbers are only useful when they change a decision.",
    company: "Brightpath",
    location: "Milan, Italy",
    followers: 58800,
    expertise: ["Product Analytics", "SQL", "Experimentation", "Dashboards", "Retention"],
    links: [{ label: "Website", handle: "sofiarossi.data", icon: Globe }],
  },
  {
    name: "Dr. Aaron Blake",
    handle: "@aaronml",
    bio: "ML engineer and former research postdoc. I teach the unglamorous 80% of machine learning: data leakage, evaluation that means something, and shipping models that behave under real traffic.",
    company: "Northwind Labs",
    location: "London, UK",
    followers: 132500,
    expertise: ["Machine Learning", "PyTorch", "MLOps", "Evaluation", "LLMs"],
    links: [
      { label: "Website", handle: "aaronblake.ai", icon: Globe },
      { label: "Channel", handle: "@aaronml", icon: MonitorPlay },
      { label: "Feed", handle: "@aaronml", icon: AtSign },
    ],
  },
  {
    name: "Lena Fischer",
    handle: "@lenagrows",
    bio: "Growth lead who is suspicious of virality. I work on loops that compound instead of campaigns that spike, and I document the numbers behind every experiment, win or lose.",
    company: "Loop & Co",
    location: "Berlin, Germany",
    followers: 41300,
    expertise: ["Growth Loops", "Lifecycle", "Referrals", "Analytics", "Experimentation"],
    links: [
      { label: "Website", handle: "lenafischer.growth", icon: Globe },
      { label: "Feed", handle: "@lenagrows", icon: AtSign },
    ],
  },
];

const DETAILS: Record<string, Pick<Channel, "accent" | "avatarUrl" | "bannerUrl">> = {};

for (const course of COURSES) {
  const id = slugify(course.instructor.name);
  const seed = SEEDS.find((item) => item.name === course.instructor.name);

  if (!seed) continue;

  DETAILS[id] ??= {
    accent: course.accent,
    avatarUrl: `https://picsum.photos/seed/${id}/240/240`,
    bannerUrl: `https://picsum.photos/seed/${id}-banner/1200/400`,
  };
}

export const CHANNELS: Channel[] = SEEDS.map((seed) => {
  const id = slugify(seed.name);
  const details = DETAILS[id] ?? {
    accent: "#A32CC4",
    avatarUrl: `https://picsum.photos/seed/${id}/240/240`,
    bannerUrl: `https://picsum.photos/seed/${id}-banner/1200/400`,
  };
  const courses = COURSES.filter((course) => slugify(course.instructor.name) === id);
  const ratingCount = courses.reduce((total, course) => total + course.ratingCount, 0);
  const rating =
    ratingCount === 0
      ? 0
      : courses.reduce((total, course) => total + course.rating * course.ratingCount, 0) /
        ratingCount;

  return {
    id,
    name: seed.name,
    handle: seed.handle,
    title: courses[0]?.instructor.title ?? "",
    accent: details.accent,
    avatarUrl: details.avatarUrl,
    bannerUrl: details.bannerUrl,
    bio: seed.bio,
    company: seed.company,
    location: seed.location,
    students: courses.reduce((total, course) => total + course.studentCount, 0),
    followers: seed.followers,
    rating: Math.round(rating * 10) / 10,
    ratingCount,
    courseIds: courses.map((course) => course.id),
    videoIds: getChannelVideoIds(id),
    expertise: seed.expertise,
    links: seed.links,
    stats: [
      { label: "Students", value: formatCount(courses.reduce((t, c) => t + c.studentCount, 0)) },
      { label: "Courses", value: String(courses.length) },
      { label: "Rating", value: `${(Math.round(rating * 10) / 10).toFixed(1)}` },
    ],
  };
});

export function getChannelById(id: string): Channel | undefined {
  return CHANNELS.find((channel) => channel.id === id);
}

export function getChannelIdByInstructorName(name: string): string {
  return slugify(name);
}

export function getInitials(name: string): string {
  return initialsOf(name);
}

export function channelDetailsFor(name: string): {
  accent: string;
  avatarUrl: string;
  bannerUrl: string;
} {
  const id = slugify(name);
  return (
    DETAILS[id] ?? {
      accent: "#A32CC4",
      avatarUrl: `https://picsum.photos/seed/${id}/240/240`,
      bannerUrl: `https://picsum.photos/seed/${id}-banner/1200/400`,
    }
  );
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatShortMonth(value: string): string {
  const [monthName, year] = value.split(" ");
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex === -1) return value;
  return `${MONTHS_SHORT[monthIndex]} ${year}`;
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function publishedAt(courseUpdatedAt: string, offset: number): string {
  const [monthName, year] = courseUpdatedAt.split(" ");
  const monthIndex = Math.max(0, MONTHS.indexOf(monthName));
  const total = monthIndex * 30 + offset;
  return `${MONTHS[total % MONTHS.length]} ${year}`;
}

const CAPTIONS = [
  "New lesson just went up. This one finally explains the part everyone gets stuck on.",
  "Short one today, but it covers a mistake I see in almost every code review.",
  "Recording the whiteboard version since the last one seemed to click for a few of you.",
  "Follow-up to the previous lesson. Bring your questions to the discussion tab.",
  "Deep dive this week. Grab a coffee, this takes some patience.",
  "Updated for the latest release. Same idea, better tooling.",
];

export function getChannelStandaloneVideos(channelId: string): StandaloneVideo[] {
  const channel = CHANNELS.find((item) => item.id === channelId);
  if (!channel) return [];

  return channel.videoIds
    .map((videoId) => getChannelVideoById(videoId))
    .filter((video): video is StandaloneVideo => video !== undefined);
}

export function getChannelLessonVideos(channelId: string): ChannelVideo[] {
  const channel = CHANNELS.find((item) => item.id === channelId);
  if (!channel) return [];

  const posts = channel.courseIds.flatMap((courseId) => {
    const course = getCourseById(courseId);
    if (!course) return [];

    return getCourseLessons(course).map((lesson, index): ChannelVideo => ({
      id: `${course.id}-${lesson.id}`,
      lessonId: lesson.id,
      courseId: course.id,
      courseTitle: course.title,
      accent: course.accent,
      title: lesson.title,
      thumbnailUrl: lesson.thumbnailUrl,
      durationSeconds: lesson.durationMinutes * 60,
      views: 1200 + (hashSeed(lesson.id) % 88000),
      likes: 40 + (hashSeed(`${lesson.id}-likes`) % 4200),
      comments: 3 + (hashSeed(`${lesson.id}-comments`) % 320),
      publishedAt: publishedAt(course.updatedAt, index * 3 + 2),
      type: lesson.type,
      preview: lesson.preview ?? false,
    }));
  });

  return posts.sort(
    (a, b) => hashSeed(b.lessonId) - hashSeed(a.lessonId) || a.title.localeCompare(b.title),
  );
}

export function getChannelPosts(channelId: string): ChannelPost[] {
  return getChannelLessonVideos(channelId).map((post) => ({
    ...post,
    caption: CAPTIONS[hashSeed(post.lessonId) % CAPTIONS.length],
  }));
}
