import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { getTeacherDashboard, createTutoring, getTeacherCourses, getCourseGrades, updateStudentGrade } from "../controllers/teacher";
import { 
  getGradeMatrix,      // <--- IMPORTANTE
  updateActivityGrade  // <--- IMPORTANTE
} from "../controllers/grades";


const router = Router();

// Rutas protegidas para docentes
router.get("/dashboard", checkJwt, getTeacherDashboard);
router.post("/tutoring", checkJwt, createTutoring);
router.get("/courses", checkJwt, getTeacherCourses);
router.get("/grades/:courseId", checkJwt, getCourseGrades);
router.put("/grades", checkJwt, updateStudentGrade);

// 2. AGREGAR LAS RUTAS DE CALIFICACIONES (Esto es lo que falta)
router.get("/grade-matrix/:courseId", checkJwt, getGradeMatrix);
router.post("/grade-activity", checkJwt, updateActivityGrade);

export { router };