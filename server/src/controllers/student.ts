import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

const WEIGHTS: any = {
  'INDIVIDUAL': 7,
  'GRUPAL': 5,
  'MEDIO': 2,
  'FINAL': 6
};

// 1. ESTADÍSTICAS (DASHBOARD) - Mantengo tu código original
const getStudentStats = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        career: { include: { subjects: true } },
        enrollments: { include: { subject: true } }
      }
    });

    if (!user || !user.career) {
      res.status(404).send("USUARIO_O_CARRERA_NO_ENCONTRADO");
      return;
    }

    const approvedSubjects = user.enrollments.filter(e => e.status === 'APPROVED');
    const takingSubjects = user.enrollments.filter(e => e.status === 'TAKING');

    let average = 0;
    if (approvedSubjects.length > 0) {
      const sumGrades = approvedSubjects.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);
      average = parseFloat((sumGrades / approvedSubjects.length).toFixed(2));
    }

    const totalSubjects = user.career.subjects.length;
    const progressPercentage = totalSubjects > 0
      ? Math.round((approvedSubjects.length / totalSubjects) * 100)
      : 0;

    let currentSemester = 1;
    if (takingSubjects.length > 0) {
      const levels = takingSubjects.map(t => t.subject.semesterLevel);
      currentSemester = levels.length > 0 ? Math.max(...levels) : 1;
    }

    res.send({
      fullName: user.fullName,
      careerName: user.career.name,
      stats: {
        average,
        approvedCount: approvedSubjects.length,
        totalSubjects,
        progress: progressPercentage,
        takingCount: takingSubjects.length,
        currentSemester
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("ERROR_STATS");
  }
};

// 2. HORARIO SEMANAL - Mantengo tu código original
const getWeeklySchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'TAKING' },
      include: {
        subject: {
          include: { parallels: { include: { schedules: true } } }
        }
      }
    });

    let scheduleEvents: any[] = [];
    enrollments.forEach((enrollment) => {
      const parallel = enrollment.subject.parallels[0];
      if (parallel && parallel.schedules) {
        parallel.schedules.forEach(sched => {
          scheduleEvents.push({
            id: sched.id,
            subjectName: enrollment.subject.name,
            dayOfWeek: sched.dayOfWeek,
            startTime: sched.startTime,
            endTime: sched.endTime,
            classroom: 'Aula 101'
          });
        });
      }
    });
    res.send(scheduleEvents);
  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_SCHEDULE");
  }
};

// 3. MIS CURSOS - Mantengo tu código original
const getMyCourses = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: userId, status: 'TAKING' },
      include: { subject: true, parallel: true }
    });

    const courses = await Promise.all(enrollments.map(async (e) => {
      let pid = e.parallel?.id;
      let pcode = e.parallel?.code;

      if (!pid) {
        const fallbackParallel = await prisma.parallel.findFirst({
          where: { subjectId: e.subjectId }
        });
        if (fallbackParallel) {
          pid = fallbackParallel.id;
          pcode = fallbackParallel.code;
        }
      }

      return {
        courseId: pid || 0,
        subjectName: e.subject.name,
        code: pcode || "N/A",
        level: e.subject.semesterLevel,
        progress: 0
      };
    }));

    res.send(courses.filter(c => c.courseId !== 0));

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GET_COURSES");
  }
};

