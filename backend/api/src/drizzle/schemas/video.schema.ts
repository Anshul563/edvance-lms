import { isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { lessonsTable } from "./lesson.schema";

export const videoProcessingStatusEnum = pgEnum("video_processing_status", [
  "awaiting_upload",
  "uploading",
  "uploaded",
  "transcoding",
  "ready",
  "failed"
]);

export const uploadSessionStatusEnum = pgEnum("upload_session_status", [
  "initiated",
  "in_progress",
  "completed",
  "aborted",
  "expired"
]);

//? The original file as uploaded. Points at the private S3 object; playback
//? never reads this row, lesson_videos serves the adaptive streams.
export const lessonVideosTable = pgTable(
  "lesson_videos",
  {
    lessonId: uuid()
      .primaryKey()
      .references(() => lessonsTable.id, { onDelete: "cascade" }),

    //? Private bucket key for the master file. Not a URL: the bucket is not
    //? public, so a client must never be handed this string to fetch.
    sourceObjectKey: varchar({ length: 1024 }).notNull(),
    sourceSizeBytes: integer(),
    sourceMimeType: varchar({ length: 100 }),

    //? Transcode bookkeeping. status gates whether a player may start: only
    //? "ready" has a complete rendition ladder beneath it.
    status: videoProcessingStatusEnum().notNull().default("awaiting_upload"),
    failureReason: text(),
    processingProgressPercent: integer().notNull().default(0),

    //? Resolved from the source after ingest, so the player can show a scrub
    //? bar before any rendition is ready.
    durationSeconds: integer().notNull().default(0),
    width: integer(),
    height: integer(),

    //? Incremented on every re-transcode. A cached playlist from rendition N
    //? is stale once this moves to N+1, which tells the CDN to purge.
    transcodeVersion: integer().notNull().default(1),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    readyAt: timestamp({ withTimezone: true, mode: "date" })
  },
  table => [
    //? Transcode workers poll for work claiming. Ordered oldest-first so a
    //? queue is drained fairly rather than LIFO.
    index("lesson_videos_transcode_queue_idx")
      .on(table.status, table.createdAt)
      .where(sql`${table.status} in ('uploaded', 'transcoding')`),

    //? Failure dashboard: stuck jobs, most recent first
    index("lesson_videos_failed_idx")
      .on(table.updatedAt)
      .where(sql`${table.status} = 'failed'`),

    //? "Lessons with playable video", for course validation before publish
    index("lesson_videos_ready_idx")
      .on(table.lessonId)
      .where(sql`${table.status} = 'ready'`)
  ]
);

//? One row per bitrate rung in the codec ladder. The player reads the master
//? playlist, sees these variants, and picks one by measured bandwidth.
export const videoRenditionsTable = pgTable(
  "video_renditions",
  {
    id: uuid().primaryKey().defaultRandom(),

    lessonVideoId: uuid()
      .notNull()
      .references(() => lessonVideosTable.lessonId, { onDelete: "cascade" }),

    //? Height in pixels (720, 1080). Width follows from the source aspect
    //? ratio, so storing both would allow contradictory pairs.
    height: integer().notNull(),

    //? HLS is segmented: a variant points at a .m3u8 whose entries are the
    //? chunks. This is the playlist, not any individual segment.
    playlistObjectKey: varchar({ length: 1024 }).notNull(),

    videoBitrateKbps: integer(),
    audioBitrateKbps: integer(),
    codec: varchar({ length: 50 }).notNull().default("h264"),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    //? One rung per height. The player would otherwise be offered duplicate
    //? bitrates and pick unpredictably between them.
    uniqueIndex("video_renditions_lesson_height_unique_idx").on(
      table.lessonVideoId,
      table.height
    ),

    //? The composite unique index above already serves lookups by
    //? lessonVideoId, since it is the leading column. No separate index here:
    //? it would add write cost and buy the planner nothing.
  ]
);

//? Resumable upload. S3 multipart splits the file into parts the client POSTs
//? independently; without this row a dropped connection at 90% restarts the
//? whole transfer. S3 caps a part at 5 TiB and demands >=5 MiB for all but the
//? last, so partSizeBytes is stored rather than hardcoded.
export const uploadSessionsTable = pgTable(
  "upload_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),

    lessonId: uuid()
      .notNull()
      .references(() => lessonsTable.id, { onDelete: "cascade" }),

    //? S3's handle for the in-flight multipart upload. Aborting server-side
    //? requires it, and it expires, so failed sessions must be cleaned up or
    //? S3 bills for orphaned parts indefinitely.
    uploadId: varchar({ length: 512 }).notNull(),

    status: uploadSessionStatusEnum().notNull().default("initiated"),

    bucket: varchar({ length: 255 }).notNull(),
    objectKey: varchar({ length: 1024 }).notNull(),
    contentType: varchar({ length: 100 }),

    totalSizeBytes: integer(),
    totalParts: integer(),
    partSizeBytes: integer(),
    bytesUploaded: integer().notNull().default(0),

    //? Creator-facing failure text. Distinct from transcode failure, which
    //? lives on lesson_videos: an upload can fail long before any processing.
    failureReason: text(),

    //? S3 lifecycle rules should delete incomplete multipart uploads, but a
    //? row that outlives its uploadId can no longer be aborted. A reaper reads
    //? this to move the row to 'expired', which is what frees the partial
    //? unique index above for a fresh attempt.
    expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    completedAt: timestamp({ withTimezone: true, mode: "date" }),
    abortedAt: timestamp({ withTimezone: true, mode: "date" })
  },
  table => [
    //? One live upload per lesson. Re-uploading aborts the previous session
    //? rather than racing it, or two transcodes would fight over one lesson.
    //?
    //? The predicate is on status alone. Writing `and expiresAt > now()` here
    //? looks right and drizzle-kit will emit it, but Postgres rejects the
    //? migration outright: index predicates must be IMMUTABLE, and now() is
    //? not. Expiry is therefore a state transition -- a reaper moves stale
    //? rows from 'initiated'/'in_progress' to 'expired' -- not a comparison
    //? evaluated at query time.
    uniqueIndex("upload_sessions_active_lesson_unique_idx")
      .on(table.lessonId)
      .where(sql`${table.status} in ('initiated', 'in_progress')`),

    //? Reaper sweep: sessions past expiry whose S3 uploadId is now dead
    index("upload_sessions_expiry_idx")
      .on(table.expiresAt)
      .where(
        sql`${table.status} in ('initiated', 'in_progress')`
      ),

    index("upload_sessions_lesson_idx").on(table.lessonId)
  ]
);

export type LessonVideo = InferSelectModel<typeof lessonVideosTable>;
export type NewLessonVideo = InferInsertModel<typeof lessonVideosTable>;
export type VideoRendition = InferSelectModel<typeof videoRenditionsTable>;
export type NewVideoRendition = InferInsertModel<typeof videoRenditionsTable>;
export type UploadSession = InferSelectModel<typeof uploadSessionsTable>;
export type NewUploadSession = InferInsertModel<typeof uploadSessionsTable>;
export type VideoProcessingStatus =
  (typeof videoProcessingStatusEnum.enumValues)[number];
export type UploadSessionStatus =
  (typeof uploadSessionStatusEnum.enumValues)[number];
