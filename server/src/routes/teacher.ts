import { Router } from "express";
import { checkJwt } from "../middleware/session";

// 1. IMPORT TEACHER CONTROLLERS
import {
  getTeacherDashboard,
  createTutoring,
  getTutorings,
  getTeacherCourses,
  getCourseGrades,        // Course Header Info
  getCourseGradeMatrix,   // 👈 MAIN MATRIX (Grades + Attendance)
  getActivityGrades,      // List students for a specific activity
  saveActivityGrade,      // Save a single grade
  getDailyAttendance,     // Read attendance
  saveDailyAttendance,    // Save attendance (with date fix)
  updateStudentGrade,     // Update final grade manually (if needed)
  removeStudent
} from "../controllers/teacher";

// 2. IMPORT CALENDAR CONTROLLERS
import {
  getMonthAgenda,
  createPersonalEvent,
  deletePersonalEvent,
  getEvents,      // List course activities
  createEvent,    // Create Exam/Assignment
  deleteEvent
} from "../controllers/calendar";

const router = Router();

// =====================================================================
// MIDDLEWARE
// =====================================================================
// All teacher routes require authentication
router.use(checkJwt);

// =====================================================================
// 1. DASHBOARD & COURSES
// =====================================================================
router.get("/dashboard", getTeacherDashboard); // Main stats & dynamic agenda
router.get("/courses", getTeacherCourses);     // List active courses

// =====================================================================
// 2. TUTORING MANAGEMENT
// =====================================================================
router.get("/tutorings", getTutorings);
router.post("/tutoring", createTutoring);

// =====================================================================
// 3. STUDENT MANAGEMENT
// =====================================================================
// DELETE /api/teacher/student - Remove a student from a course
router.delete("/student", removeStudent);

// =====================================================================
// 4. GRADES MANAGEMENT (THE MATRIX)
// =====================================================================

// Get Course Header Info (Name, Code)
router.get("/grades/:courseId", getCourseGrades);

// 🔥 MAIN ENDPOINT: Returns Students, Activities breakdown, and Attendance %
router.get("/grade-matrix/:courseId", getCourseGradeMatrix);

// --- SPECIFIC ACTIVITY GRADING ---
// Get list of students and their submissions for a specific task
router.get('/activity/:activityId', getActivityGrades);

// Save a grade for a specific student in a specific task
router.post('/activity/:activityId/grade', saveActivityGrade);

// Manual Final Grade Update (Legacy/Override)
router.put("/grades", updateStudentGrade);

// =====================================================================
// 5. ATTENDANCE MANAGEMENT
// =====================================================================
router.get("/attendance", getDailyAttendance);
router.post("/attendance", saveDailyAttendance);

// =====================================================================
// 6. AGENDA & EVENTS
// =====================================================================

// --- GLOBAL AGENDA (Month View) ---
router.get("/calendar", getMonthAgenda);
router.post("/calendar/personal", createPersonalEvent);
router.delete("/calendar/personal/:id", deletePersonalEvent);

// --- COURSE SPECIFIC EVENTS (Exams, Assignments) ---
router.get("/events", getEvents);          // List activities for a course
router.post("/events", createEvent);       // Create a new activity
router.delete("/events/:id", deleteEvent); // Delete an activity

export { router };