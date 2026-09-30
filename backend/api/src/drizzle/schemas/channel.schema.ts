import { isNull } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

import { usersTable } from "./user.schema";

export const channelsTable = pgTable(
  "channels",
  {
    id: uuid().primaryKey().defaultRandom(),

    //? One channel per creator, but a creator may hold several over time
    //? (rebrands). `isCurrent` is kept on the user side, not here.
    ownerId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    handle: varchar({ length: 100 }).notNull(),

    //? Branding
    displayName: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 2000 }),
    avatarUrl: varchar({ length: 2048 }),
    bannerUrl: varchar({ length: 2048 }),
    isVerified: boolean().notNull().default(false),

    //? Denormalised counters. Maintained by workers, not by request handlers:
    //? incrementing these inline serialises every subscriber onto one row.
    subscriberCount: integer().notNull().default(0),
    publishedCourseCount: integer().notNull().default(0),

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
    //? Channel handles are the public URL segment (@handle). Soft-deleted
    //? channels release the handle so it can be reclaimed.
    uniqueIndex("channels_handle_unique_idx")
      .on(table.handle)
      .where(isNull(table.deletedAt)),

    //? Creator dashboard: "my channels", ordered newest first
    index("channels_owner_idx").on(table.ownerId),
    index("channels_deleted_at_idx").on(table.deletedAt),

    //? Browse page: trending channels by subscriber count, verified first
    index("channels_trending_idx")
      .on(table.isVerified, table.subscriberCount)
      .where(isNull(table.deletedAt))
  ]
);

export type Channel = InferSelectModel<typeof channelsTable>;
export type NewChannel = InferInsertModel<typeof channelsTable>;
