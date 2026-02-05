import { Router } from "express";
import { updateProfile, deleteAccount } from "../controllers/user";
import { checkJwt } from "../middleware/session";

const router = Router();

// =====================================================================
// MIDDLEWARE
// =====================================================================
// All user profile routes require authentication
router.use(checkJwt);

// =====================================================================
// PROFILE MANAGEMENT
// =====================================================================

/**
 * PUT /api/user/profile
 * Updates the authenticated user's profile information (e.g., Name, Password).
 */
router.put("/profile", updateProfile);

/**
 * DELETE /api/user/profile
 * Permanently deletes the authenticated user's account.
 */
router.delete("/profile", deleteAccount);

export { router };