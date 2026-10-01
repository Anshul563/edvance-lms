import { isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  check,
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

import { creatorVideosTable } from "./creator-videos.schema";
import { lessonsTable } from "./lesson.schema";
import { usersTable } from "./user.schema";

//? Vote target. A single votes table serves threads and replies: exactly one
//? of the two FKs is set, enforced by check, so "did I upvote this" is one
//? lookup regardless of target type.
export const discussionVoteTargetEnum = pgEnum("discussion_vote_target", [
  "thread",
  "reply"
]);

//? Q&A threads. Lesson threads carry a title (the "why does the closure..."
//? question); video comments are title-less top-level remarks. Exactly one of
//? lessonId / videoId is set, so a thread can never float unattached or claim
//? two parents.
export const discussionThreadsTable = pgTable(
  "discussion_threads",
  {
    id: uuid().primaryKey().defaultRandom(),

    authorId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    lessonId: uuid().references(() => lessonsTable.id, {
      onDelete: "cascade"
    }),
    videoId: uuid().references(() => creatorVideosTable.id, {
      onDelete: "cascade"
    }),

    //? Null for video comments, required for lesson Q&A. The check below only
    //? enforces parentage; title rules are a validation-layer concern.
    title: varchar({ length: 255 }),
    body: text().notNull(),

    //? Moderation and curation. Pinned threads sort first; resolved marks an
    //? answered question (lesson Q&A only, but harmless on video threads).
    isPinned: boolean().notNull().default(false),
    isResolved: boolean().notNull().default(false),

    //? Denormalised aggregates, recomputed by workers. Voting and replying
    //? write to their own tables; these counters are the read-optimised rollups.
    upvoteCount: integer().notNull().default(0),
    replyCount: integer().notNull().default(0),

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
    check(
      "discussion_threads_single_parent_check",
      sql`(${table.lessonId} is not null)::int + (${table.videoId} is not null)::int = 1`
    ),

    //? Lesson discussion tab: pinned first, then newest. Deleted threads drop
    //? out without disturbing sort order.
    index("discussion_threads_lesson_idx")
      .on(table.lessonId, table.isPinned, table.createdAt)
      .where(isNull(table.deletedAt)),

    //? Video comment section: newest first
    index("discussion_threads_video_idx")
      .on(table.videoId, table.createdAt)
      .where(isNull(table.deletedAt)),

    //? "My questions" profile tab
    index("discussion_threads_author_idx")
      .on(table.authorId, table.createdAt)
      .where(isNull(table.deletedAt)),

    index("discussion_threads_deleted_at_idx").on(table.deletedAt)
  ]
);

//? Flat replies. The app renders one reply level (instructor answers under a
//? question), so no self-reference: threading depth is a product decision, and
//? adding parentReplyId later is a backwards-compatible migration.
export const discussionRepliesTable = pgTable(
  "discussion_replies",
  {
    id: uuid().primaryKey().defaultRandom(),

    threadId: uuid()
      .notNull()
      .references(() => discussionThreadsTable.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    body: text().notNull(),

    //? Instructor badge. Denormalised at write time from the author's grant so
    //? rendering never joins role_grants; revoked grants keep history honest.
    fromInstructor: boolean().notNull().default(false),

    upvoteCount: integer().notNull().default(0),

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
    //? Thread view: oldest first (conversation order)
    index("discussion_replies_thread_idx")
      .on(table.threadId, table.createdAt)
      .where(isNull(table.deletedAt)),

    index("discussion_replies_deleted_at_idx").on(table.deletedAt)
  ]
);

//? Upvote toggles. One row per (user, target): upvoting twice is a no-op,
//? removing the vote deletes the row, which keeps upvoteCount exact.
export const discussionVotesTable = pgTable(
  "discussion_votes",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    target: discussionVoteTargetEnum().notNull(),
    threadId: uuid().references(() => discussionThreadsTable.id, {
      onDelete: "cascade"
    }),
    replyId: uuid().references(() => discussionRepliesTable.id, {
      onDelete: "cascade"
    }),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    check(
      "discussion_votes_single_target_check",
      sql`(${table.threadId} is not null)::int + (${table.replyId} is not null)::int = 1`
    ),

    //? One vote per user per thread...
    uniqueIndex("discussion_votes_user_thread_unique_idx")
      .on(table.userId, table.threadId)
      .where(sql`${table.threadId} is not null`),

    //? ...and one per user per reply. Partial unique indexes (not a plain
    //? unique constraint) because NULLs must not collide across targets.
    uniqueIndex("discussion_votes_user_reply_unique_idx")
      .on(table.userId, table.replyId)
      .where(sql`${table.replyId} is not null`),

    //? Counter rollups per target
    index("discussion_votes_thread_idx")
      .on(table.threadId)
      .where(sql`${table.threadId} is not null`),
    index("discussion_votes_reply_idx")
      .on(table.replyId)
      .where(sql`${table.replyId} is not null`)
  ]
);

export type DiscussionThread = InferSelectModel<typeof discussionThreadsTable>;
export type NewDiscussionThread = InferInsertModel<
  typeof discussionThreadsTable
>;
export type DiscussionReply = InferSelectModel<typeof discussionRepliesTable>;
export type NewDiscussionReply = InferInsertModel<
  typeof discussionRepliesTable
>;
export type DiscussionVote = InferSelectModel<typeof discussionVotesTable>;
export type NewDiscussionVote = InferInsertModel<typeof discussionVotesTable>;
export type DiscussionVoteTarget =
  (typeof discussionVoteTargetEnum.enumValues)[number];
