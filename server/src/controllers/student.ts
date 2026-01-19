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

// ---------------------------------------------------------
// 1. ESTADÍSTICAS (DASHBOARD)
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 2. HORARIO SEMANAL
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 3. MIS CURSOS (CON AUTO-CORRECCIÓN DE DATOS VIEJOS)
// ---------------------------------------------------------
const getMyCourses = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: userId, status: 'TAKING' },
      include: { subject: true, parallel: true }
    });

    // Usamos Promise.all para hacer consultas extra si faltan datos
    const courses = await Promise.all(enrollments.map(async (e) => {
      let pid = e.parallel?.id;
      let pcode = e.parallel?.code;

      // 🚑 FALLBACK: Si es un dato viejo sin paralelo, buscamos uno por defecto
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
        courseId: pid || 0, // Si sigue siendo 0, el frontend debería ocultarlo
        subjectName: e.subject.name,
        code: pcode || "N/A",
        level: e.subject.semesterLevel,
        progress: 0
      };
    }));

    // Filtramos los que tengan ID 0 para evitar errores 400
    res.send(courses.filter(c => c.courseId !== 0));

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GET_COURSES");
  }
};

// ---------------------------------------------------------
// 4. DETALLE DE CURSO (CON CONVERSIÓN SEGURA)
// ---------------------------------------------------------
const getStudentCourseDetails = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    // 🛡️ CORRECCIÓN: Forzamos String() para evitar errores de tipo en TypeScript
    const parallelId = parseInt(String(courseId || '0'));

    if (isNaN(parallelId) || parallelId === 0) {
      res.status(400).send("ID_INVALIDO");
      return;
    }

    const parallel = await prisma.parallel.findUnique({
      where: { id: parallelId },
      include: {
        subject: true,
        activities: { orderBy: { id: 'asc' } }
      }
    });

    if (!parallel) { res.status(404).send("CURSO_NO_ENCONTRADO"); return; }

    const myGrades = await prisma.activityGrade.findMany({
      where: { studentId: userId, activity: { parallelId: parallel.id } },
      include: { activity: true }
    });

    const typeAccumulated: any = {
      'INDIVIDUAL': { sum: 0, count: 0, weight: 7 },
      'GRUPAL': { sum: 0, count: 0, weight: 5 },
      'MEDIO': { sum: 0, count: 0, weight: 2 },
      'FINAL': { sum: 0, count: 0, weight: 6 }
    };

    const gradesList = parallel.activities.map(act => {
      const gradeObj = myGrades.find((g: any) => g.activityId === act.id);
      const score = gradeObj ? gradeObj.score : null;

      if (score !== null && typeAccumulated[act.type]) {
        typeAccumulated[act.type].sum += score;
        typeAccumulated[act.type].count += 1;
      }

      return {
        id: act.id,
        name: act.name,
        type: act.type,
        maxScore: 20,
        weight: WEIGHTS[act.type],
        myScore: score
      };
    });

    let finalTotal = 0;
    Object.keys(typeAccumulated).forEach(type => {
      const data = typeAccumulated[type];
      if (data.count > 0) {
        const avg20 = data.sum / data.count;
        finalTotal += (avg20 * data.weight) / 20;
      }
    });

    const agenda = await prisma.event.findMany({
      where: { parallelId: parallel.id },
      orderBy: { date: 'asc' }
    });

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, subjectId: parallel.subjectId }
    });

    let attendance: any[] = [];
    if (enrollment) {
      attendance = await prisma.attendance.findMany({
        where: { enrollmentId: enrollment.id },
        orderBy: { date: 'desc' }
      });
    }

    res.send({
      subjectName: parallel.subject.name,
      parallelCode: parallel.code,
      grades: gradesList,
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      agenda: agenda,
      attendance: attendance
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_DETAILS");
  }
};

export {
  getStudentStats,
  getWeeklySchedule,
  getMyCourses,
  getStudentCourseDetails
};