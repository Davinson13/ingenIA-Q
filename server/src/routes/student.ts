import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { 
  getStudentStats, 
  getWeeklySchedule, 
  getMyCourses,          // <--- ESTA ES NUEVA (Reemplaza a getStudentGrades)
  getStudentCourseDetails 
} from "../controllers/student";

const router = Router();

// 1. Estadísticas para el Dashboard
router.get("/stats", checkJwt, getStudentStats);

// 2. Horario para el Calendario
router.get("/schedule", checkJwt, getWeeklySchedule);

// 3. Lista de Materias (Tarjetas)
router.get("/courses", checkJwt, getMyCourses);

// 4. Detalle de una Materia (Notas, Agenda, Asistencia)
router.get("/course/:courseId", checkJwt, getStudentCourseDetails);

export { router };