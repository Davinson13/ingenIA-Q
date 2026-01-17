import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { 
  getStudentStats, 
  getWeeklySchedule, 
  getStudentGrades,
  getStudentCourseDetails
} from "../controllers/student";

const router = Router();

// -----------------------------------------------------------
// AGREGA ESTA LÍNEA (Es la que te faltaba):
router.get("/stats", checkJwt, getStudentStats); 
// -----------------------------------------------------------

// Esta ya la tenías bien:
router.get("/schedule", checkJwt, getWeeklySchedule);

router.get("/course/:courseId", checkJwt, getStudentCourseDetails);

export { router };