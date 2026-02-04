import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { chatWithTutor } from "../controllers/ai";

const router = Router();

// POST http://localhost:3000/api/ai/chat
router.post("/chat", checkJwt, chatWithTutor);

export { router };