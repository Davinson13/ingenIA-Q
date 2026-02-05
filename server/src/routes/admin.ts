import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
    getAdminDashboard,
    getPeriods, createPeriod, togglePeriodStatus, updatePeriod, deletePeriod,
    getAcademicStructure, createParallel, addSchedule, updateCourse, deleteCourse, deleteSchedule,
    getAdminUsers, updateUserRole, getCareersList, updateUser
} from "../controllers/admin";

const router = Router();

// =====================================================================
// MIDDLEWARE
// =====================================================================
// Enforce JWT validation for all admin routes
router.use(checkJwt);

// =====================================================================
// 1. DASHBOARD
// =====================================================================
// GET /api/admin/dashboard/stats - Returns main KPIs (Users, Active Period, etc.)
router.get("/dashboard/stats", getAdminDashboard);

// =====================================================================
// 2. ACADEMIC PERIODS MANAGEMENT
// =====================================================================
router.get("/periods", getPeriods);              // List all periods
router.post("/periods", createPeriod);           // Create new period
router.post("/period", createPeriod);            // Alias for creation
router.put("/period/:id", togglePeriodStatus);   // Toggle Active/Inactive status
router.put("/period/data/:id", updatePeriod);    // Edit dates/name
router.delete("/period/:id", deletePeriod);      // Delete period (Cascade)

// =====================================================================
// 3. ACADEMIC STRUCTURE (Courses & Schedules)
// =====================================================================
router.get("/academic/structure", getAcademicStructure); // Get full Career/Subject tree
router.post("/academic/parallel", createParallel);       // Create a course instance (A, B)
router.post("/academic/schedule", addSchedule);          // Add time block
router.put("/course/:id", updateCourse);                 // Update teacher/capacity
router.delete("/course/:id", deleteCourse);              // Delete course
router.delete("/schedule/:id", deleteSchedule);          // Delete time block

// =====================================================================
// 4. USER MANAGEMENT
// =====================================================================
router.get("/users", getAdminUsers);             // List all users
router.get("/users/careers", getCareersList);    // Get list of careers for dropdown
router.put("/users/:id", updateUser);            // Update user Role/Career
router.post("/users/role", updateUserRole);      // Legacy: Update role only

export { router };