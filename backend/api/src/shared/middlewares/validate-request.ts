import { Request, Response, NextFunction } from "express";
import z, { ZodError, type ZodType } from "zod";

import { ApiError } from "../errors/api-error";

export const REQUEST_PARTS = ["body", "query", "params"] as const;

export type RequestPart = (typeof REQUEST_PARTS)[number];

/**
 * Validates one part of the request and hands the parsed value to the handler.
 *
 * Parsing is not just a guard: it is also where the payload is normalised
 * (trimmed, lowercased, coerced), so the handler reads the sanitised value
 * instead of trusting whatever the client sent.
 *
 * `req.query` is a lazy getter in Express 5 and cannot be assigned, so the
 * parsed value is published on `res.locals` and read back with `getValidated`.
 * `req.body` is assignable, so it is kept in sync for anything downstream.
 */
export const validateRequest = (
  schema: ZodType,
  part: RequestPart = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);

      res.locals[part] = parsed;

      if (part === "body") {
        req.body = parsed;
      }

      next();
    } catch (error) {
      if (!(error instanceof ZodError)) {
        return next(error);
      }

      throw ApiError.badRequest(
        "Invalid request data",
        z.flattenError(error).fieldErrors || z.flattenError(error)
      );
    }
  };
};

/**
 * Reads back the value `validateRequest` parsed out of the request.
 */
export const getValidated = <T>(res: Response, part: RequestPart = "body"): T =>
  res.locals[part] as T;
