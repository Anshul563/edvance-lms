import { Router } from "express";

import { AsyncHandler } from "../../shared/utils/async-handler";
import { validateRequest } from "../../shared/middlewares/validate-request";
import { rateLimiter } from "../../shared/middlewares/rate-limiter";
import { checkUsernameAvailability, register } from "./auth.controller";
import { registerSchema, usernameAvailabilitySchema } from "./auth.validation";

const router = Router();

/**
 * @route POST /auth/register
 * @group Auth
 * @summary Create an account
 * @description Email and username are normalised to lowercase. A conflict is
 * reported as 409 naming the field that is taken, so the form can highlight it.
 * @body {string} firstName - First name
 * @body {string} lastName - Last name
 * @body {string} username - Unique username, 3-30 chars of a-z, 0-9 and _
 * @body {number} age - Age in years, 13-120
 * @body {string} email - Email address
 * @body {string} password - Password, 8-128 chars
 * @success {object} 201 - Account created
 * @response {object} 400 - Invalid request data
 * @response {object} 409 - Email or username already taken
 * @response {object} 429 - Too many attempts
 */
router.post(
  "/register",
  rateLimiter(10, 900, "auth:register"),
  validateRequest(registerSchema),
  AsyncHandler(register)
);

/**
 * @route GET /auth/username-available
 * @group Auth
 * @summary Check whether a username is free
 * @description Reserved names are answered as unavailable rather than as a
 * validation error, since this is a lookup and not a write.
 * @param {string} username.query - Username to check
 * @success {object} 200 - Availability result
 * @response {object} 400 - Malformed username
 * @response {object} 429 - Too many attempts
 */
router.get(
  "/username-available",
  rateLimiter(30, 60, "auth:username-available"),
  validateRequest(usernameAvailabilitySchema, "query"),
  AsyncHandler(checkUsernameAvailability)
);

export default router;
