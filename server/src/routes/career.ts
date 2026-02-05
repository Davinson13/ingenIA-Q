import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { getMyCareerPlan } from "../controllers/career";

const router = Router();

// =====================================================================
// CAREER & CURRICULUM ROUTES
// =====================================================================

/**
 * GET /api/career/my-plan
 * Retrieves the full academic plan (mesh) for the logged-in student,
 * including the status (Approved, Taking, Pending) of each subject.
 * Protected: Requires valid JWT.
 */
router.get("/my-plan", checkJwt, getMyCareerPlan);

export { router };