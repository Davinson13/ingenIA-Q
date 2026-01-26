import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// =====================================================================
// 1. ESTADÍSTICAS GENERALES (DASHBOARD)
// =====================================================================
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
    // Filtramos para contar SOLO las que se están cursando actualmente
    const takingSubjects = user.enrollments.filter(e => ['TAKING', 'PENDING'].includes(e.status));

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

// =====================================================================
// 2. DASHBOARD DEL ESTUDIANTE (LÓGICA UNIFICADA)
// =====================================================================
const getStudentDashboard = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    // 1. OBTENER INSCRIPCIONES ACTIVAS (TAKING/PENDING)
    // No traemos APPROVED aquí para que no salgan en la lista de "Mis Cursos" del dashboard
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentId,
        status: { in: ['TAKING', 'PENDING'] }
      },
      include: {
        parallel: {
          include: {
            subject: true,
            schedules: true,
            events: { where: { type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] } } }
          }
        },
        subject: {
          include: {
            parallels: {
              include: {
                events: { where: { type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] } } },
                schedules: true
              }
            }
          }
        }
      }
    });

    // 2. PROMEDIO GENERAL (SOLO MATERIAS FINALIZADAS)
    const finishedEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentId,
        finalGrade: { not: null },
        status: { notIn: ['TAKING', 'PENDING'] }
      },
      select: { finalGrade: true }
    });

    const sumGrades = finishedEnrollments.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);
    const globalAverage = finishedEnrollments.length > 0
      ? (sumGrades / finishedEnrollments.length)
      : 0;

    // 3. TAREAS PENDIENTES (RANGO AMPLIADO 60 DÍAS)
    const startFilter = new Date(now);
    startFilter.setDate(startFilter.getDate() - 1); // Desde ayer
    const endFilter = new Date(now);
    endFilter.setDate(endFilter.getDate() + 60); // Próximos 2 meses

    const parallelIds: number[] = [];
    enrollments.forEach((enr: any) => {
      if (enr.parallelId) parallelIds.push(enr.parallelId);
      else if (enr.subject?.parallels?.length > 0) {
        enr.subject.parallels.forEach((p: any) => parallelIds.push(p.id));
      }
    });

    // Buscamos eventos de tipos reales que usa el sistema
    const upcomingEvents = await prisma.event.findMany({
      where: {
        parallelId: { in: parallelIds },
        date: { gte: startFilter, lte: endFilter },
        type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] }
      },
      include: {
        parallel: { include: { subject: true } }
      },
      orderBy: { date: 'asc' }
    });

    const myGrades = await prisma.activityGrade.findMany({
      where: {
        studentId: studentId,
        eventId: { in: upcomingEvents.map(e => e.id) }
      }
    });

    const pendingTasks = upcomingEvents.filter(evt => {
      const submission = myGrades.find(g => g.eventId === evt.id);
      // Mostrar si NO ha entregado O si no tiene link
      return !submission || !submission.submissionLink;
    }).map(evt => {
      const evtDate = new Date(evt.date);
      const diffTime = evtDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: evt.id,
        title: evt.title,
        subject: evt.parallel.subject.name,
        date: evt.date,
        type: evt.type,
        daysLeft: daysLeft,
        parallelId: evt.parallelId
      };
    });

    // 4. CLASES DE HOY
    const dayOfWeek = now.getDay();
    const todayClasses: any[] = [];

    enrollments.forEach((enr: any) => {
      let schedules: any[] = [];
      let subjectName = "";

      if (enr.parallel) {
        schedules = enr.parallel.schedules || [];
        subjectName = enr.parallel.subject.name;
      } else if (enr.subject && enr.subject.parallels.length > 0) {
        schedules = enr.subject.parallels[0].schedules || [];
        subjectName = enr.subject.name;
      }

      if (Array.isArray(schedules)) {
        const todaySchedule = schedules.find((s: any) => s.dayOfWeek === dayOfWeek);
        if (todaySchedule) {
          todayClasses.push({
            id: enr.id,
            subject: subjectName,
            time: `${todaySchedule.startTime} - ${todaySchedule.endTime}`,
            classroom: todaySchedule.classroom || 'General'
          });
        }
      }
    });

    todayClasses.sort((a, b) => a.time.localeCompare(b.time));

    // 5. DATA DE CURSOS (PROGRESO)
    const coursesData = await Promise.all(enrollments.map(async (enr: any) => {
      let totalActivities = 0;
      let currentParallelId = 0;

      if (enr.parallel) {
        totalActivities = enr.parallel.events?.length || 0;
        currentParallelId = enr.parallel.id;
      } else if (enr.subject && enr.subject.parallels.length > 0) {
        totalActivities = enr.subject.parallels[0].events?.length || 0;
        currentParallelId = enr.subject.parallels[0].id;
      }

      const submittedCount = await prisma.activityGrade.count({
        where: {
          studentId: studentId,
          event: { parallelId: currentParallelId },
          submissionLink: { not: null }
        }
      });

      const progress = totalActivities > 0 ? Math.round((submittedCount / totalActivities) * 100) : 0;

      return {
        id: currentParallelId, // 🔥 ID correcto para la navegación
        name: enr.parallel?.subject.name || enr.subject.name,
        code: enr.parallel?.code || 'A',
        teacher: "Docente Titular",
        progress: progress,
        average: enr.finalGrade || 0
      };
    }));

    res.send({
      stats: {
        average: parseFloat(globalAverage.toFixed(2)),
        pendingCount: pendingTasks.length,
        activeCourses: enrollments.length
      },
      pendingTasks,
      todayClasses,
      courses: coursesData
    });

  } catch (e) {
    console.error("Error student dashboard:", e);
    res.status(500).send("ERROR_DASHBOARD");
  }
};

