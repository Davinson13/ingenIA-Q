import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

// 1. DASHBOARD DOCENTE
const getTeacherDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;
        const parallels = await prisma.parallel.findMany({
            where: { teacherId: teacherId },
            include: { subject: true, period: true, schedules: true }
        });

        const courses = parallels.map(p => ({
            id: p.subject.id,
            subjectName: p.subject.name,
            code: p.code,
            period: p.period.name,
            schedule: p.schedules.map(s => ({
                id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime
            }))
        }));

        res.send({ courses, tutorings: [] });
    } catch (e) { console.log(e); res.status(500).send("ERROR"); }
};

// 2. CREAR TUTORÍA
const createTutoring = async (req: RequestWithUser, res: Response) => {
    res.send({ message: "Simulado" });
};

// 3. MIS CURSOS
const getTeacherCourses = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;
        const courses = await prisma.parallel.findMany({
            where: { teacherId: teacherId },
            include: { subject: true, period: true, schedules: true }
        });

        const coursesWithStudents = await Promise.all(courses.map(async (course) => {
            const count = await prisma.enrollment.count({
                where: { subjectId: course.subjectId, status: 'TAKING' }
            });
            return {
                id: course.id,
                subjectName: course.subject.name,
                code: course.code,
                period: course.period.name,
                studentCount: count
            };
        }));
        res.send(coursesWithStudents);
    } catch (e) { console.log(e); res.status(500).send("ERROR"); }
};

// 4. HEADER DEL CURSO
const getCourseGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.params;
        const idParseado = parseInt(String(courseId));
        if (isNaN(idParseado)) { res.status(400).send("ID_INVALIDO"); return; }

        const parallel = await prisma.parallel.findUnique({
            where: { id: idParseado },
            include: { subject: true }
        });

        if (!parallel) { res.status(404).send("CURSO_NO_ENCONTRADO"); return; }

        res.send({ courseName: parallel.subject.name, parallelCode: parallel.code });
    } catch (e) { console.log(e); res.status(500).send("ERROR"); }
};

