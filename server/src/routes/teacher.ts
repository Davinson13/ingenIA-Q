import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { 
    getTeacherDashboard, 
    createTutoring, 
    getTeacherCourses, 
    getCourseGrades, 
    updateStudentGrade, 
    getActivityGrades,
    saveActivityGrade, 
    getCourseGradeMatrix
} from "../controllers/teacher";
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

// 2. RUTAS DE CALIFICACIONES (Matriz General)
router.get("/grade-matrix/:courseId", checkJwt, getGradeMatrix);
router.post("/grade-activity", checkJwt, updateActivityGrade); // Esta es para la matriz general

// 3. RUTAS PARA CALIFICAR ACTIVIDAD ESPECÍFICA (La que fallaba)
// ⚠️ CORREGIDO: Quitamos "/teacher" del inicio
router.get('/activity/:activityId/grades', checkJwt, getActivityGrades);
router.post('/activity/:activityId/grade', checkJwt, saveActivityGrade);

// RUTAS DE ASISTENCIA
router.get("/attendance", checkJwt, getAttendance);
router.post("/attendance", checkJwt, saveAttendance);

// RUTAS DE AGENDA
router.get("/calendar", checkJwt, getEvents);
router.post("/calendar", checkJwt, createEvent);
router.delete("/calendar/:id", checkJwt, deleteEvent);

export { router };