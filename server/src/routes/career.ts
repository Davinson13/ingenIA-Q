import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { getMyCareerPlan } from "../controllers/career";

const router = Router();

// GET http://localhost:3000/api/career/my-plan
// Protegida por checkJwt (Solo usuarios logueados)
router.get("/my-plan", checkJwt, getMyCareerPlan);

export { router };