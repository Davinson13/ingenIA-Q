import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
    getAdminStats,
    getPeriods, createPeriod, togglePeriodStatus,
    getCareersWithSubjects, createParallel, addSchedule,
    getUsers, updateUserRole
} from "../controllers/admin";

const router = Router();

// Middleware de seguridad: Solo ADMIN (podrías añadir validación de rol extra aquí)
router.use(checkJwt);

// Dashboard
router.get("/stats", getAdminStats);

// Periodos
router.get("/periods", getPeriods);
router.post("/periods", createPeriod);
router.put("/periods/:id/toggle", togglePeriodStatus);

// Académico
router.get("/academic/structure", getCareersWithSubjects);
router.post("/academic/parallel", createParallel);
router.post("/academic/schedule", addSchedule);

// Usuarios
router.get("/users", getUsers);
router.post("/users/role", updateUserRole);

export { router };