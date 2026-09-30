import { Flag, Flame, Globe2, Ribbon, Clock, Trophy } from "lucide-react-native";

import type { Achievement, Certificate, Profile } from "@/types/profile";

export const PROFILE: Profile = {
  id: "user-1",
  firstName: "Anshul",
  lastName: "Shakya",
  username: "anshul_84",
  email: "anshul@example.com",
  bio: "Building mobile products and learning in public. Currently deep into React Native and TypeScript.",
  joinedAt: "2025-11-04",
  plan: "pro",
  coursesCompleted: 6,
  hoursLearned: 42,
  streakDays: 12,
  week: [
    { label: "M", minutes: 35 },
    { label: "T", minutes: 0 },
    { label: "W", minutes: 52 },
    { label: "T", minutes: 18 },
    { label: "F", minutes: 41 },
    { label: "S", minutes: 0 },
    { label: "S", minutes: 27 },
  ],
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-course",
    title: "First steps",
    description: "Finished your first course",
    icon: Flag,
    earned: true,
    earnedAt: "2025-12-19",
  },
  {
    id: "streak-7",
    title: "Seven day streak",
    description: "Learned every day for a week",
    icon: Flame,
    earned: true,
    earnedAt: "2026-01-08",
  },
  {
    id: "ten-hours",
    title: "Ten hours in",
    description: "Spent ten hours watching lessons",
    icon: Clock,
    earned: true,
    earnedAt: "2026-02-02",
  },
  {
    id: "polyglot",
    title: "Polyglot",
    description: "Studied courses in three categories",
    icon: Globe2,
    earned: true,
    earnedAt: "2026-03-27",
  },
  {
    id: "streak-30",
    title: "Thirty day streak",
    description: "One month without missing a day",
    icon: Ribbon,
    earned: false,
  },
  {
    id: "finisher",
    title: "Finisher",
    description: "Complete every course you start",
    icon: Trophy,
    earned: false,
  },
];

export const CERTIFICATES: Certificate[] = [
  {
    id: "cert-1",
    courseId: "typescript-for-teams",
    title: "TypeScript for Teams",
    issuedAt: "2026-03-14",
    credentialId: "EDV-4F2A-91C7",
  },
  {
    id: "cert-2",
    courseId: "sql-for-analysts",
    title: "SQL for Analysts",
    issuedAt: "2026-01-22",
    credentialId: "EDV-7B10-3DE4",
  },
  {
    id: "cert-3",
    courseId: "product-analytics-foundations",
    title: "Product Analytics Foundations",
    issuedAt: "2025-12-19",
    credentialId: "EDV-1C58-6A02",
  },
];

const MONTHS = [
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

function toDate(value: string): Date | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatMonthYear(value: string): string {
  const date = toDate(value);

  if (!date) return "";

  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDate(value: string): string {
  const date = toDate(value);

  if (!date) return "";

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