// 5. DETALLE DE ACTIVIDAD (CORREGIDO)
const getActivityGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const eventId = parseInt(String(activityId));

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) { res.status(404).send("ACTIVIDAD_NO_ENCONTRADA"); return; }

        const parallel = await prisma.parallel.findUnique({ where: { id: event.parallelId } });
        if (!parallel) { res.status(404).send("PARALELO_NO_ENCONTRADO"); return; }

        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: 'TAKING',
                OR: [
                    { parallelId: parallel.id },
                    { subjectId: parallel.subjectId, parallelId: null }
                ]
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        // 🔥 FIX: Buscamos notas ignorando tipado estricto
        const grades = await prisma.activityGrade.findMany({
            where: { eventId: eventId } as any
        });

        const roster = enrollments.map(enrollment => {
            const submission = (grades as any[]).find(g => g.studentId === enrollment.user.id);
            return {
                studentId: enrollment.user.id,
                fullName: enrollment.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enrollment.user.fullName}&background=random`,
                score: (submission && submission.score !== null) ? submission.score : '',
                submissionLink: submission?.submissionLink || null,
                feedback: submission?.feedback || '',
                submittedAt: submission?.submittedAt || null,
                hasGrade: (submission && submission.score !== null)
            };
        });

        res.send({
            activity: {
                id: event.id,
                title: event.title,
                description: event.description,
                limitDate: event.date
            },
            students: roster
        });

    } catch (e) { console.error(e); res.status(500).send("ERROR"); }
};

// 6. GUARDAR NOTA
const saveActivityGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const { studentId, score, feedback } = req.body;

        const eventIdInt = parseInt(String(activityId));
        const studentIdInt = parseInt(String(studentId));

        const whereClause: any = {
            studentId_eventId: { studentId: studentIdInt, eventId: eventIdInt }
        };

        const submission = await prisma.activityGrade.upsert({
            where: whereClause,
            update: { score: parseFloat(score), feedback: feedback },
            create: {
                studentId: studentIdInt,
                eventId: eventIdInt,
                score: parseFloat(score),
                feedback: feedback
            } as any
        });
        res.send(submission);
    } catch (e) { console.error(e); res.status(500).send("ERROR"); }
};

// 🟢 7. MATRIZ DE NOTAS + ASISTENCIA (Lógica Completa)
const getCourseGradeMatrix = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.params;
        const parallelId = parseInt(String(courseId));

        if (isNaN(parallelId)) { res.status(400).send("ID INVALIDO"); return; }

        // 1. Buscamos el paralelo y sus eventos
        const parallel = await prisma.parallel.findUnique({
            where: { id: parallelId },
            include: { events: true }
        });

        if (!parallel) return res.status(404).send("Curso no encontrado");

        // 2. Buscamos estudiantes
        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: parallelId }, { subjectId: parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true }
        });

        // 3. Traemos NOTAS
        const eventsWithGrades = await prisma.event.findMany({
            where: { parallelId: parallelId },
            include: { ActivityGrade: true } as any
        });

        // 4. 🔥 NUEVO: Traemos TODA la ASISTENCIA de este curso
        const allAttendance = await prisma.attendance.findMany({
            where: {
                enrollmentId: { in: enrollments.map(e => e.id) }
            }
        });

        const WEIGHTS: any = { 'INDIVIDUAL': 7, 'GRUPAL': 5, 'MEDIO': 2, 'FINAL': 6 };

        const matrix = enrollments.map(enr => {
            const studentId = enr.userId;

            // --- A. CÁLCULO DE NOTAS (Igual que antes) ---
            const acc: any = {
                'INDIVIDUAL': { sum: 0, count: 0 }, 'GRUPAL': { sum: 0, count: 0 },
                'MEDIO': { sum: 0, count: 0 }, 'FINAL': { sum: 0, count: 0 }
            };

            eventsWithGrades.forEach((evt: any) => {
                const gradesArray = evt.ActivityGrade || evt.activityGrades || [];
                const grade = gradesArray.find((g: any) => g.studentId === studentId);
                const typeKey = evt.type ? evt.type.toUpperCase() : 'INDIVIDUAL';

                if (grade && grade.score !== null && acc[typeKey]) {
                    acc[typeKey].sum += Number(grade.score);
                    acc[typeKey].count += 1;
                }
            });

            let finalTotal = 0;
            const breakdown: any = {};
            Object.keys(WEIGHTS).forEach(key => {
                const data = acc[key];
                let weighted = 0;
                if (data.count > 0) {
                    weighted = (data.sum / data.count / 20) * WEIGHTS[key];
                }
                breakdown[key] = parseFloat(weighted.toFixed(2));
                finalTotal += weighted;
            });

            // --- B. 🔥 CÁLCULO DE ASISTENCIA ---
            // Filtramos las asistencias de ESTE estudiante
            const studentAtt = allAttendance.filter(a => a.enrollmentId === enr.id);

            let totalPoints = 0;
            let maxPoints = studentAtt.length * 2; // Cada clase vale 2 puntos máx

            studentAtt.forEach(att => {
                if (att.status === 'PRESENT') totalPoints += 2;
                else if (att.status === 'LATE') totalPoints += 1;
                else if (att.status === 'EXCUSED') totalPoints += 2; // Justificado cuenta como asistencia
                // ABSENT suma 0
            });

            // Si no hay clases registradas, asumimos 100% para no reprobar al inicio
            let attendancePct = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 100;

            return {
                studentId,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                breakdown,
                finalTotal: parseFloat(finalTotal.toFixed(2)),
                attendancePct: parseFloat(attendancePct.toFixed(2)) // Enviamos el %
            };
        });

        const courseSum = matrix.reduce((acc, curr) => acc + curr.finalTotal, 0);
        const courseAverage = matrix.length > 0 ? (courseSum / matrix.length) : 0;

        res.send({
            students: matrix,
            courseAverage: parseFloat(courseAverage.toFixed(2))
        });

    } catch (e) {
        console.error("Error en Matriz:", e);
        res.status(500).send("ERROR_GETTING_GRADE_MATRIX");
    }
};

// 8. ASISTENCIA
const getDailyAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.query;
        const dateStr = String(req.query.date);
        const parallelId = parseInt(String(courseId));

        if (!courseId || !dateStr) { res.status(400).send("Faltan datos"); return; }

        const parallel = await prisma.parallel.findUnique({ where: { id: parallelId } });
        if (!parallel) { res.status(404).send("Paralelo no encontrado"); return; }

        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: parallelId }, { subjectId: parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        const startDate = new Date(dateStr);
        const endDate = new Date(dateStr);
        endDate.setDate(endDate.getDate() + 1);

        const attendances = await prisma.attendance.findMany({
            where: {
                date: { gte: startDate, lt: endDate },
                enrollmentId: { in: enrollments.map(e => e.id) }
            }
        });

        const result = enrollments.map(enr => {
            const att = attendances.find(a => a.enrollmentId === enr.id);
            return {
                enrollmentId: enr.id,
                studentId: enr.user.id,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                status: att ? att.status : 'PRESENT'
            };
        });
        res.send(result);
    } catch (e) { console.error(e); res.status(500).send("ERROR"); }
};

// 9. GUARDAR ASISTENCIA (CORREGIDO: Mediodía + Validación Fecha Futura)
const saveDailyAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { date, records } = req.body;

        // 1. VALIDACIÓN: No permitir marcar asistencia en días futuros
        const today = new Date();
        const selectedDate = new Date(date);

        // Normalizamos a medianoche para comparar solo fechas sin horas
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            res.status(400).send("No puedes marcar asistencia en fechas futuras.");
            return;
        }

        // 2. FIX DE ZONA HORARIA: Guardar a las 12:00 del mediodía UTC
        // Esto asegura que en Ecuador (UTC-5) sean las 07:00 AM del MISMO DÍA.
        const dateObj = new Date(`${date}T12:00:00.000Z`);

        await Promise.all(records.map((r: any) => {
            return prisma.attendance.upsert({
                where: {
                    date_enrollmentId: {
                        enrollmentId: r.enrollmentId,
                        date: dateObj
                    }
                },
                update: { status: r.status },
                create: {
                    enrollmentId: r.enrollmentId,
                    date: dateObj,
                    status: r.status
                }
            });
        }));
        res.send({ message: "Guardado correctamente" });
    } catch (e) {
        console.error("Error guardando asistencia:", e);
        res.status(500).send("ERROR_SAVING_ATTENDANCE");
    }
};

// 10. ACTUALIZAR NOTA FINAL (Necesaria para router)
const updateStudentGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { enrollmentId, grade } = req.body;
        const updated = await prisma.enrollment.update({
            where: { id: parseInt(String(enrollmentId)) },
            data: { finalGrade: parseFloat(grade) }
        });
        res.send(updated);
    } catch (e) { console.error(e); res.status(500).send("ERROR_UPDATING_GRADE"); }
};

export {
    getTeacherDashboard,
    createTutoring,
    getTeacherCourses,
    getCourseGrades,
    getActivityGrades,
    saveActivityGrade,
    getCourseGradeMatrix,
    getDailyAttendance,
    saveDailyAttendance,
    updateStudentGrade
};