import type { LucideIcon } from "lucide-react-native";

export type IconName = LucideIcon;

export type PlanTier = "free" | "pro";

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  bio: string;
  joinedAt: string;
  plan: PlanTier;
  coursesCompleted: number;
  hoursLearned: number;
  streakDays: number;
  week: DailyActivity[];
};

export type DailyActivity = {
  label: string;
  minutes: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  earned: boolean;
  earnedAt?: string;
};

export type Certificate = {
  id: string;
  courseId: string;
  title: string;
  issuedAt: string;
  credentialId: string;
};