// =====================================================================
// 3. HORARIO SEMANAL
// =====================================================================
const getWeeklySchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: { in: ['TAKING', 'PENDING'] }
      },
      include: {
        subject: {
          include: { parallels: { include: { schedules: true } } }
        }
      }
    });

    let scheduleEvents: any[] = [];
    enrollments.forEach((enrollment) => {
      if (enrollment.subject.parallels.length > 0) {
        const parallel = enrollment.subject.parallels[0];
        if (parallel && parallel.schedules) {
          parallel.schedules.forEach((sched: any) => {
            scheduleEvents.push({
              id: sched.id,
              subjectName: enrollment.subject.name,
              dayOfWeek: sched.dayOfWeek,
              startTime: sched.startTime,
              endTime: sched.endTime,
              classroom: sched.classroom || 'Aula 101'
            });
          });
        }
      }
    });
    res.send(scheduleEvents);
  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_SCHEDULE");
  }
};

// =====================================================================
// 4. MIS CURSOS
// =====================================================================
const getMyCourses = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
        status: { in: ['TAKING', 'PENDING'] }
      },
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

// =====================================================================
// 5. DETALLE DE CURSO
// =====================================================================
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
        events: { orderBy: { date: 'desc' } }
      }
    });

    if (!parallel) { res.status(404).send("CURSO_NO_ENCONTRADO"); return; }

    const myGrades = await prisma.activityGrade.findMany({ where: { studentId: userId } });

    const activitiesList = parallel.events.map(evt => {
      const submissionObj: any = myGrades.find((g: any) => g.eventId === evt.id);
      return {
        id: evt.id,
        name: evt.title,
        type: evt.type,
        description: evt.description,
        limitDate: evt.date,
        myScore: submissionObj ? submissionObj.score : null,
        submissionLink: submissionObj?.submissionLink || null,
        submittedAt: submissionObj?.submittedAt || null,
        feedback: submissionObj?.feedback || null
      };
    });

    const accumulator: any = {
      'INDIVIDUAL': { sum: 0, count: 0, weight: 7, label: "Gestión Individual" },
      'GRUPAL': { sum: 0, count: 0, weight: 5, label: "Gestión Grupal" },
      'MEDIO': { sum: 0, count: 0, weight: 2, label: "Examen Medio" },
      'FINAL': { sum: 0, count: 0, weight: 6, label: "Examen Final" }
    };

    parallel.events.forEach(evt => {
      const grade = myGrades.find((g: any) => g.eventId === evt.id);
      if (grade && grade.score !== null && accumulator[evt.type]) {
        accumulator[evt.type].sum += grade.score;
        accumulator[evt.type].count += 1;
      }
    });

    let finalTotal = 0;
    const scoreSummary = Object.keys(accumulator).map(key => {
      const data = accumulator[key];
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
    let attendancePct = 100;

    if (enrollment) {
      attendance = await prisma.attendance.findMany({
        where: { enrollmentId: enrollment.id },
        orderBy: { date: 'desc' }
      });

      let totalPoints = 0;
      let maxPoints = attendance.length * 2;

      attendance.forEach(att => {
        if (att.status === 'PRESENT' || att.status === 'EXCUSED') totalPoints += 2;
        else if (att.status === 'LATE') totalPoints += 1;
      });

      if (maxPoints > 0) {
        attendancePct = (totalPoints / maxPoints) * 100;
      }
    }

    res.send({
      subjectName: parallel.subject.name,
      parallelCode: parallel.code,
      activities: activitiesList,
      scoreSummary: scoreSummary,
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      agenda: parallel.events,
      attendance: attendance,
      attendancePct: parseFloat(attendancePct.toFixed(2))
    });

  } catch (e) { console.log(e); res.status(500).send("ERROR"); }
};

