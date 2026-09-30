import { relations, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { channelsTable } from "./channel.schema";
import { coursesTable } from "./course.schema";
import { lessonsTable } from "./lesson.schema";
import { userRoleGrantsTable, usersTable } from "./user.schema";

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "refunded",
  "cancelled"
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "refunded"
]);

//? A purchase grants access. This is the join between a student and a course,
//? one row per (user, course) pair that has ever paid.
export const enrollmentsTable = pgTable(
  "enrollments",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),

    status: enrollmentStatusEnum().notNull().default("active"),

    //? Price actually paid, captured at purchase. Comparing this to
    //? courses.priceInPaise is how you detect a price change after enrolment.
    amountPaidInPaise: integer().notNull(),
    currency: varchar({ length: 3 }).notNull().default("INR"),

    //? Progress. Stored as a whole percent; a course under 100 lessons keeps
    //? this as a coarse gauge. Exact resume position lives in lesson_progress.
    progressPercent: integer().notNull().default(0),
    completedLessons: integer().notNull().default(0),

    enrolledAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    lastAccessedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    completedAt: timestamp({ withTimezone: true, mode: "date" }),

    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    //? A user enrols in a given course once. The (userId, courseId) pair is
    //? the identity, so no surrogate id is needed.
    primaryKey({
      name: "enrollments_pk",
      columns: [table.userId, table.courseId]
    }),

    //? Guard against corrupt progress written by a bad client.
    check(
      "enrollments_progress_percent_check",
      sql`${table.progressPercent} between 0 and 100`
    ),
    check(
      "enrollments_completed_lessons_check",
      sql`${table.completedLessons} >= 0`
    ),

    //? "Continue learning": the student's most recent active course
    index("enrollments_recent_idx")
      .on(table.userId, table.lastAccessedAt)
      .where(sql`${table.status} = 'active'`),

    //? Course page: enrolment count, and the buyer's own enrolment lookup
    index("enrollments_course_idx").on(table.courseId),

    //? Refund sweep: find completed purchases eligible for a refund window
    index("enrollments_completed_at_idx")
      .on(table.completedAt)
      .where(sql`${table.status} = 'completed'`)
  ]
);

//? Payment record. Separate from enrollments because a purchase can be
//? attempted and fail repeatedly before one succeeds, and because refunds
//? and disputes are a lifecycle of their own.
export const ordersTable = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    courseId: uuid()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "restrict" }),

    status: orderStatusEnum().notNull().default("pending"),

    //? Money in minor units (paise/cents). Integer, never float: binary
    //? floating point cannot represent 0.1 exactly, so float money drifts
    //? and equality assertions in tests become unreliable.
    amountInPaise: integer().notNull(),
    currency: varchar({ length: 3 }).notNull().default("INR"),

    //? Discounts and taxes are recorded, not recomputed later. A course price
    //? change must never retroactively alter what a buyer was charged.
    discountInPaise: integer().notNull().default(0),
    taxInPaise: integer().notNull().default(0),

    //? Payment provider bookkeeping. providerRef is their transaction id and
    //? is the hook for webhook reconciliation.
    provider: varchar({ length: 50 }),
    providerRef: varchar({ length: 255 }),

    //? Failure diagnostics, safe to surface in support tooling.
    failureReason: varchar({ length: 500 }),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    paidAt: timestamp({ withTimezone: true, mode: "date" }),
    refundedAt: timestamp({ withTimezone: true, mode: "date" })
  },
  table => [
    //? Idempotency for webhooks. Providers retry aggressively and deliver
    //? duplicates; a unique providerRef makes the retry a no-op instead of
    //? a second order. NULLs are exempt, so pending rows are unconstrained.
    uniqueIndex("orders_provider_ref_unique_idx")
      .on(table.provider, table.providerRef)
      .where(sql`${table.providerRef} is not null`),

    check("orders_amount_check", sql`${table.amountInPaise} >= 0`),
    check(
      "orders_discount_check",
      sql`${table.discountInPaise} >= 0 and ${table.discountInPaise} <= ${table.amountInPaise}`
    ),
    check("orders_tax_check", sql`${table.taxInPaise} >= 0`),

    //? Order history, newest first
    index("orders_user_idx").on(table.userId, table.createdAt),

    //? Course revenue reporting
    index("orders_course_idx").on(table.courseId),

    //? Reconciliation sweep: paid orders with no webhook confirmation
    index("orders_pending_idx")
      .on(table.createdAt)
      .where(sql`${table.status} = 'pending'`)
  ]
);

//? Per-lesson watch state. Kept separate from enrollments: one student
//? generates thousands of these rows over a course, so it must not bloat the
//? row that every "is this enrolled" check reads.
export const lessonProgressTable = pgTable(
  "lesson_progress",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    lessonId: uuid()
      .notNull()
      .references(() => lessonsTable.id, { onDelete: "cascade" }),

    //? Resume position in seconds, so a student returns mid-lesson.
    lastPositionSeconds: integer().notNull().default(0),
    watchedSeconds: integer().notNull().default(0),
    isCompleted: boolean().notNull().default(false),

    startedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    completedAt: timestamp({ withTimezone: true, mode: "date" }),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    primaryKey({
      name: "lesson_progress_pk",
      columns: [table.userId, table.lessonId]
    }),
    check(
      "lesson_progress_position_check",
      sql`${table.lastPositionSeconds} >= 0 and ${table.watchedSeconds} >= 0`
    ),

    //? "Continue where you left off" across a student's whole library
    index("lesson_progress_recent_idx")
      .on(table.userId, table.updatedAt)
      .where(sql`${table.isCompleted} = false`),

    //? Lesson analytics: completion rate per lesson
    index("lesson_progress_lesson_idx").on(table.lessonId)
  ]
);

export type Enrollment = InferSelectModel<typeof enrollmentsTable>;
export type NewEnrollment = InferInsertModel<typeof enrollmentsTable>;
export type Order = InferSelectModel<typeof ordersTable>;
export type NewOrder = InferInsertModel<typeof ordersTable>;
export type LessonProgress = InferSelectModel<typeof lessonProgressTable>;
export type NewLessonProgress = InferInsertModel<typeof lessonProgressTable>;
export type EnrollmentStatus = (typeof enrollmentStatusEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
