import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

// =====================================================================
// 1. DASHBOARD ADMIN
// =====================================================================

export const getAdminDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
        const totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });

        // Contamos quiénes tienen requestingCareer = true
        const pendingRequests = await prisma.user.count({
            where: { requestingCareer: true }
        });

        // Buscamos periodo activo para mostrar el nombre
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        const totalSubjects = await prisma.subject.count();

        res.send({
            users: totalUsers,
            students: totalStudents,
            teachers: totalTeachers,
            pendingRequests,
            activePeriod: activePeriod ? activePeriod.name : "Ninguno", // Para que no salga vacío
            subjects: totalSubjects
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_DASHBOARD_STATS");
    }
};
// ... imports

// 1. OBTENER USUARIOS (CON CARRERA)
export const getAdminUsers = async (req: RequestWithUser, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { fullName: 'asc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                requestingCareer: true, // 👈 ¡ESTO ES LO QUE FALTA!
                career: { select: { id: true, name: true } }
            }
        });
        res.send(users);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_USERS");
    }
};

// 2. OBTENER LISTA SIMPLE DE CARRERAS (Para el Select)
export const getCareersList = async (req: RequestWithUser, res: Response) => {
    try {
        const careers = await prisma.career.findMany({
            select: { id: true, name: true }
        });
        res.send(careers);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_CAREERS");
    }
};

// 🔥 ACTUALIZAR ROL Y CARRERA (Versión corregida)
export const updateUser = async (req: RequestWithUser, res: Response) => {
    try {
        const { id } = req.params;
        const { role, careerId } = req.body;

        // Validamos y convertimos el careerId
        let finalCareerId: number | null = null;

        if (role === 'STUDENT' && careerId) {
            const parsedId = parseInt(String(careerId));
            if (!isNaN(parsedId) && parsedId > 0) {
                finalCareerId = parsedId;
            }
        }

        await prisma.user.update({
            where: { id: parseInt(String(id)) },
            data: {
                role: role,
                careerId: finalCareerId,
                // Si le asignamos carrera, apagamos la solicitud
                requestingCareer: finalCareerId ? false : undefined
            }
        });

        res.send({ message: "Usuario actualizado correctamente." });
    } catch (e) {
        console.error("Error actualizando usuario:", e);
        res.status(500).send("ERROR_UPDATING_USER");
    }
};

// ... Asegúrate de exportar getCareersList y updateUser al final

// =====================================================================
// 2. GESTIÓN DE PERIODOS ACADÉMICOS
// =====================================================================
export const getPeriods = async (req: RequestWithUser, res: Response) => {
    try {
        const periods = await prisma.academicPeriod.findMany({ orderBy: { startDate: 'desc' } });
        res.send(periods);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_PERIODS");
    }
};

export const createPeriod = async (req: RequestWithUser, res: Response) => {
    try {
        const { name, startDate, endDate } = req.body;

        // Desactivar todos los anteriores antes de crear uno nuevo activo
        await prisma.academicPeriod.updateMany({ data: { isActive: false } });

        const period = await prisma.academicPeriod.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: true
            }
        });
        res.send(period);
    } catch (e) {
        res.status(500).send("ERROR_CREATING_PERIOD");
    }
};

export const togglePeriodStatus = async (req: RequestWithUser, res: Response) => {
    try {
        const { id } = req.params;
        const periodId = parseInt(String(id)); // 🔥 Corrección de tipo

        if (isNaN(periodId)) return res.status(400).send("ID inválido");

        const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } });

        if (!period) return res.status(404).send("Periodo no encontrado");

        // Si se activa este, desactivar los demás
        if (!period.isActive) {
            await prisma.academicPeriod.updateMany({ data: { isActive: false } });
        }

        const updated = await prisma.academicPeriod.update({
            where: { id: periodId },
            data: { isActive: !period.isActive }
        });

        res.send(updated);
    } catch (e) {
        res.status(500).send("ERROR_TOGGLE_PERIOD");
    }
};

// =====================================================================
// 3. ESTRUCTURA ACADÉMICA (Carreras, Materias y Paralelos)
// =====================================================================

// 🟢 MODIFICADO: TRAER TAMBIÉN LOS HORARIOS
export const getAcademicStructure = async (req: Request, res: Response) => {
    try {
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        const careers = await prisma.career.findMany({
            include: {
                subjects: {
                    include: {
                        parallels: {
                            where: activePeriod ? { periodId: activePeriod.id } : undefined,
                            include: {
                                teacher: true,
                                schedules: true // 🔥 IMPORTANTE: Incluir horarios
                            }
                        }
                    }
                }
            }
        });
        res.json(careers);
    } catch (error) {
        res.status(500).json({ error: "Error estructura académica" });
    }
};

// ... (Tus otras funciones existentes: createParallel, etc.) ...

// 🔥 NUEVO: ACTUALIZAR PERIODO (Nombre/Fechas)
export const updatePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate } = req.body;

        await prisma.academicPeriod.update({
            where: { id: parseInt(String(id)) },
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });
        res.json({ message: "Periodo actualizado" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar periodo" });
    }
};

