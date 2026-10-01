import { isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { creatorVideosTable } from "./creator-videos.schema";
import { usersTable } from "./user.schema";

//? Resume state for standalone videos. Mirrors lesson_progress (which owns
//? the in-course case): one row per (user, video), position for resume,
//? completed flag for "watched" badges, updatedAt for recency ordering.
export const videoWatchHistoryTable = pgTable(
  "video_watch_history",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    videoId: uuid()
      .notNull()
      .references(() => creatorVideosTable.id, { onDelete: "cascade" }),

    //? Resume position in seconds, so the feed can show progress bars and a
    //? tap returns mid-video.
    lastPositionSeconds: integer().notNull().default(0),
    watchedSeconds: integer().notNull().default(0),
    isCompleted: boolean().notNull().default(false),

    firstWatchedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    //? One history row per (user, video): rewatching updates position, it
    //? never inserts a second row.
    primaryKey({
      name: "video_watch_history_pk",
      columns: [table.userId, table.videoId]
    }),

    check(
      "video_watch_history_position_check",
      sql`${table.lastPositionSeconds} >= 0 and ${table.watchedSeconds} >= 0`
    ),

    //? Watch-history feed and "continue watching" rail, most recent first
    index("video_watch_history_recent_idx").on(table.userId, table.updatedAt),

    //? Video analytics: unique viewers and completion rate per video
    index("video_watch_history_video_idx").on(table.videoId)
  ]
);

//? Search queries per user. Powers suggestions ("recent searches") and, in
//? aggregate, the trending-searches rail. Queries are free text: normalising
//? them into keywords is an analytics job, not a write-path concern.
export const searchHistoryTable = pgTable(
  "search_history",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    query: varchar({ length: 255 }).notNull(),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    //? Recent searches per user, newest first
    index("search_history_user_idx").on(table.userId, table.createdAt)
  ]
);

export type VideoWatchHistory = InferSelectModel<typeof videoWatchHistoryTable>;
export type NewVideoWatchHistory = InferInsertModel<
  typeof videoWatchHistoryTable
>;
export type SearchHistoryEntry = InferSelectModel<typeof searchHistoryTable>;
export type NewSearchHistoryEntry = InferInsertModel<typeof searchHistoryTable>;
