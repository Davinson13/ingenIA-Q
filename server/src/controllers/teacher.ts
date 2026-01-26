import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

// 🟢 1. DASHBOARD DEL DOCENTE (CORREGIDO: Conteo de Estudiantes)
// ... (imports anteriores)

// 🟢 1. DASHBOARD (MODIFICADO: AHORA INCLUYE TUTORÍAS)
const getTeacherDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ... (La parte de courses, students y pendingGrades se queda IGUAL) ...
        // ... (Copia la lógica de los pasos 1, 2, 3, 4 y 5 del código anterior) ...

        // 1. Cursos
        const courses = await prisma.parallel.findMany({
            where: { teacherId: teacherId },
            include: { subject: true, _count: { select: { enrollments: true } } }
        });
        const totalCourses = courses.length;

        // 2. Estadística de Cursos (Para gráficas)
        const courseStats = await Promise.all(courses.map(async (c) => {
            const studentCount = await prisma.enrollment.count({
                where: { OR: [{ parallelId: c.id }, { subjectId: c.subjectId, parallelId: null }], status: 'TAKING' }
            });
            const grades = await prisma.activityGrade.findMany({
                where: { event: { parallelId: c.id }, score: { not: null } }, select: { score: true }
            });
            const sum = grades.reduce((acc, g) => acc + (g.score || 0), 0);
            const avg = grades.length > 0 ? (sum / grades.length) : 0;
            return { id: c.id, name: c.subject.name, code: c.code, students: studentCount, average: parseFloat(avg.toFixed(2)) };
        }));

        const totalStudents = courseStats.reduce((acc, c) => acc + c.students, 0);
        const riskCount = courseStats.filter(c => c.average > 0 && c.average < 14).length;
        const pendingGrades = await prisma.activityGrade.count({
            where: { event: { parallel: { teacherId: teacherId } }, submissionLink: { not: null }, score: null }
        });

        // 6. 🔥 AGENDA HÍBRIDA (CLASES + TUTORÍAS)

        // A. Buscamos EVENTOS académicos (Exámenes, tareas)
        const academicEvents = await prisma.event.findMany({
            where: { parallel: { teacherId: teacherId }, date: { gte: today } },
            include: { parallel: { include: { subject: true } } }
        });

        // B. Buscamos TUTORÍAS creadas por el docente
        const tutoringEvents = await prisma.tutoring.findMany({
            where: { teacherId: teacherId, date: { gte: today } },
            include: { subject: true }
        });

        // C. Unificamos y ordenamos
        const mixedEvents = [
            ...academicEvents.map(evt => ({
                id: evt.id,
                title: evt.title,
                date: evt.date,
                type: evt.type, // INDIVIDUAL, GRUPAL, etc.
                courseName: evt.parallel.subject.name,
                isTutoring: false
            })),
            ...tutoringEvents.map(tut => ({
                id: tut.id,
                title: "Tutoría: " + (tut.notes || "General"),
                date: tut.date,
                type: "TUTORIA", // Tipo especial para el front
                courseName: tut.subject ? tut.subject.name : "Todas las materias",
                isTutoring: true
            }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5); // Tomamos los 5 próximos reales

        res.send({
            stats: { courses: totalCourses, students: totalStudents, pending: pendingGrades, risk: riskCount },
            courseStats,
            nextEvents: mixedEvents // Enviamos la lista mezclada
        });

    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_DASHBOARD");
    }
};

// 🟢 10. CREAR TUTORÍA (Con Modalidad)
const createTutoring = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;
        // 👇 Recibimos 'modality'
        const { date, time, subjectId, capacity, notes, modality } = req.body;

        const dateTimeString = `${date}T${time}:00.000Z`;
        const finalSubjectId = (subjectId && subjectId !== "0" && subjectId !== 0) ? parseInt(subjectId) : null;

        const tutoring = await prisma.tutoring.create({
            data: {
                date: dateTimeString,
                capacity: parseInt(capacity),
                notes: notes,
                modality: modality || "PRESENCIAL", // 👇 Guardamos
                teacherId: teacherId,
                subjectId: finalSubjectId
            }
        });

        res.send(tutoring);
    } catch (e) {
        console.error("Error creando tutoría:", e);
        res.status(500).send("ERROR_CREATING_TUTORING");
    }
};

