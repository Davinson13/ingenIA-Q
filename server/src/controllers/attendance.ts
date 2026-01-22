import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

// 1. OBTENER ASISTENCIA
const getAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId, date } = req.query;

        if (!courseId) { res.status(400).send("Falta courseId"); return; }

        const parallelId = parseInt(String(courseId));
        let searchDate = new Date(String(date));
        if (isNaN(searchDate.getTime())) searchDate = new Date();

        const parallel = await prisma.parallel.findUnique({ where: { id: parallelId } });
        if (!parallel) { res.status(404).send("Curso no encontrado"); return; }

        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "TAKING",
                OR: [{ parallelId: parallelId }, { subjectId: parallel.subjectId, parallelId: null }]
            },
            include: {
                user: true,
                attendance: { where: { date: searchDate } }
            },
            orderBy: { user: { fullName: "asc" } }
        });

        const data = enrollments.map(e => ({
            enrollmentId: e.id,
            studentId: e.user.id,
            fullName: e.user.fullName,
            avatar: `https://ui-avatars.com/api/?name=${e.user.fullName}&background=random`,
            status: e.attendance.length > 0 ? e.attendance[0].status : null
        }));

        res.send(data);
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_GETTING_ATTENDANCE");
    }
};

// 2. GUARDAR ASISTENCIA (CORREGIDO EL ERROR enrollmentId_date)
const saveAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { date, records } = req.body; 

        if (!records || !Array.isArray(records)) {
            res.status(400).send("Datos inválidos");
            return;
        }

        let saveDate = new Date(String(date));
        if (isNaN(saveDate.getTime())) saveDate = new Date();

        const operations = records.map((rec: any) => {
            // 👇 CORRECCIÓN: Cambiamos 'enrollmentId_date' por 'date_enrollmentId'
            // Según el error de Prisma, este es el nombre correcto de la clave en tu BD.
            const whereClause: any = {
                date_enrollmentId: { // <--- CAMBIO AQUÍ
                    enrollmentId: rec.enrollmentId,
                    date: saveDate
                }
            };

            return prisma.attendance.upsert({
                where: whereClause,
                update: { status: rec.status },
                create: {
                    enrollmentId: rec.enrollmentId,
                    date: saveDate,
                    status: rec.status
                }
            });
        });

        await prisma.$transaction(operations);
        res.send({ message: "Asistencia guardada" });

    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_SAVING_ATTENDANCE");
    }
};

export { getAttendance, saveAttendance };