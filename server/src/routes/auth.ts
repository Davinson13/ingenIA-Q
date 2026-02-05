import { Router } from "express";
import { registerCtrl, loginCtrl, verifyEmailCtrl, oauthLoginCtrl, getMe } from "../controllers/auth";
import { checkJwt } from "../middleware/session";

const router = Router();

// =====================================================================
// AUTHENTICATION ROUTES
// =====================================================================

// POST /api/auth/register - Create new account (Local)
router.post("/register", registerCtrl);

// POST /api/auth/login - Sign in (Local)
router.post("/login", loginCtrl);

// POST /api/auth/verify - Verify Email Code
router.post("/verify", verifyEmailCtrl);

// POST /api/auth/oauth - Social Login (Google/GitHub)
router.post("/oauth", oauthLoginCtrl);

// =====================================================================
// SESSION MANAGEMENT
// =====================================================================

// GET /api/auth/me - Retrieve current session user data
// Protected: Requires valid JWT
router.get("/me", checkJwt, getMe);

export { router };