import { and, eq, isNull } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { channelsTable } from "./channel.schema";
import { usersTable } from "./user.schema";

//? Editorial workflow, not authorisation. Who may publish is a role question.
export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "in_review",
  "published",
  "archived"
]);

export const courseVisibilityEnum = pgEnum("course_visibility", [
  "public",
  "unlisted",
  "private"
]);

export const courseLevelEnum = pgEnum("course_level", [
  "beginner",
  "intermediate",
  "advanced",
  "all_levels"
]);

export const coursesTable = pgTable(
  "courses",
  {
    id: uuid().primaryKey().defaultRandom(),

    //? Ownership. Courses live on a channel, not on a user, so a creator can
    //? transfer a course between channels without rewriting every lesson.
    channelId: uuid()
      .notNull()
      .references(() => channelsTable.id, { onDelete: "cascade" }),

    //? Co-author credit, distinct from the owning channel. An instructor who
    //? helps build someone else's course needs earnings and attribution here.
    authorId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),

    title: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    subtitle: varchar({ length: 500 }),
    description: text().notNull(),

    //? Catalogue
    thumbnailUrl: varchar({ length: 2048 }),
    trailerUrl: varchar({ length: 2048 }),
    level: courseLevelEnum().notNull().default("all_levels"),

    //? Pricing. Amounts in minor units (paise/cents) as integers: float money
    //? accumulates representation error and breaks equality checks in tests.
    priceInPaise: integer().notNull().default(0),
    currency: varchar({ length: 3 }).notNull().default("INR"),

    //? Editorial state
    status: courseStatusEnum().notNull().default("draft"),
    visibility: courseVisibilityEnum().notNull().default("private"),

    //? Denormalised aggregates, recomputed by workers. Kept out of the write
    //? path so a purchase never blocks on a rating recount.
    ratingAverage: numeric({ precision: 3, scale: 2 }).notNull().default("0"),
    ratingCount: integer().notNull().default(0),
    studentCount: integer().notNull().default(0),
    durationSeconds: integer().notNull().default(0),
    lessonCount: integer().notNull().default(0),

    //? Moderation
    publishedAt: timestamp({ withTimezone: true, mode: "date" }),
    archivedAt: timestamp({ withTimezone: true, mode: "date" }),

    //? Audit
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp({ withTimezone: true, mode: "date" })
  },
  table => [
    //? Public URL segment (/course/:slug). Freeing a slug on soft delete lets
    //? a course be re-created while the old row is still retained.
    uniqueIndex("courses_slug_unique_idx")
      .on(table.slug)
      .where(isNull(table.deletedAt)),

    //? Channel page: a creator's course list, newest first
    index("courses_channel_idx")
      .on(table.channelId)
      .where(isNull(table.deletedAt)),

    //? Author dashboard: "courses I co-teach", newest first
    index("courses_author_idx")
      .on(table.authorId)
      .where(isNull(table.deletedAt)),

    //? Catalogue browse: only published, publicly listed courses are indexable.
    //? `and()` is typed `SQL | undefined` while `.where()` wants a definite
    //? `SQL`, hence the assertions. Each is safe: every operand is a literal
    //? comparison against a non-null column, never a runtime value that could
    //? be undefined, so the conjunction is never empty.
    index("courses_published_idx")
      .on(table.publishedAt)
      .where(
        and(
          isNull(table.deletedAt),
          eq(table.status, "published"),
          eq(table.visibility, "public")
        )!
      ),

    //? Price facet for the catalogue filter. Shares the catalogue predicate so
    //? the planner can combine it with courses_published_idx.
    index("courses_price_idx")
      .on(table.priceInPaise)
      .where(
        and(
          isNull(table.deletedAt),
          eq(table.status, "published"),
          eq(table.visibility, "public")
        )!
      ),

    //? Sort keys: top rated, most popular. Published is enough here since
    //? these back the "best of" carousels, which may surface unlisted courses.
    index("courses_rating_idx")
      .on(table.ratingAverage)
      .where(and(isNull(table.deletedAt), eq(table.status, "published"))!),
    index("courses_student_count_idx")
      .on(table.studentCount)
      .where(and(isNull(table.deletedAt), eq(table.status, "published"))!),

    index("courses_deleted_at_idx").on(table.deletedAt)
  ]
);

export type Course = InferSelectModel<typeof coursesTable>;
export type NewCourse = InferInsertModel<typeof coursesTable>;
export type CourseStatus = (typeof courseStatusEnum.enumValues)[number];
export type CourseVisibility = (typeof courseVisibilityEnum.enumValues)[number];
export type CourseLevel = (typeof courseLevelEnum.enumValues)[number];
