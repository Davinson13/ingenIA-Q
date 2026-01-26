import { Router } from "express";
import { checkJwt } from "../middleware/session";

// 1. IMPORTAMOS LAS FUNCIONES DEL CONTROLADOR QUE ARREGLAMOS (teacher.ts)
import {
  getTeacherDashboard,
  createTutoring,
  getTeacherCourses,
  getCourseGrades,        // Info cabecera del curso
  getCourseGradeMatrix,   // 👈 ESTA ES LA QUE ARREGLAMOS (Notas + Asistencia)
  getActivityGrades,      // Ver notas de una actividad específica
  saveActivityGrade,      // Guardar nota
  getDailyAttendance,     // Asistencia (lectura)
  saveDailyAttendance,    // Asistencia (guardado con fix de fecha)
  updateStudentGrade      // Actualizar nota final (si se usa)
} from "../controllers/teacher";

// 2. IMPORTAMOS LAS FUNCIONES DE CALENDARIO (calendar.ts)
import {
  getEvents,
  createEvent,            // 👈 Esta tiene el fix de teacherId y fechas
  deleteEvent
} from "../controllers/calendar";

const router = Router();

// Middleware de seguridad: Todas las rutas requieren login
router.use(checkJwt);

// --- RUTAS DASHBOARD Y CURSOS ---
router.get("/dashboard", getTeacherDashboard);
router.post("/tutoring", createTutoring);
router.get("/courses", getTeacherCourses);

// --- RUTAS DE CALIFICACIONES (MATRIZ GENERAL) ---
// Esta obtiene el nombre del curso para el header
router.get("/grades/:courseId", getCourseGrades);

// 🔥 ESTA ES LA CLAVE: Debe apuntar a getCourseGradeMatrix
router.get("/grade-matrix/:courseId", getCourseGradeMatrix);

// --- RUTAS PARA ACTIVIDAD ESPECÍFICA ---
// Ver lista de estudiantes de una tarea
router.get('/activity/:activityId', getActivityGrades); // Nota: quité el /grades extra para simplificar
// Calificar a un estudiante en esa tarea
router.post('/activity/:activityId/grade', saveActivityGrade);

// --- RUTAS DE ASISTENCIA ---
router.get("/attendance", getDailyAttendance);
router.post("/attendance", saveDailyAttendance);

// --- RUTAS DE AGENDA / EVENTOS ---
router.get("/calendar", getEvents);
router.post("/calendar", createEvent);
router.delete("/calendar/:id", deleteEvent);

// --- EXTRA ---
router.put("/grades", updateStudentGrade);

export { router };