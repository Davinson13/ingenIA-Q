import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { getTeacherDashboard, createTutoring, getTeacherCourses, getCourseGrades, updateStudentGrade } from "../controllers/teacher";
import { 
  getGradeMatrix,
  updateActivityGrade
} from "../controllers/grades";

import { getAttendance, saveAttendance } from "../controllers/attendance";
import { getEvents, createEvent, deleteEvent } from "../controllers/calendar";


const router = Router();

// Rutas protegidas para docentes
router.get("/dashboard", checkJwt, getTeacherDashboard);
router.post("/tutoring", checkJwt, createTutoring);
router.get("/courses", checkJwt, getTeacherCourses);
router.get("/grades/:courseId", checkJwt, getCourseGrades);
router.put("/grades", checkJwt, updateStudentGrade);

// 2. AGREGAR LAS RUTAS DE CALIFICACIONES
router.get("/grade-matrix/:courseId", checkJwt, getGradeMatrix);
router.post("/grade-activity", checkJwt, updateActivityGrade);

// RUTAS DE ASISTENCIA
router.get("/attendance", checkJwt, getAttendance);
router.post("/attendance", checkJwt, saveAttendance);

// RUTAS DE AGENDA
router.get("/calendar", checkJwt, getEvents);
router.post("/calendar", checkJwt, createEvent);
router.delete("/calendar/:id", checkJwt, deleteEvent);

export { router };