// =====================================================================
// 6. ENVIAR TAREA
// =====================================================================
const submitActivity = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { activityId, link } = req.body;

    if (!link) { res.status(400).send("LINK_REQUERIDO"); return; }

    const eventIdInt = parseInt(activityId);
    const whereClause: any = { studentId_eventId: { studentId: userId, eventId: eventIdInt } };
    const createData: any = { studentId: userId, eventId: eventIdInt, submissionLink: link };
    const updateData: any = { submissionLink: link };

    const submission = await prisma.activityGrade.upsert({
      where: whereClause,
      update: updateData,
      create: createData
    });

    res.send(submission);

  } catch (e: any) {
    console.error("ERROR SUBMITTING ACTIVITY:", e);
    res.status(500).send("ERROR_SUBMITTING_ACTIVITY");
  }
};

// =====================================================================
// 7. TUTORÍAS (MERCADO Y RESERVA)
// =====================================================================
const getAvailableTutorings = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const tutorings = await prisma.tutoring.findMany({
      where: { date: { gte: now } },
      include: {
        subject: true,
        teacher: { select: { fullName: true } },
        bookings: true
      },
      orderBy: { date: 'asc' }
    });

    const available = tutorings.map(t => {
      const bookedCount = t.bookings.length;
      const isBookedByMe = t.bookings.some(b => b.studentId === studentId);
      const remaining = t.capacity - bookedCount;

      return {
        id: t.id,
        date: t.date,
        teacherName: t.teacher.fullName,
        subjectName: t.subject ? t.subject.name : "General / Varias",
        modality: t.modality,
        notes: t.notes,
        capacity: t.capacity,
        booked: bookedCount,
        remaining: remaining,
        isBooked: isBookedByMe,
        isFull: remaining <= 0
      };
    });

    res.send(available);

  } catch (e) {
    console.error("Error getting tutorings:", e);
    res.status(500).send("ERROR_GETTING_TUTORINGS");
  }
};

const bookTutoring = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = req.user.id;
    const { tutoringId } = req.body;
    const tId = parseInt(tutoringId);

    const tutoring = await prisma.tutoring.findUnique({
      where: { id: tId },
      include: { bookings: true }
    });

    if (!tutoring) return res.status(404).send("Tutoría no encontrada");
    if (tutoring.bookings.length >= tutoring.capacity) return res.status(400).send("¡Lo sentimos! Ya no hay cupos.");

    const alreadyBooked = tutoring.bookings.some(b => b.studentId === studentId);
    if (alreadyBooked) return res.status(400).send("Ya estás inscrito en esta tutoría.");

    await prisma.tutoringBooking.create({
      data: { tutoringId: tId, studentId: studentId }
    });

    res.send({ success: true, message: "Reserva exitosa" });

  } catch (e) {
    console.error("Error booking tutoring:", e);
    res.status(500).send("ERROR_BOOKING");
  }
};

// =====================================================================
// EXPORTS
// =====================================================================
export {
  getStudentStats,
  getStudentDashboard,
  getWeeklySchedule,
  getMyCourses,
  getStudentCourseDetails,
  submitActivity,
  getAvailableTutorings,
  bookTutoring
};