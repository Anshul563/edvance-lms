import { isNull, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
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

//? Platform tier: the single broadest label for an account.
//? Exactly one per user, set at signup and changed rarely.
export const userRoleEnum = pgEnum("user_role", [
  "student",
  "instructor",
  "admin",
  "superadmin"
]);

//? Grants: additive capabilities layered on top of a tier.
//? A student who also teaches gets the `instructor` grant, not a second tier.
export const userRoleGrantEnum = pgEnum("user_role_grant", [
  "instructor",
  "moderator",
  "content_reviewer",
  "support_agent",
  "finance_operator"
]);

//? Authorisation state, orthogonal to role. A suspended admin is still an admin.
export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "active",
  "suspended"
]);

export const usersTable = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),

    //? Identity
    firstName: varchar({ length: 255 }).notNull(),
    lastName: varchar({ length: 255 }).notNull(),
    username: varchar({ length: 255 }).notNull(),
    age: integer().notNull(),

    //? Credentials
    email: varchar({ length: 255 }).notNull(),
    passwordHash: varchar({ length: 255 }).notNull(),

    //? Profile
    avatarUrl: varchar({ length: 2048 }),
    bio: varchar({ length: 500 }),

    //? Authorisation
    role: userRoleEnum().notNull().default("student"),
    status: userStatusEnum().notNull().default("pending"),
    isEmailVerified: boolean().notNull().default(false),

    //? Auth lifecycle
    emailVerifiedAt: timestamp({ withTimezone: true, mode: "date" }),
    lastLoginAt: timestamp({ withTimezone: true, mode: "date" }),
    passwordChangedAt: timestamp({ withTimezone: true, mode: "date" }),
    failedLoginAttempts: integer().notNull().default(0),
    lockedUntil: timestamp({ withTimezone: true, mode: "date" }),

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
    //? Partial unique indexes: soft-deleted rows release their email/username
    uniqueIndex("users_email_unique_idx")
      .on(table.email)
      .where(isNull(table.deletedAt)),
    uniqueIndex("users_username_unique_idx")
      .on(table.username)
      .where(isNull(table.deletedAt)),

    //? Query patterns: admin listings, login lookup, active-user filtering
    index("users_role_idx").on(table.role),
    index("users_status_idx").on(table.status),
    index("users_created_at_idx").on(table.createdAt),
    index("users_deleted_at_idx").on(table.deletedAt)
  ]
);

export const userRoleGrantsTable = pgTable(
  "user_role_grants",
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    grant: userRoleGrantEnum().notNull(),

    grantedBy: uuid().references(() => usersTable.id, {
      onDelete: "set null"
    }),
    grantedAt: timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp({ withTimezone: true, mode: "date" })
  },
  table => [
    //? One row per (user, grant). Surrogate id omitted; the pair is the identity.
    primaryKey({
      name: "user_role_grants_pk",
      columns: [table.userId, table.grant]
    }),

    //? Effective-grant lookups: "what can this user actually do right now",
    //? which must skip rows whose expiresAt has passed.
    index("user_role_grants_user_idx").on(table.userId),
    index("user_role_grants_grant_idx").on(table.grant),

    //? Expiring temporary grants (moderator cover, audit roles)
    index("user_role_grants_expires_at_idx")
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} is not null`)
  ]
);

export type User = InferSelectModel<typeof usersTable>;
export type NewUser = InferInsertModel<typeof usersTable>;
export type UserRoleGrant = InferSelectModel<typeof userRoleGrantsTable>;
export type NewUserRoleGrant = InferInsertModel<typeof userRoleGrantsTable>;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserRoleGrantType = (typeof userRoleGrantEnum.enumValues)[number];
