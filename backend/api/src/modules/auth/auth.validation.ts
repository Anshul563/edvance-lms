import { z } from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const MIN_AGE = 13;
export const MAX_AGE = 120;

//? Names the platform needs for itself, plus the impersonation bait that gets
//? reported every week on every platform that allows it. Reserved in the app
//? layer because the partial unique index on `username` cannot express it.
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "superuser",
  "system",
  "support",
  "help",
  "staff",
  "team",
  "edvance",
  "api",
  "www",
  "me",
  "user",
  "users",
  "moderator",
  "official"
]);

/**
 * Usernames are stored lowercased, which is what makes the plain unique index
 * on `users.username` behave case-insensitively: `Anshul`, `ANSHUL` and
 * `anshul` cannot all exist because every writer normalises first.
 *
 * Reserved names are rejected only on write. On the availability lookup they
 * are reported as unavailable instead, because "is this name free?" is a
 * question, and a 400 is the wrong answer to it.
 */
const usernameFormatSchema = z
  .string({ error: "Username is required" })
  .trim()
  .toLowerCase()
  .min(
    USERNAME_MIN_LENGTH,
    `Username must be at least ${USERNAME_MIN_LENGTH} characters`
  )
  .max(
    USERNAME_MAX_LENGTH,
    `Username must be at most ${USERNAME_MAX_LENGTH} characters`
  )
  .regex(
    /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/,
    "Username may only contain letters, numbers and underscores, and must start and end with a letter or number"
  );

export const usernameSchema = usernameFormatSchema.refine(
  value => !RESERVED_USERNAMES.has(value),
  { error: "This username is reserved" }
);

export const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }))
  .refine(value => value.length <= 255, {
    error: "Email must be at most 255 characters"
  });

export const passwordSchema = z
  .string({ error: "Password is required" })
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password must be at most ${PASSWORD_MAX_LENGTH} characters`
  );

/**
 * `age` is coerced because an Expo form that keeps it in a text input sends
 * "24", and a 400 there reads to the user as "the app is broken". An empty
 * picker sends null, which `Number` would happily turn into 0, so blanks are
 * mapped to "missing" first and get the missing-field message.
 */
export const registerSchema = z.object({
  firstName: z
    .string({ error: "First name is required" })
    .trim()
    .min(1, "First name is required")
    .max(80, "First name must be at most 80 characters"),
  lastName: z
    .string({ error: "Last name is required" })
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name must be at most 80 characters"),
  username: usernameSchema,
  age: z.preprocess(
    value => (value === null || value === "" ? undefined : value),
    z.coerce
      .number({ error: "Age is required" })
      .int("Age must be a whole number")
      .min(MIN_AGE, `You must be at least ${MIN_AGE} to create an account`)
      .max(MAX_AGE, `Age must be at most ${MAX_AGE}`)
  ),
  email: emailSchema,
  password: passwordSchema
});

export const usernameAvailabilitySchema = z.object({
  username: usernameFormatSchema
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type UsernameAvailabilityQuery = z.infer<
  typeof usernameAvailabilitySchema
>;
