import dotenv from "dotenv-flow";
dotenv.config();
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.string().regex(/^\d+$/, "PORT must be a number").transform(Number),

  DATABASE_URL: z.url(),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  CORS_ORIGIN: z.string(),

  //? Rate limiting, cache, and queues. Default matches the local Docker Redis.
  //? Under compose this is overridden to redis://redis:6379, since localhost
  //? inside a container is the container itself.
  REDIS_URL: z.url().default("redis://localhost:6379"),

  //? Signing keys. Required, not defaulted: a hardcoded fallback would let
  //? any deployment that forgets to set them forge valid tokens.
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16)
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment configuration");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env: Readonly<Env> = Object.freeze(result.data);

export default env;
