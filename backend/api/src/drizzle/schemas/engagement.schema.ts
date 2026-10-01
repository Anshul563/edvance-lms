import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { channelsTable } from "./channel.schema";
import { coursesTable } from "./course.schema";
import { creatorVideosTable } from "./creator-videos.schema";
import { usersTable } from "./user.schema";

//? Like/dislike toggle on a creator video. One row per (user, video): liking
//? twice is an update, not a second row, which is what keeps likeCount exact.
export const videoReactionTypeEnum = pgEnum("video_reaction_type", [
  "like",
  "dislike"
]);

export const videoReactionsTable = pgTable(
  "video_reactions",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    videoId: uuid()
      .notNull()
      .references(() => creatorVideosTable.id, { onDelete: "cascade" }),

    reaction: videoReactionTypeEnum().notNull(),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    //? A user holds at most one reaction per video. The pair is the identity,
    //? so no surrogate id is needed.
    primaryKey({
      name: "video_reactions_pk",
      columns: [table.userId, table.videoId]
    }),

    //? Counter rollups: recompute a video's like/dislike totals from here
    index("video_reactions_video_idx").on(table.videoId),

    //? "Videos I liked" profile tab, newest first
    index("video_reactions_user_idx").on(table.userId, table.updatedAt)
  ]
);

//? Channel subscriptions (the Subscribe button). One row per (user, channel);
//? unsubscribing deletes the row, so subscriberCount is always countable.
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    channelId: uuid()
      .notNull()
      .references(() => channelsTable.id, { onDelete: "cascade" }),

    //? Upload notifications bell. Per-subscription, like YouTube: "all" pings
    //? on every publish, "none" only lists uploads in the subscriptions feed.
    notifyOnUpload: boolean().notNull().default(true),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    primaryKey({
      name: "subscriptions_pk",
      columns: [table.userId, table.channelId]
    }),

    //? Subscriber rollups per channel
    index("subscriptions_channel_idx").on(table.channelId),

    //? "My subscriptions" feed ordering, newest subscriptions first
    index("subscriptions_user_idx").on(table.userId, table.createdAt)
  ]
);

//? Star ratings with optional text. One review per (user, course): re-rating
//? updates the row, which is what keeps courses.ratingAverage recomputable as
//? a plain average over this table.
export const courseReviewsTable = pgTable(
  "course_reviews",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),

    //? 1-5 stars. The check (not app code) is the backstop: clients can lie.
    rating: integer().notNull(),
    title: varchar({ length: 120 }),
    body: text(),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  table => [
    //? One review per student per course; updates carry a new updatedAt.
    uniqueIndex("course_reviews_user_course_unique_idx").on(
      table.userId,
      table.courseId
    ),
    check("course_reviews_rating_check", sql`${table.rating} between 1 and 5`),

    //? Course page: newest reviews first, and the rating histogram query
    index("course_reviews_course_idx").on(table.courseId, table.createdAt),

    //? "My reviews" profile tab
    index("course_reviews_user_idx").on(table.userId)
  ]
);

//? "Saved for later" shelf. Distinct from enrollments: saving is intent,
//? enrolling is purchase. One row per (user, course); unsaving deletes it.
export const wishlistTable = pgTable(
  "wishlist",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    primaryKey({
      name: "wishlist_pk",
      columns: [table.userId, table.courseId]
    }),

    //? Library "Saved for later" rail, newest saves first
    index("wishlist_user_idx").on(table.userId, table.createdAt)
  ]
);

export type VideoReaction = InferSelectModel<typeof videoReactionsTable>;
export type NewVideoReaction = InferInsertModel<typeof videoReactionsTable>;
export type VideoReactionType =
  (typeof videoReactionTypeEnum.enumValues)[number];
export type Subscription = InferSelectModel<typeof subscriptionsTable>;
export type NewSubscription = InferInsertModel<typeof subscriptionsTable>;
export type CourseReview = InferSelectModel<typeof courseReviewsTable>;
export type NewCourseReview = InferInsertModel<typeof courseReviewsTable>;
export type WishlistItem = InferSelectModel<typeof wishlistTable>;
export type NewWishlistItem = InferInsertModel<typeof wishlistTable>;
