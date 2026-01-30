import { Router } from "express";
import { getPublicCareers, getPublicAcademicOffer } from "../controllers/guest";

const router = Router();

// NOTA: No usamos middleware de sesión aquí porque es PÚBLICO
router.get("/careers", getPublicCareers);
router.get("/offer/:careerId", getPublicAcademicOffer);

export { router };