// 🟢 11. LISTAR TUTORÍAS (Con Modalidad)
const getTutorings = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;

        const tutorings = await prisma.tutoring.findMany({
            where: { teacherId: teacherId },
            include: {
                subject: true,
                bookings: { include: { student: true } }
            },
            orderBy: { date: 'asc' }
        });

        const data = tutorings.map(t => ({
            id: t.id,
            date: t.date,
            capacity: t.capacity,
            booked: t.bookings.length,
            notes: t.notes,
            modality: t.modality, // 👇 Enviamos al front
            subjectName: t.subject ? t.subject.name : "General (Cualquier materia)",
            students: t.bookings.map(b => b.student.fullName)
        }));

        res.send(data);
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_GETTING_TUTORINGS");
    }
};

// 🟢 OBTENER LISTA DE CURSOS (Con nombre aplanado para las tarjetas)
const getTeacherCourses = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;

        const courses = await prisma.parallel.findMany({
            where: { teacherId: teacherId },
            include: { subject: true },
            orderBy: { subject: { name: 'asc' } }
        });

        // 🔥 MAPEO: Sacamos 'subject.name' a 'name' para que el frontend no se confunda
        const data = courses.map(c => ({
            ...c,
            name: c.subject.name,
            description: `Paralelo ${c.code}` // Opcional, para que tenga descripción
        }));

        res.send(data);
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_GETTING_COURSES");
    }
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

// 🟢 8. OBTENER ESTUDIANTES PARA CALIFICAR (Estrategia Robusta)
// 🟢 8. OBTENER ESTUDIANTES DE UNA ACTIVIDAD (CORREGIDO)
const getActivityGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;

        // 🔥 CORRECCIÓN: Usamos String() para asegurar que sea texto
        const eventId = parseInt(String(activityId));

        if (isNaN(eventId)) { res.status(400).send("ID INVALIDO"); return; }

        // 1. Buscamos el EVENTO
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { parallel: { include: { subject: true } } }
        });

        if (!event) return res.status(404).send("Actividad no encontrada");

        // 2. Buscamos TODOS los estudiantes del curso
        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: event.parallelId }, { subjectId: event.parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        // 3. Buscamos las NOTAS existentes
        const grades = await prisma.activityGrade.findMany({
            where: { eventId: eventId }
        });

        // 4. MEZCLAMOS
        const students = enrollments.map(enr => {
            const grade = grades.find(g => g.studentId === enr.userId);

            return {
                studentId: enr.userId,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                gradeId: grade?.id || null,
                score: grade?.score !== null && grade?.score !== undefined ? grade.score : "",
                feedback: grade?.feedback || "",
                submissionLink: grade?.submissionLink || null,
                submittedAt: grade?.submittedAt || null
            };
        });

        res.send({
            activity: {
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.date,
                type: event.type
            },
            students
        });

    } catch (e) {
        console.error("Error cargando actividad:", e);
        res.status(500).send("ERROR_LOADING_ACTIVITY");
    }
};

// 🟢 9. GUARDAR NOTA (CORREGIDO)
const saveActivityGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const { studentId, score, feedback } = req.body;

        // 🔥 CORRECCIÓN: Usamos String() aquí también
        const eventId = parseInt(String(activityId));
        const sId = parseInt(String(studentId));

        const finalScore = (score === "" || score === null) ? null : parseFloat(score);

        const grade = await prisma.activityGrade.upsert({
            where: {
                studentId_eventId: {
                    studentId: sId,
                    eventId: eventId
                }
            },
            update: { score: finalScore, feedback: feedback },
            create: {
                studentId: sId,
                eventId: eventId,
                score: finalScore,
                feedback: feedback
            }
        });

        res.send(grade);

    } catch (e) {
        console.error("Error guardando nota:", e);
        res.status(500).send("ERROR_SAVING_GRADE");
    }
};

