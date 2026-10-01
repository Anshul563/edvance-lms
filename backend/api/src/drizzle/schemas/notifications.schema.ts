import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { usersTable } from "./user.schema";

//? Notification kinds. The client maps each kind to an icon and a deep link;
//? adding a kind is a migration plus a client mapping, never a schema change.
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_video",
  "course_update",
  "enrollment",
  "achievement",
  "certificate",
  "comment_reply",
  "system"
]);

//? Per-user inbox (the AppBar bell). Rows are created by domain events
//? (publish, earn, reply) via a worker; the API only lists and marks read.
//? Unread = readAt IS NULL, so "mark all read" is one UPDATE.
export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    type: notificationTypeEnum().notNull(),
    title: varchar({ length: 255 }).notNull(),
    body: text(),

    //? Deep-link payload, e.g. { "route": "video", "videoId": "..." }.
    //? Opaque to the database: routing rules live in the client.
    link: jsonb().$type<Record<string, string>>(),

    readAt: timestamp({ withTimezone: true, mode: "date" }),

    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  table => [
    //? Inbox: newest first. Unread badge counts come from the unread index;
    //? this one serves the full list (read + unread) in one sweep.
    index("notifications_user_idx").on(table.userId, table.createdAt),

    //? Unread sweep per user
    index("notifications_unread_idx")
      .on(table.userId)
      .where(sql`${table.readAt} is null`)
  ]
);

export type Notification = InferSelectModel<typeof notificationsTable>;
export type NewNotification = InferInsertModel<typeof notificationsTable>;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
