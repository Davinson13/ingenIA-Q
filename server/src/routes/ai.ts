import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { chatWithTutor } from "../controllers/ai"; 

const router = Router();

// =====================================================================
// AI TUTOR ROUTES
// =====================================================================

/**
 * POST /api/ai/chat
 * Endpoint to interact with the Gemini AI Tutor.
 * Payload: { message: string }
 * Protected: Requires valid JWT.
 */
router.post("/chat", checkJwt, chatWithTutor);

export { router };