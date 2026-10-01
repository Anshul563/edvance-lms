import { and, eq, isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { channelsTable } from "./channel.schema";

//? Editorial workflow for creator uploads. Mirrors the course lifecycle so
//? the same moderation tooling (review queues, scheduled publishing) applies
//? to both long-form courses and standalone videos.
export const creatorVideoStatusEnum = pgEnum("creator_video_status", [
  "draft",
  "in_review",
  "published",
  "archived"
]);

export const creatorVideoVisibilityEnum = pgEnum("creator_video_visibility", [
  "public",
  "unlisted",
  "private"
]);

//? Standalone (YouTube-style) videos. Distinct from lesson_videos, which are
//? segments inside a course: these live directly on a channel, have their own
//? public page, comments, likes and view counters, and feed the home video rail
//? plus the recommendation service.
export const creatorVideosTable = pgTable(
  "creator_videos",
  {
    id: uuid().primaryKey().defaultRandom(),

    //? Ownership. Videos live on a channel, not on a user, so a creator can
    //? transfer a video between channels without rewriting every reaction.
    channelId: uuid()
      .notNull()
      .references(() => channelsTable.id, { onDelete: "cascade" }),

    title: varchar({ length: 255 }).notNull(),
    description: text().notNull().default(""),

    //? Playback. A CDN URL for the master file; adaptive renditions reuse the
    //? same pipeline as lessons once the video-engine claims the row.
    videoUrl: varchar({ length: 2048 }),
    thumbnailUrl: varchar({ length: 2048 }),
    durationSeconds: integer().notNull().default(0),

    //? Editorial state
    status: creatorVideoStatusEnum().notNull().default("draft"),
    visibility: creatorVideoVisibilityEnum().notNull().default("private"),

    //? Denormalised aggregates, recomputed by workers. Reactions, comments
    //? and watch events write to their own tables; counters here are the
    //? read-optimised rollups the feed and video page render from.
    viewCount: integer().notNull().default(0),
    likeCount: integer().notNull().default(0),
    dislikeCount: integer().notNull().default(0),
    commentCount: integer().notNull().default(0),

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
    //? Channel page: a creator's videos, newest first
    index("creator_videos_channel_idx")
      .on(table.channelId, table.publishedAt)
      .where(isNull(table.deletedAt)),

    //? Home feed and video rails: only published, publicly listed videos are
    //? indexable. Shares the catalogue predicate with courses so one sweep
    //? can union both feeds.
    index("creator_videos_published_idx")
      .on(table.publishedAt)
      .where(
        and(
          isNull(table.deletedAt),
          eq(table.status, "published"),
          eq(table.visibility, "public")
        )!
      ),

    //? "Most watched" rail. Published is enough here since trending may
    //? surface unlisted videos shared by link.
    index("creator_videos_views_idx")
      .on(table.viewCount)
      .where(and(isNull(table.deletedAt), eq(table.status, "published"))!),

    //? Transcode queue hookup: rows whose videoUrl is set but which the
    //? video-engine has not claimed yet (see video-engine polling).
    index("creator_videos_pending_media_idx")
      .on(table.createdAt)
      .where(sql`${table.deletedAt} is null and ${table.videoUrl} is not null`),

    index("creator_videos_deleted_at_idx").on(table.deletedAt)
  ]
);

export type CreatorVideo = InferSelectModel<typeof creatorVideosTable>;
export type NewCreatorVideo = InferInsertModel<typeof creatorVideosTable>;
export type CreatorVideoStatus =
  (typeof creatorVideoStatusEnum.enumValues)[number];
export type CreatorVideoVisibility =
  (typeof creatorVideoVisibilityEnum.enumValues)[number];
