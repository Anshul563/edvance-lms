import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import env from "../shared/configs/env";
import { logger } from "../shared/utils/logger";
import * as schema from "../drizzle/index";

//? The node-postgres driver takes a Pool, not a connection string. The previous
//? version handed drizzle a string, which only blows up on the first query.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  //? Sized for a single API instance. A pooled server talks to Postgres and a
  //? transaction pooler (Neon) multiplexes many clients over few connections.
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

//? An idle client dropped by the server or a pooler surfaces here rather than
//? on a request, and an unhandled 'error' on a Pool would take the process down.
pool.on("error", error => {
  logger.error(error, "[db]: Unexpected error on an idle Postgres client");
});

const db = drizzle(pool, {
  schema,
  logger: env.NODE_ENV === "development"
});

export default db;
