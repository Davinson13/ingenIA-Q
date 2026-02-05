import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
  getWeeklySchedule,
  getMyCourses,
  getStudentCourseDetails,
  submitActivity,
  getAvailableTutorings,
  bookTutoring,
  getStudentDashboard,
  getAllCourses,
  enrollCourse,
  leaveCourse,
  getCatalogFilters, 
  getOpenCourses,
  registerHistoricalGrades,
  requestCareer,
  getStudentStats // Ensure this is exported in controller if used directly, usually part of dashboard
} from "../controllers/student";

import { chatWithTutor } from "../controllers/ai";

import {
  getStudentAgenda,
  createPersonalEvent,
  deletePersonalEvent,
  createExternalCourse
} from "../controllers/calendar";

const router = Router();

// =====================================================================
// MIDDLEWARE
// =====================================================================
// All student routes require authentication
router.use(checkJwt);

// =====================================================================
// 1. DASHBOARD & HOME
// =====================================================================
// GET /api/student/dashboard - Main stats, tasks, and today's classes
router.get("/dashboard", getStudentDashboard);

// GET /api/student/schedule - Weekly class blocks
router.get("/schedule", getWeeklySchedule);

// =====================================================================
// 2. COURSE MANAGEMENT (MY COURSES)
// =====================================================================
// GET /api/student/courses - List of currently active courses (Cards)
router.get("/courses", getMyCourses);

// GET /api/student/course/:courseId - Detail view (Grades, Agenda, Attendance)
router.get("/course/:courseId", getStudentCourseDetails);

// POST /api/student/submit - Submit homework/activity link
router.post("/submit", submitActivity);

// =====================================================================
// 3. CALENDAR & AGENDA
// =====================================================================
// GET /api/student/calendar - Aggregated monthly agenda
router.get("/calendar", getStudentAgenda);

// POST /api/student/calendar/personal - Create personal event
router.post("/calendar/personal", createPersonalEvent);

// DELETE /api/student/calendar/personal/:id - Delete personal event
router.delete("/calendar/personal/:id", deletePersonalEvent);

// POST /api/student/calendar/external - Create extracurricular course
router.post("/calendar/external", createExternalCourse);

// =====================================================================
// 4. TUTORING SYSTEM
// =====================================================================
// GET /api/student/tutorings/available - List available slots
router.get("/tutorings/available", getAvailableTutorings);

// POST /api/student/tutorings/book - Reserve a slot
router.post("/tutorings/book", bookTutoring);

// =====================================================================
// 5. ACADEMIC CATALOG & ENROLLMENT
// =====================================================================
// GET /api/student/catalog/filters - Get list of Careers for filtering
router.get("/catalog/filters", getCatalogFilters);

// GET /api/student/catalog/courses - Get open courses matching filters
router.get("/catalog/courses", getOpenCourses);

// GET /api/student/catalog/all - Full Academic Mesh + History status
router.get("/catalog/all", getAllCourses);

// POST /api/student/enroll - Enroll in a course (Active Period)
router.post("/enroll", enrollCourse);

// DELETE /api/student/enroll/:subjectId - Drop a course
router.delete("/enroll/:subjectId", leaveCourse);

// POST /api/student/history/register - Manual entry of past grades
router.post("/history/register", registerHistoricalGrades);

// POST /api/student/request-career - Request admin to assign a career
router.post('/request-career', requestCareer);

// =====================================================================
// 6. AI ASSISTANT
// =====================================================================
// POST /api/student/ai-chat - Chat with Gemini Tutor
router.post("/ai-chat", chatWithTutor);

export { router };