// 🟢 7. MATRIZ DE NOTAS + ASISTENCIA (ESTRATEGIA ESPEJO: BUSCAR POR ESTUDIANTE)
const getCourseGradeMatrix = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.params;
        const parallelId = parseInt(String(courseId));

        if (isNaN(parallelId)) { res.status(400).send("ID INVALIDO"); return; }

        console.log(`🔍 Buscando matriz para curso ${parallelId}...`);

        // 1. Buscamos estudiantes (ENROLLMENTS)
        const parallel = await prisma.parallel.findUnique({ where: { id: parallelId } });
        if (!parallel) return res.status(404).send("Curso no encontrado");

        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: parallelId }, { subjectId: parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        const studentIds = enrollments.map(e => e.userId);
        console.log(`👥 Estudiantes encontrados: ${studentIds.length}`);

        // 2. Buscamos EVENTOS
        const events = await prisma.event.findMany({
            where: { parallelId: parallelId }
        });
        console.log(`📅 Eventos encontrados: ${events.length}`);

        // 3. 🔥 FIX: Buscamos notas por ESTUDIANTE (Igual que el controlador de alumno)
        // Esto garantiza que si el alumno ve la nota, el profe también.
        const allGrades = await prisma.activityGrade.findMany({
            where: {
                studentId: { in: studentIds } // Traemos todas las notas de estos alumnos
            }
        });
        console.log(`📝 Notas crudas encontradas: ${allGrades.length}`);

        // 4. Buscamos ASISTENCIA
        const allAttendance = await prisma.attendance.findMany({
            where: { enrollmentId: { in: enrollments.map(e => e.id) } }
        });

        const WEIGHTS: any = { 'INDIVIDUAL': 7, 'GRUPAL': 5, 'MEDIO': 2, 'FINAL': 6 };

        // 5. CRUCE DE DATOS EN MEMORIA
        const matrix = enrollments.map(enr => {
            const studentId = enr.userId;

            const acc: any = {
                'INDIVIDUAL': { sum: 0, count: 0 }, 'GRUPAL': { sum: 0, count: 0 },
                'MEDIO': { sum: 0, count: 0 }, 'FINAL': { sum: 0, count: 0 }
            };

            // Recorremos los eventos del curso
            events.forEach((evt) => {
                const typeKey = evt.type ? evt.type.toUpperCase() : 'INDIVIDUAL';

                // Buscamos si este alumno tiene nota para este evento
                // Usamos filtro en memoria que es infalible
                const grade = allGrades.find(g => g.eventId === evt.id && g.studentId === studentId);

                if (grade && grade.score !== null && grade.score !== undefined) {
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
                    // Promedio * (Peso / 20)
                    weighted = (data.sum / data.count / 20) * WEIGHTS[key];
                }
                breakdown[key] = parseFloat(weighted.toFixed(2));
                finalTotal += weighted;
            });

            // Asistencia
            const studentAtt = allAttendance.filter(a => a.enrollmentId === enr.id);
            let totalPoints = 0;
            let maxPoints = studentAtt.length * 2;

            studentAtt.forEach(att => {
                if (att.status === 'PRESENT' || att.status === 'EXCUSED') totalPoints += 2;
                else if (att.status === 'LATE') totalPoints += 1;
            });

            let attendancePct = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 100;

            return {
                studentId,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                breakdown,
                finalTotal: parseFloat(finalTotal.toFixed(2)),
                attendancePct: parseFloat(attendancePct.toFixed(2))
            };
        });

        // Promedios globales
        const courseSum = matrix.reduce((acc, curr) => acc + curr.finalTotal, 0);
        const courseAverage = matrix.length > 0 ? (courseSum / matrix.length) : 0;

        res.send({
            students: matrix,
            courseAverage: parseFloat(courseAverage.toFixed(2))
        });

    } catch (e) {
        console.error("Error FATAL en Matriz:", e);
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
    getTutorings,
    getTeacherCourses,
    getCourseGrades,
    getActivityGrades,
    saveActivityGrade,
    getCourseGradeMatrix,
    getDailyAttendance,
    saveDailyAttendance,
    updateStudentGrade
};