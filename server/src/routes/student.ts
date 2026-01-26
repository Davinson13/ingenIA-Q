import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
  getWeeklySchedule,
  getMyCourses,          // <--- ESTA ES NUEVA (Reemplaza a getStudentGrades)
  getStudentCourseDetails,
  submitActivity,
  getAvailableTutorings,
  bookTutoring,
  getStudentDashboard
} from "../controllers/student";

import {
  getStudentAgenda,
  createPersonalEvent,
  deletePersonalEvent,
  createExternalCourse
} from "../controllers/calendar";

const router = Router();

router.use(checkJwt);

// 1. Estadísticas para el Dashboard
router.get("/dashboard", checkJwt, getStudentDashboard);

// 2. Horario para el Calendario
router.get("/schedule", checkJwt, getWeeklySchedule);

// 3. Lista de Materias (Tarjetas)
router.get("/courses", checkJwt, getMyCourses);

// 4. Detalle de una Materia (Notas, Agenda, Asistencia)
router.get("/course/:courseId", checkJwt, getStudentCourseDetails);

router.post("/submit", checkJwt, submitActivity);

// AGENDA ESTUDIANTE
router.get("/calendar", getStudentAgenda);
router.post("/calendar/personal", createPersonalEvent);
router.delete("/calendar/personal/:id", deletePersonalEvent);
router.post("/calendar/external", createExternalCourse); // Curso complementario

router.get("/tutorings/available", getAvailableTutorings); // Ver lista
router.post("/tutorings/book", bookTutoring);              // Reservar

export { router };