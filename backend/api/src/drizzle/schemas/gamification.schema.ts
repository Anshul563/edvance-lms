import { isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { coursesTable } from "./course.schema";
import { usersTable } from "./user.schema";

//? Achievement definitions. Seeded by migrations/data scripts, not user
//? input: the set of earnable badges ("First steps", "Seven day streak") is
//? product content with stable slugs the client maps to icons.
export const achievementsTable = pgTable(
  "achievements",
  {
    id: uuid().primaryKey().defaultRandom(),

    //? Stable machine key ("streak-7"). The app maps slugs to icons, so a
    //? rename of the display title never breaks the client.
    slug: varchar({ length: 100 }).notNull(),

    title: varchar({ length: 120 }).notNull(),
    description: varchar({ length: 500 }).notNull(),

    //? Weight for levelling/progress bars. XP is cosmetic here, not currency:
    //? it never converts to anything purchasable.
    xp: integer().notNull().default(0),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [uniqueIndex("achievements_slug_unique_idx").on(table.slug)]
);

//? Earned badges. One row per (user, achievement): earning twice is
//? impossible, which keeps badge counts exact.
export const userAchievementsTable = pgTable(
  "user_achievements",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    achievementId: uuid()
      .notNull()
      .references(() => achievementsTable.id, { onDelete: "cascade" }),

    earnedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    primaryKey({
      name: "user_achievements_pk",
      columns: [table.userId, table.achievementId]
    }),

    //? Profile badge shelf, newest earns first
    index("user_achievements_user_idx").on(table.userId, table.earnedAt)
  ]
);

//? Course completion certificates. Issued once per completed enrollment:
//? the credential id is the verifiable handle (shown on the profile and
//? shareable), while the row pins exactly what was completed and when.
export const certificatesTable = pgTable(
  "certificates",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "restrict" }),

    //? Snapshot of the course title at issue time. Courses can be renamed;
    //? the certificate must keep reading what the learner actually finished.
    courseTitle: varchar({ length: 255 }).notNull(),

    //? Public verification handle, e.g. EDV-2026-XXXX. Unique and unguessable
    //? enough to be shared on a resume without leaking sequential ids.
    credentialId: varchar({ length: 64 }).notNull(),

    issuedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    uniqueIndex("certificates_credential_unique_idx").on(table.credentialId),

    //? One certificate per (user, course): re-completing never mints a second.
    uniqueIndex("certificates_user_course_unique_idx").on(
      table.userId,
      table.courseId
    ),

    //? Profile certificates shelf, newest first
    index("certificates_user_idx").on(table.userId, table.issuedAt)
  ]
);

//? Daily learning minutes. One row per (user, day): the activity-week chart,
//? streak counters and "hours learned" all roll up from here instead of
//? scanning watch/progress rows. Minutes accumulate; the check guards bad
//? client writes.
export const learningActivityTable = pgTable(
  "learning_activity",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    //? Calendar day (UTC). `date`, not timestamp: streak math is day-granular,
    //? and a date column makes the uniqueness constraint trivial.
    day: date({ mode: "date" }).notNull(),

    minutes: integer().notNull().default(0),

    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    primaryKey({
      name: "learning_activity_pk",
      columns: [table.userId, table.day]
    }),
    check("learning_activity_minutes_check", sql`${table.minutes} >= 0`),

    //? Streak + activity-week queries: a user's recent days, newest first
    index("learning_activity_user_day_idx")
      .on(table.userId, table.day)
      .where(sql`${table.minutes} > 0`)
  ]
);

export type Achievement = InferSelectModel<typeof achievementsTable>;
export type NewAchievement = InferInsertModel<typeof achievementsTable>;
export type UserAchievement = InferSelectModel<typeof userAchievementsTable>;
export type NewUserAchievement = InferInsertModel<typeof userAchievementsTable>;
export type Certificate = InferSelectModel<typeof certificatesTable>;
export type NewCertificate = InferInsertModel<typeof certificatesTable>;
export type LearningActivity = InferSelectModel<typeof learningActivityTable>;
export type NewLearningActivity = InferInsertModel<
  typeof learningActivityTable
>;
