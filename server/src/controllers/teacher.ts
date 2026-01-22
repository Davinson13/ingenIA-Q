import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

// 1. OBTENER DASHBOARD DOCENTE (Cursos y Tutorías)
const getTeacherDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;

        // Buscar paralelos donde el usuario es el profesor
        const parallels = await prisma.parallel.findMany({
            where: { teacherId: teacherId },
            include: {
                subject: true,
                period: true,
                schedules: true
            }
        });

        // Formatear cursos para el frontend
        const courses = parallels.map(p => ({
            id: p.subject.id,
            subjectName: p.subject.name,
            code: p.code,
            period: p.period.name,
            schedule: p.schedules.map(s => ({
                id: s.id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime
            }))
        }));

        const tutorings: any[] = [];

        res.send({
            courses,
            tutorings
        });

    } catch (e) {
        console.log(e);
        res.status(500).send("ERROR_GETTING_TEACHER_DASHBOARD");
    }
};

// 2. CREAR TUTORÍA
const createTutoring = async (req: RequestWithUser, res: Response) => {
    res.send({ message: "Tutoría creada simulada" });
};

// 2. OBTENER MIS CURSOS Y ESTUDIANTES
const getTeacherCourses = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = req.user.id;

        const courses = await prisma.parallel.findMany({
            where: { teacherId: teacherId },
            include: {
                subject: true,
                period: true,
                schedules: true,
            }
        });

        const coursesWithStudents = await Promise.all(courses.map(async (course) => {
            const enrollments = await prisma.enrollment.findMany({
                where: {
                    subjectId: course.subjectId,
                    status: 'TAKING'
                },
                include: { user: true }
            });

            return {
                id: course.id,
                subjectName: course.subject.name,
                code: course.code,
                period: course.period.name,
                studentCount: enrollments.length,
                students: enrollments.map(e => ({
                    id: e.user.id,
                    fullName: e.user.fullName,
                    email: e.user.email,
                    status: e.status,
                    avatar: `https://ui-avatars.com/api/?name=${e.user.fullName}&background=random`
                }))
            };
        }));

        res.send(coursesWithStudents);

    } catch (e) {
        console.log(e);
        res.status(500).send("ERROR_GETTING_TEACHER_COURSES");
    }
};

// 3. OBTENER NOTAS DE UN CURSO ESPECÍFICO (Versión Blindada)
const getCourseGrades = async (req: RequestWithUser, res: Response) => {
    try {
        // 1. Obtenemos el parámetro y lo forzamos a String
        const { courseId } = req.params;
        const idString = String(courseId);

        // 2. Parseamos usando base 10 explícitamente
        const idParseado = parseInt(idString, 10);

        // 3. Validamos si es un número real
        if (isNaN(idParseado)) {
            res.status(400).send("ID_CURSO_INVALIDO");
            return;
        }

        // 1. Buscamos el paralelo usando el ID validado
        const parallel = await prisma.parallel.findUnique({
            where: { id: idParseado },
            include: { subject: true }
        });

        if (!parallel) {
            res.status(404).send("CURSO_NO_ENCONTRADO");
            return;
        }

        // 2. Buscamos las matrículas (Enrollments)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                subjectId: parallel.subjectId,
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        // 3. Formateamos la respuesta
        const students = enrollments.map(e => ({
            enrollmentId: e.id,
            studentId: e.user.id,
            fullName: e.user.fullName,
            email: e.user.email,
            avatar: `https://ui-avatars.com/api/?name=${e.user.fullName}&background=random`,
            grade: e.finalGrade || 0
        }));

        res.send({
            courseName: parallel.subject.name,
            parallelCode: parallel.code,
            students
        });

    } catch (e) {
        console.log(e);
        res.status(500).send("ERROR_GETTING_GRADES");
    }
};

// 🟢 4. OBTENER DETALLE DE ACTIVIDAD Y ENTREGAS (CORREGIDO: Lógica de búsqueda de estudiantes)
const getActivityGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const eventId = parseInt(String(activityId));

        // 1. Buscamos el evento
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) { res.status(404).send("ACTIVIDAD_NO_ENCONTRADA"); return; }

        // 2. IMPORTANTE: Buscamos el paralelo para obtener el subjectId
        const parallel = await prisma.parallel.findUnique({ where: { id: event.parallelId } });
        if (!parallel) { res.status(404).send("PARALELO_NO_ENCONTRADO"); return; }

        // 3. Buscamos estudiantes (Usando la lógica robusta: Por Paralelo O Por Materia)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: 'TAKING',
                OR: [
                    { parallelId: parallel.id }, // Matriculados directo al paralelo
                    { subjectId: parallel.subjectId, parallelId: null } // Matriculados a la materia (Caso común)
                ]
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        // 4. Buscamos notas
        const whereClause: any = { eventId: eventId };
        const grades = await prisma.activityGrade.findMany({ where: whereClause });

        // 5. Mapeo final
        const roster = enrollments.map(enrollment => {
            const submission: any = grades.find((g: any) => g.studentId === enrollment.user.id);

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

    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_GETTING_GRADES");
    }
};

// 🟢 5. GUARDAR NOTAS (BLINDADO)
const saveActivityGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const { studentId, score, feedback } = req.body;

        const eventIdInt = parseInt(String(activityId));
        const studentIdInt = parseInt(String(studentId));

        const whereClause: any = {
            studentId_eventId: {
                studentId: studentIdInt,
                eventId: eventIdInt
            }
        };

        const createData: any = {
            studentId: studentIdInt,
            eventId: eventIdInt,
            score: parseFloat(score),
            feedback: feedback
        };

        const submission = await prisma.activityGrade.upsert({
            where: whereClause,
            update: {
                score: parseFloat(score),
                feedback: feedback
            },
            create: createData
        });

        res.send(submission);
    } catch (e) { console.error(e); res.status(500).send("ERROR_SAVING_GRADE"); }
};
// 4. ACTUALIZAR UNA NOTA
const updateStudentGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { enrollmentId, grade } = req.body;

        if (grade < 0 || grade > 20) {
            res.status(400).send("NOTA_INVALIDA");
            return;
        }

        const updated = await prisma.enrollment.update({
            where: { id: parseInt(enrollmentId) },
            data: { finalGrade: parseFloat(grade) }
        });

        res.send(updated);

    } catch (e) {
        console.log(e);
        res.status(500).send("ERROR_UPDATING_GRADE");
    }
};

export {
    getTeacherDashboard,
    createTutoring,
    getTeacherCourses,
    getCourseGrades,
    updateStudentGrade,
    getActivityGrades,
    saveActivityGrade
};