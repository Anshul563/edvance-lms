import type { LucideIcon } from "lucide-react-native";
import type { VideoVariant } from "@/types/course";

export type ChannelLink = {
  label: string;
  handle: string;
  icon: LucideIcon;
};

export type Channel = {
  id: string;
  name: string;
  handle: string;
  title: string;
  accent: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  company: string;
  location: string;
  students: number;
  followers: number;
  rating: number;
  ratingCount: number;
  courseIds: string[];
  videoIds: string[];
  expertise: string[];
  links: ChannelLink[];
  stats: { label: string; value: string }[];
};

export type StandaloneVideo = {
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoVariants: Record<VideoVariant, string>;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
};

export type ChannelVideo = {
  id: string;
  lessonId: string;
  courseId: string;
  courseTitle: string;
  accent: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  type: "video" | "article" | "quiz" | "download";
  preview: boolean;
};

export type ChannelPost = ChannelVideo & {
  caption: string;
};
