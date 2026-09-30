import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Express } from "express";
import env from "./env";

import { logger } from "../utils/logger";

/**
 * The generated spec is read at runtime rather than imported.
 *
 * `import doc from "./swagger.json"` typechecks and runs fine under tsx, but the
 * compiled ESM output has no `with { type: "json" }` attribute, so plain node
 * refuses to load it and the whole process dies on boot. Reading the file also
 * keeps a missing spec from taking the API down with it.
 */
const loadSwaggerDocument = () => {
  const path = fileURLToPath(
    new URL("../../docs/swagger.json", import.meta.url)
  );

  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    logger.warn({ error }, `[swagger]: Could not read ${path}`);

    return null;
  }
};

export const setupSwagger = (app: Express) => {
  if (env.NODE_ENV !== "development") return;

  const swaggerDocument = loadSwaggerDocument();

  if (!swaggerDocument) return;

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
