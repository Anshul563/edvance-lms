import { and, eq, isNull, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { Request, Response } from "express";

import db from "../../db/db";
import { usersTable } from "../../drizzle/schemas/user.schema";
import { ApiResponse } from "../../shared/utils/api-response";
import { ApiError } from "../../shared/errors/api-error";
import { getValidated } from "../../shared/middlewares/validate-request";
import { hashPassword } from "./auth.helpers";
import { RESERVED_USERNAMES } from "./auth.validation";
import type {
  RegisterInput,
  UsernameAvailabilityQuery
} from "./auth.validation";

type UserRow = InferSelectModel<typeof usersTable>;

/**
 * The account as the outside world gets to see it. Auth internals such as the
 * hash, the lockout counters and the soft-delete stamp stay server side.
 */
export type PublicUser = Pick<
  UserRow,
  | "id"
  | "firstName"
  | "lastName"
  | "username"
  | "email"
  | "avatarUrl"
  | "bio"
  | "role"
  | "status"
  | "isEmailVerified"
  | "createdAt"
>;

/**
 * Every column that is safe to hand back to the client. Listed explicitly
 * rather than spread from the row so that `passwordHash` cannot leak into a
 * response by accident when the table gains a column, and the `satisfies`
 * clause keeps this list and `PublicUser` from drifting apart.
 */
const publicUserColumns = {
  id: usersTable.id,
  firstName: usersTable.firstName,
  lastName: usersTable.lastName,
  username: usersTable.username,
  email: usersTable.email,
  avatarUrl: usersTable.avatarUrl,
  bio: usersTable.bio,
  role: usersTable.role,
  status: usersTable.status,
  isEmailVerified: usersTable.isEmailVerified,
  createdAt: usersTable.createdAt
} satisfies Record<keyof PublicUser, unknown>;

type PgError = { code?: string; constraint?: string };

/**
 * Drizzle hands back a `DrizzleQueryError` with the driver error parked in
 * `cause`, so `error.code` is undefined and a naive check turns a duplicate key
 * into a 500. Walks the chain to the first error that carries a SQLSTATE.
 */
const unwrapPgError = (error: unknown): PgError | undefined => {
  let current = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as PgError & { cause?: unknown };

    if (typeof candidate.code === "string") {
      return candidate;
    }

    current = candidate.cause;
  }

  return undefined;
};

const conflict = (field: "email" | "username", message: string) =>
  ApiError.conflict(message, { [field]: [message] });

export const register = async (_req: Request, res: Response) => {
  const { firstName, lastName, username, age, email, password } =
    getValidated<RegisterInput>(res);

  //? Checked up front so the caller gets a precise 409 naming the field, and
  //? again on the unique violation below, because two signups for the same
  //? username can both pass this read.
  const taken = await db
    .select({ email: usersTable.email, username: usersTable.username })
    .from(usersTable)
    .where(
      and(
        isNull(usersTable.deletedAt),
        or(eq(usersTable.email, email), eq(usersTable.username, username))
      )
    )
    .limit(1);

  if (taken.length > 0) {
    const [existing] = taken;

    if (existing.email === email) {
      throw conflict("email", "An account with this email already exists");
    }

    throw conflict("username", "This username is already taken");
  }

  const passwordHash = await hashPassword(password);

  try {
    const [user] = await db
      .insert(usersTable)
      .values({
        firstName,
        lastName,
        username,
        age,
        email,
        passwordHash,
        role: "student",
        //? No email verification flow exists yet, so an account starts usable.
        //? Verification will hand out `pending` and flip it on confirm.
        status: "active"
      })
      .returning(publicUserColumns);

    return ApiResponse.created<{ user: PublicUser }>(res, "Account created", {
      user
    });
  } catch (error) {
    //? Losing the race means someone else inserted the same email or username
    //? between the read above and this write. Same 409, same field, so the
    //? client cannot tell the two apart and does not have to.
    const pgError = unwrapPgError(error);

    if (pgError?.code === "23505") {
      if (pgError.constraint === "users_email_unique_idx") {
        throw conflict("email", "An account with this email already exists");
      }

      if (pgError.constraint === "users_username_unique_idx") {
        throw conflict("username", "This username is already taken");
      }
    }

    throw error;
  }
};

export type UsernameAvailability = {
  username: string;
  available: boolean;
  reason: "reserved" | "taken" | null;
};

/**
 * Resolves why a name cannot be used, or null when it can. Reserved names are
 * answered without touching the database.
 */
const findUsernameConflict = async (
  username: string
): Promise<UsernameAvailability["reason"]> => {
  if (RESERVED_USERNAMES.has(username)) {
    return "reserved";
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.username, username), isNull(usersTable.deletedAt)))
    .limit(1);

  return existing ? "taken" : null;
};

/**
 * Reports a username as free, taken or reserved. Never throws for a name that
 * is simply in use: the sign-up form asks this while typing, and the caller
 * needs the answer rather than an error.
 */
export const checkUsernameAvailability = async (
  _req: Request,
  res: Response
) => {
  const { username } = getValidated<UsernameAvailabilityQuery>(res, "query");
  const reason = await findUsernameConflict(username);

  return ApiResponse.Success<UsernameAvailability>(
    res,
    reason ? "Username is unavailable" : "Username is available",
    { username, available: reason === null, reason }
  );
};
