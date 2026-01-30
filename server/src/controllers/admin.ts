import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

// =====================================================================
// 1. DASHBOARD ADMIN
// =====================================================================
export const getAdminStats = async (req: RequestWithUser, res: Response) => {
    try {
        const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
        const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        const totalSubjects = await prisma.subject.count();

        res.send({
            students: studentCount,
            teachers: teacherCount,
            activePeriod: activePeriod ? activePeriod.name : "Ninguno",
            subjects: totalSubjects
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_GETTING_STATS");
    }
};

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
        const periodId = parseInt(id as string); // 🔥 CORRECCIÓN: 'as string' evita error de TS

        if (isNaN(periodId)) {
            res.status(400).send("ID inválido");
            return;
        }

        const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } });

        if (!period) {
            res.status(404).send("Periodo no encontrado");
            return;
        }

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
// 3. GESTIÓN DE MATERIAS Y PARALELOS
// =====================================================================
export const getCareersWithSubjects = async (req: RequestWithUser, res: Response) => {
    try {
        const careers = await prisma.career.findMany({
            include: {
                subjects: {
                    include: { parallels: true }
                }
            }
        });
        res.send(careers);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_CAREERS");
    }
};

export const createParallel = async (req: RequestWithUser, res: Response) => {
    try {
        const { subjectId, code, capacity, teacherId } = req.body;

        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        if (!activePeriod) {
            res.status(400).send("No hay periodo activo. Crea uno primero.");
            return;
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

        // Crear estructura de evaluación
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
export const getUsers = async (req: RequestWithUser, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { fullName: 'asc' }
        });
        res.send(users);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_USERS");
    }
};

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