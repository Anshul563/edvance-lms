import { Router } from "express";
import AuthRouter from "../modules/auth/auth.routes";
import HealthRouter from "../modules/health/health.routes";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/health", HealthRouter);

export default router;