// 🔥 NUEVO: ELIMINAR PERIODO
// 🔥 NUEVO: ELIMINAR PERIODO (EN CASCADA TRANSACCIONAL)
export const deletePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const periodId = parseInt(String(id));

        // Usamos una transacción para garantizar que se borre todo o nada
        await prisma.$transaction(async (tx) => {

            // 1. Identificar los paralelos involucrados
            const parallels = await tx.parallel.findMany({
                where: { periodId: periodId },
                select: { id: true }
            });

            const parallelIds = parallels.map(p => p.id);

            if (parallelIds.length > 0) {
                // --- NIVEL 3: DETALLES (Nietos) ---

                // Borrar Notas
                await tx.activityGrade.deleteMany({
                    where: { event: { parallelId: { in: parallelIds } } }
                });

                // Borrar Asistencias (vinculadas a inscripciones de estos paralelos)
                await tx.attendance.deleteMany({
                    where: { enrollment: { parallelId: { in: parallelIds } } }
                });

                // Borrar Horarios
                await tx.schedule.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // --- NIVEL 2: ESTRUCTURA (Hijos) ---

                // Borrar Eventos de Agenda (Exámenes, Deberes)
                await tx.event.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // 🔥 ESTO FALTABA: Borrar Rubros de Evaluación (Actividades)
                // (Gestión Individual, Examen Final, etc.)
                await tx.activity.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // Borrar Inscripciones
                await tx.enrollment.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // --- NIVEL 1: CURSOS (Padres) ---

                // Borrar los Paralelos
                await tx.parallel.deleteMany({
                    where: { periodId: periodId }
                });
            }

            // --- NIVEL 0: PERIODO (Raíz) ---

            // Finalmente borrar el Periodo
            await tx.academicPeriod.delete({
                where: { id: periodId }
            });
        });

        res.json({ message: "Periodo eliminado correctamente." });

    } catch (error) {
        console.error("Error CRÍTICO eliminando periodo:", error);
        res.status(500).json({ error: "No se pudo eliminar el periodo. Revisa la consola del servidor." });
    }
};



// 🔥 NUEVO: ELIMINAR HORARIO
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.schedule.delete({ where: { id: parseInt(String(id)) } });
        res.json({ message: "Horario eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar horario" });
    }
};

// Crear Paralelo (Curso)
export const createParallel = async (req: RequestWithUser, res: Response) => {
    try {
        const { subjectId, code, capacity, teacherId } = req.body;

        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        if (!activePeriod) {
            return res.status(400).send("No hay periodo activo. Crea uno primero.");
        }

        const newParallel = await prisma.parallel.create({
            data: {
                code,
                capacity: parseInt(capacity),
                subjectId: parseInt(subjectId),
                periodId: activePeriod.id,
                teacherId: parseInt(teacherId)
            }
        });

        // 🔥 Crear estructura de evaluación por defecto
        // Esto evita que el curso nazca sin categorías de notas
        await prisma.activity.createMany({
            data: [
                { name: "Gestión Individual", type: "INDIVIDUAL", maxScore: 7.0, parallelId: newParallel.id },
                { name: "Gestión Grupal", type: "GRUPAL", maxScore: 5.0, parallelId: newParallel.id },
                { name: "Examen Medio", type: "MEDIO", maxScore: 2.0, parallelId: newParallel.id },
                { name: "Examen Final", type: "FINAL", maxScore: 6.0, parallelId: newParallel.id }
            ]
        });

        res.send(newParallel);
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_CREATING_PARALLEL");
    }
};

// EDITAR CURSO (Cambiar Profe o Cupo)
export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { teacherId, capacity } = req.body;

        // 🔥 Corrección de tipos: String(id)
        const courseId = parseInt(String(id));

        await prisma.parallel.update({
            where: { id: courseId },
            data: {
                teacherId: teacherId ? parseInt(String(teacherId)) : undefined,
                capacity: capacity ? parseInt(String(capacity)) : undefined
            }
        });

        res.json({ message: "Curso actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error actualizando curso" });
    }
};

// ELIMINAR CURSO
export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 🔥 Corrección de tipos: String(id)
        const courseId = parseInt(String(id));

        // 1. Validar si tiene alumnos inscritos
        const enrolled = await prisma.enrollment.count({
            where: { parallelId: courseId }
        });

        if (enrolled > 0) {
            return res.status(400).json({ error: "No se puede eliminar: Hay estudiantes inscritos." });
        }

        // 2. Limpieza en orden (Horarios -> Actividades -> Paralelo)

        // Borrar horarios
        await prisma.schedule.deleteMany({ where: { parallelId: courseId } });

        // Borrar actividades (categorías de notas) creadas automáticamente
        await prisma.activity.deleteMany({ where: { parallelId: courseId } });

        // Borrar paralelo
        await prisma.parallel.delete({ where: { id: courseId } });

        res.json({ message: "Curso eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error eliminando curso" });
    }
};

export const addSchedule = async (req: RequestWithUser, res: Response) => {
    try {
        const { parallelId, dayOfWeek, startTime, endTime } = req.body;

        const schedule = await prisma.schedule.create({
            data: {
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                parallelId: parseInt(parallelId)
            }
        });
        res.send(schedule);
    } catch (e) {
        res.status(500).send("ERROR_ADDING_SCHEDULE");
    }
};

// =====================================================================
// 4. GESTIÓN DE USUARIOS
// =====================================================================

export const updateUserRole = async (req: RequestWithUser, res: Response) => {
    try {
        const { id, role } = req.body;
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role }
        });
        res.send(user);
    } catch (e) {
        res.status(500).send("ERROR_UPDATING_ROLE");
    }
};