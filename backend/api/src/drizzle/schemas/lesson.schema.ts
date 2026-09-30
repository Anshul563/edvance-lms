import { isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { coursesTable } from "./course.schema";

export const lessonTypeEnum = pgEnum("lesson_type", [
  "video",
  "article",
  "quiz",
  "download"
]);

export const lessonsTable = pgTable(
  "lessons",
  {
    id: uuid().primaryKey().defaultRandom(),

    courseId: uuid()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),

    title: varchar({ length: 255 }).notNull(),
    description: text(),
    type: lessonTypeEnum().notNull().default("video"),

    //? Ordering. Sparse integers (10, 20, 30) so a lesson can be inserted
    //? between two others without renumbering the whole course.
    position: integer().notNull(),

    durationSeconds: integer().notNull().default(0),

    //? Free preview: the marketing hook. Serves as the unpaid sample so a
    //? prospect can judge quality before buying.
    isPreview: boolean().notNull().default(false),

    //? Poster frame shown in the course outline and the player before play.
    //? A CDN URL, not an S3 key: the bucket is private, so every reader
    //? resolves this through a signed URL. The regenerable source offset for
    //? this frame lives in the poster record below.
    thumbnailUrl: varchar({ length: 2048 }),

    //? Original upload. Publicly unreachable; playback always goes through
    //? the HLS renditions on lesson_videos. Kept for re-transcoding when the
    //? codec ladder changes.
    videoUrl: varchar({ length: 2048 }),

    contentMarkdown: text(),

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
    //? The course outline: ordered, active lessons only. Deleted lessons drop
    //? out of the sequence without disturbing the survivors' positions.
    index("lessons_course_position_idx")
      .on(table.courseId, table.position)
      .where(isNull(table.deletedAt)),

    //? "Free preview lessons" for a course, for the sales page
    index("lessons_preview_idx")
      .on(table.courseId)
      .where(sql`${table.deletedAt} is null and ${table.isPreview} = true`),

    index("lessons_deleted_at_idx").on(table.deletedAt)
  ]
);

//? Poster-frame provenance. Separate from the thumbnail URL so an instructor
//? can drag a scrubber to pick a frame, have the transcoder cut it, and later
//? re-pick without re-uploading the video. The URL on the lesson is the cache;
//? this row is the recipe that can rebuild it.
export const lessonPostersTable = pgTable(
  "lesson_posters",
  {
    lessonId: uuid()
      .primaryKey()
      .references(() => lessonsTable.id, { onDelete: "cascade" }),

    //? Frame the poster was cut from, in seconds from the start. A transcoder
    //? seeking here is far more accurate than "the 25% mark", which drifts as
    //? the source and the segment offsets differ.
    sourceOffsetSeconds: integer().notNull().default(0),

    //? Whether an instructor chose this frame by hand. Auto-generated posters
    //? may be replaced without ceremony; manual picks are deliberate.
    isCustom: boolean().notNull().default(false),

    //? Rendered output. S3 key, not a URL, since the bucket is private.
    objectKey: varchar({ length: 1024 }).notNull(),
    width: integer(),
    height: integer(),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    //? Scrub bar: list every lesson in a course that has a manual poster,
    //? so the instructor UI can show which frames were chosen.
    index("lesson_posters_custom_idx")
      .on(table.lessonId)
      .where(sql`${table.isCustom} = true`)
  ]
);

export type Lesson = InferSelectModel<typeof lessonsTable>;
export type NewLesson = InferInsertModel<typeof lessonsTable>;
export type LessonPoster = InferSelectModel<typeof lessonPostersTable>;
export type NewLessonPoster = InferInsertModel<typeof lessonPostersTable>;
export type LessonType = (typeof lessonTypeEnum.enumValues)[number];
