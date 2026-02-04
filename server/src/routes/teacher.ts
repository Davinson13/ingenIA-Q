import { Router } from "express";
import { checkJwt } from "../middleware/session";

// 1. IMPORTAMOS LAS FUNCIONES DEL CONTROLADOR QUE ARREGLAMOS (teacher.ts)
import {
  getTeacherDashboard,
  createTutoring,
  getTutorings,
  getTeacherCourses,
  getCourseGrades,        // Info cabecera del curso
  getCourseGradeMatrix,   // 👈 ESTA ES LA QUE ARREGLAMOS (Notas + Asistencia)
  getActivityGrades,      // Ver notas de una actividad específica
  saveActivityGrade,      // Guardar nota
  getDailyAttendance,     // Asistencia (lectura)
  saveDailyAttendance,    // Asistencia (guardado con fix de fecha)
  updateStudentGrade,     // Actualizar nota final (si se usa)
  removeStudent
} from "../controllers/teacher";

// 2. IMPORTAMOS LAS FUNCIONES DE CALENDARIO (calendar.ts)
// Importa las nuevas funciones de calendar.ts
import {
  getMonthAgenda,
  createPersonalEvent,
  deletePersonalEvent,
  getEvents,      // 👈 Asegúrate de importar esto
  createEvent,     // 👈 Y esto
  deleteEvent
} from "../controllers/calendar";

const router = Router();

// Middleware de seguridad: Todas las rutas requieren login
router.use(checkJwt);

// --- RUTAS DASHBOARD Y CURSOS ---
router.get("/dashboard", getTeacherDashboard);
router.post("/tutoring", createTutoring);
router.get("/tutorings", getTutorings);
router.get("/courses", getTeacherCourses);
// 🔥 Nueva ruta para expulsar (recibe datos en el body)
router.delete("/student", checkJwt, removeStudent);

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
// Reemplaza las anteriores de calendar por estas:
router.get("/calendar", getMonthAgenda); // Obtener todo el mes
router.post("/calendar/personal", createPersonalEvent); // Crear extracurricular
router.delete("/calendar/personal/:id", deletePersonalEvent); // Borrar extracurricular

// 2. Eventos Académicos (Lo que usa "Mis Cursos")
router.get("/events", getEvents);        // 👈 NUEVA RUTA para listar actividades del curso
router.post("/events", createEvent);     // 👈 NUEVA RUTA para crear tarea/examen
router.delete("/events/:id", deleteEvent); // (Si tienes deleteEvent impórtalo también)

// --- EXTRA ---
router.put("/grades", updateStudentGrade);

export { router };