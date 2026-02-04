import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
    getAdminDashboard,
    getPeriods, createPeriod, togglePeriodStatus,
    getAcademicStructure, createParallel, addSchedule,
    getAdminUsers, updateUserRole, updateCourse, deleteCourse,
    updatePeriod, deletePeriod, deleteSchedule, getCareersList, 
    updateUser
} from "../controllers/admin";

const router = Router();

// Middleware de seguridad: Solo ADMIN (podrías añadir validación de rol extra aquí)
router.use(checkJwt);

// Dashboard
// 👇 2. AGREGA ESTA RUTA NUEVA 👇
router.get("/dashboard/stats", checkJwt, getAdminDashboard);

// Periodos
router.get("/periods", getPeriods);
router.post("/periods", createPeriod);
router.put("/periods/:id/toggle", togglePeriodStatus);
router.put("/period/:id", checkJwt, togglePeriodStatus); // Activar/Desactivar
router.put("/period/data/:id", checkJwt, updatePeriod);  // 🔥 Editar Datos
router.delete("/period/:id", checkJwt, deletePeriod);    // 🔥 Eliminar
// Académico
router.get("/academic/structure", getAcademicStructure);
router.post("/academic/parallel", createParallel);
router.post("/academic/schedule", addSchedule);
router.put("/course/:id", checkJwt, updateCourse);    // Editar
router.delete("/course/:id", checkJwt, deleteCourse); // Eliminar
// Rutas de Horarios
router.delete("/schedule/:id", checkJwt, deleteSchedule);
// Usuarios
router.get("/users", getAdminUsers);
router.post("/users/role", updateUserRole);
router.get("/users/careers", checkJwt, getCareersList); // 🔥 Nueva ruta para el dropdown
router.put("/users/:id", checkJwt, updateUser);



export { router };