// 4. DETALLE DE CURSO (CORREGIDO: Lee Eventos Reales y busca por eventId)
const getStudentCourseDetails = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const parallelId = parseInt(String(courseId || '0'));

    if (isNaN(parallelId) || parallelId === 0) { res.status(400).send("ID_INVALIDO"); return; }

    const parallel = await prisma.parallel.findUnique({
      where: { id: parallelId },
      include: {
        subject: true,
        activities: { orderBy: { id: 'asc' } }, // Categorías fijas
        events: { orderBy: { date: 'desc' } }   // Tareas reales
      }
    });

    if (!parallel) { res.status(404).send("CURSO_NO_ENCONTRADO"); return; }

    // Traemos TODAS las notas del estudiante
    const myGrades = await prisma.activityGrade.findMany({
      where: { studentId: userId }
    });

    // 1. LISTA DE TAREAS REALES (Basada en Eventos de Agenda)
    const activitiesList = parallel.events.map(evt => {
      // 👇 BUSCAMOS LA ENTREGA POR eventId
      const submissionObj: any = myGrades.find((g: any) => g.eventId === evt.id);

      return {
        id: evt.id,
        name: evt.title,
        type: evt.type,
        description: evt.description,
        limitDate: evt.date,
        myScore: submissionObj ? submissionObj.score : null,
        submissionLink: submissionObj?.submissionLink || null
      };
    });

    // 2. PROMEDIOS (Basado en Categorías Fijas)
    const typeAccumulated: any = {
      'INDIVIDUAL': { sum: 0, count: 0, weight: 7, label: "Gestión Individual" },
      'GRUPAL': { sum: 0, count: 0, weight: 5, label: "Gestión Grupal" },
      'MEDIO': { sum: 0, count: 0, weight: 2, label: "Examen Medio Semestre" },
      'FINAL': { sum: 0, count: 0, weight: 6, label: "Examen Final" }
    };

    // Para los promedios, usamos SOLO las que tienen activityId
    parallel.activities.forEach(cat => {
      const gradeObj: any = myGrades.find((g: any) => g.activityId === cat.id);
      if (gradeObj && gradeObj.score !== null && typeAccumulated[cat.type]) {
        typeAccumulated[cat.type].sum += gradeObj.score;
        typeAccumulated[cat.type].count += 1;
      }
    });

    let finalTotal = 0;
    const scoreSummary = Object.keys(typeAccumulated).map(key => {
      const data = typeAccumulated[key];
      let average = 0;
      let weightedScore = 0;

      if (data.count > 0) {
        average = parseFloat((data.sum / data.count).toFixed(2));
        weightedScore = (average * data.weight) / 20;
      }
      finalTotal += weightedScore;

      return {
        category: key,
        label: data.label,
        weight: data.weight,
        average: average,
        weightedScore: parseFloat(weightedScore.toFixed(2))
      };
    });

    const enrollment = await prisma.enrollment.findFirst({ where: { userId, subjectId: parallel.subjectId } });

    let attendance: any[] = [];
    if (enrollment) {
      attendance = await prisma.attendance.findMany({ where: { enrollmentId: enrollment.id }, orderBy: { date: 'desc' } });
    }

    res.send({
      subjectName: parallel.subject.name,
      parallelCode: parallel.code,
      activities: activitiesList,
      scoreSummary: scoreSummary,
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      agenda: parallel.events,
      attendance: attendance
    });

  } catch (e) { console.log(e); res.status(500).send("ERROR_GETTING_DETAILS"); }
};

// 5. ENVIAR TAREA (Versión Debug)
const submitActivity = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { activityId, link } = req.body;

    console.log("📥 Intentando entregar:", { userId, activityId, link });

    if (!link) { res.status(400).send("LINK_REQUERIDO"); return; }

    const eventIdInt = parseInt(activityId);

    // Configuración con ANY para evitar bloqueos de TypeScript
    const whereClause: any = {
      studentId_eventId: {
        studentId: userId,
        eventId: eventIdInt
      }
    };

    const createData: any = {
      studentId: userId,
      eventId: eventIdInt,
      submissionLink: link,
      score: undefined
    };

    const updateData: any = {
      submissionLink: link
    };

    console.log("🔄 Ejecutando Upsert en Prisma...");

    const submission = await prisma.activityGrade.upsert({
      where: whereClause,
      update: updateData,
      create: createData
    });

    console.log("✅ Entrega exitosa:", submission);
    res.send(submission);

  } catch (e: any) {
    // ESTO ES LO QUE NECESITAMOS VER SI FALLA
    console.error("❌ ERROR CRÍTICO EN PRISMA:", e.message);
    console.error(e);
    res.status(500).send("ERROR_SUBMITTING_ACTIVITY");
  }
};

export {
  getStudentStats,
  getWeeklySchedule,
  getMyCourses,
  getStudentCourseDetails,
  submitActivity
};