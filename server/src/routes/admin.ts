import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
    getAdminDashboard,
    getPeriods, createPeriod, togglePeriodStatus, updatePeriod, deletePeriod,
    getAcademicStructure, createParallel, addSchedule, updateCourse, deleteCourse, deleteSchedule,
    getAdminUsers, updateUserRole, getCareersList, updateUser
} from "../controllers/admin";

const router = Router();

// Global Security Middleware: Validates JWT session
router.use(checkJwt);

// --- DASHBOARD ---
router.get("/dashboard/stats", getAdminDashboard);

// --- PERIODS ---
router.get("/periods", getPeriods);
router.post("/periods", createPeriod); // Note: Make sure it's POST /periods or /period depending on your frontend
router.post("/period", createPeriod); // Adding alias just in case frontend calls singular
router.put("/period/:id", togglePeriodStatus); // Toggle Active/Inactive
router.put("/period/data/:id", updatePeriod);  // Edit Name/Dates
router.delete("/period/:id", deletePeriod);

// --- ACADEMIC STRUCTURE ---
router.get("/academic/structure", getAcademicStructure);
router.post("/academic/parallel", createParallel);
router.post("/academic/schedule", addSchedule);
router.put("/course/:id", updateCourse);
router.delete("/course/:id", deleteCourse);
router.delete("/schedule/:id", deleteSchedule);

// --- USERS ---
router.get("/users", getAdminUsers);
router.post("/users/role", updateUserRole); // Legacy
router.get("/users/careers", getCareersList);
router.put("/users/:id", updateUser);

export { router };