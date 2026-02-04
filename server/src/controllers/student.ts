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
    const userId = parseInt(String(req.user.id));

    // Buscar periodo activo para filtrar lo actual
    const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        career: { include: { subjects: true } },
        enrollments: { include: { subject: true, parallel: true } }
      }
    });

    if (!user || !user.career) {
      res.status(404).send("USUARIO_O_CARRERA_NO_ENCONTRADO");
      return;
    }

    const approvedSubjects = user.enrollments.filter(e => e.status === 'APPROVED');

    // 🔥 FILTRO: Solo contamos las que son del periodo activo
    const takingSubjects = user.enrollments.filter(e =>
      ['TAKING', 'PENDING'].includes(e.status) &&
      (activePeriod ? e.parallel?.periodId === activePeriod.id : true)
    );

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
        takingCount: takingSubjects.length, // Ahora muestra solo las reales de este periodo
        currentSemester
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("ERROR_STATS");
  }
};

// 🟢 1. NUEVA FUNCIÓN: REGISTRAR NOTAS HISTÓRICAS
// Permite al estudiante decir "Ya pasé Matemáticas I con 18"
const registerHistoricalGrades = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = parseInt(String(req.user.id));
    const { grades } = req.body; // Array de { subjectId, grade }

    if (!Array.isArray(grades)) return res.status(400).json({ error: "Formato inválido" });

    // Procesamos cada nota
    await prisma.$transaction(
      grades.map((item: any) => {
        const finalGrade = parseFloat(item.grade);
        // Si la nota es >= 14 aprueba, si no reprueba (ajusta tu lógica de aprobación aquí)
        const status = finalGrade >= 14 ? 'APPROVED' : 'FAILED';

        return prisma.enrollment.upsert({
          where: {
            userId_subjectId: {
              userId: userId,
              subjectId: parseInt(item.subjectId)
            }
          },
          update: {
            finalGrade: finalGrade,
            status: status,
            parallelId: null // Es histórico, no tiene paralelo actual
          },
          create: {
            userId: userId,
            subjectId: parseInt(item.subjectId),
            finalGrade: finalGrade,
            status: status,
            parallelId: null
          }
        });
      })
    );

    res.json({ message: "Historial académico actualizado." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error guardando historial." });
  }
};

// =====================================================================
// 2. DASHBOARD DEL ESTUDIANTE
// =====================================================================
const getStudentDashboard = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = parseInt(String(req.user.id));
    const now = new Date();

    // 1. OBTENER PERIODO ACTIVO
    const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

    // Si no hay periodo activo, devolvemos vacío para no mostrar cosas viejas
    if (!activePeriod) {
      return res.send({
        stats: { average: 0, pendingCount: 0, activeCourses: 0 },
        pendingTasks: [], todayClasses: [], courses: []
      });
    }

    // 2. OBTENER INSCRIPCIONES (SOLO DEL PERIODO ACTIVO)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentId,
        status: { in: ['TAKING', 'PENDING'] },
        parallel: {
          periodId: activePeriod.id // 🔥 ESTO FILTRA LOS CURSOS VIEJOS
        }
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
              where: { periodId: activePeriod.id }, // Solo paralelos de este periodo
              include: {
                events: { where: { type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] } } },
                schedules: true
              }
            }
          }
        }
      }
    });

    // 3. Promedio General (Histórico)
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

    // 4. Tareas Pendientes (De los cursos filtrados)
    const startFilter = new Date(now);
    startFilter.setDate(startFilter.getDate() - 1);
    const endFilter = new Date(now);
    endFilter.setDate(endFilter.getDate() + 60);

    const parallelIds = enrollments.map(e => e.parallelId).filter(id => id !== null) as number[];

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

    // 5. Clases de Hoy
    const dayOfWeek = now.getDay();
    const todayClasses: any[] = [];

    enrollments.forEach((enr: any) => {
      let schedules: any[] = [];
      let subjectName = "";

      if (enr.parallel) {
        schedules = enr.parallel.schedules || [];
        subjectName = enr.parallel.subject.name;
      }

      if (Array.isArray(schedules)) {
        const todaySchedule = schedules.find((s: any) => s.dayOfWeek === dayOfWeek);
        if (todaySchedule) {
          todayClasses.push({
            id: enr.id,
            subject: subjectName,
            time: `${todaySchedule.startTime} - ${todaySchedule.endTime}`,
            classroom: 'General'
          });
        }
      }
    });

    todayClasses.sort((a, b) => a.time.localeCompare(b.time));

    // 6. Data de Cursos (Cards)
    const coursesData = await Promise.all(enrollments.map(async (enr: any) => {
      let totalActivities = 0;
      let currentParallelId = enr.parallelId;

      if (enr.parallel) {
        totalActivities = enr.parallel.events?.length || 0;
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
        id: currentParallelId,
        name: enr.parallel?.subject?.name || "Sin Nombre",
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
    const userId = parseInt(String(req.user.id));
    const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

    if (!activePeriod) return res.send([]);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: { in: ['TAKING', 'PENDING'] },
        parallel: { periodId: activePeriod.id } // 🔥 FILTRO ACTIVO
      },
      include: {
        subject: true,
        parallel: { include: { schedules: true } }
      }
    });

    let scheduleEvents: any[] = [];
    enrollments.forEach((enrollment) => {
      if (enrollment.parallel && enrollment.parallel.schedules) {
        enrollment.parallel.schedules.forEach((sched: any) => {
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

// =====================================================================
// 4. MIS CURSOS (LISTA COMPLETA)
// =====================================================================
const getMyCourses = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = parseInt(String(req.user.id));
    const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

    if (!activePeriod) return res.send([]);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
        status: { in: ['TAKING', 'PENDING'] },
        parallel: { periodId: activePeriod.id } // 🔥 FILTRO ACTIVO
      },
      include: { subject: true, parallel: true }
    });

    const courses = enrollments.map((e) => {
      return {
        courseId: e.parallelId, // Importante para el link
        subjectName: e.subject.name,
        code: e.parallel?.code || "A",
        level: e.subject.semesterLevel,
        progress: 0
      };
    });

    res.send(courses);

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
    const userId = parseInt(String(req.user.id));
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

    const enrollment = await prisma.enrollment.findFirst({ where: { userId, parallelId: parallel.id } });
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
    const userId = parseInt(String(req.user.id));
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
// 7. TUTORÍAS
// =====================================================================
// 🟢 3. MODIFICADA: TUTORÍAS DISPONIBLES (FILTRO PERSONALIZADO)
const getAvailableTutorings = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = parseInt(String(req.user.id));
    const now = new Date();

    // 1. Obtener materias que el alumno está cursando ACTUALMENTE ('TAKING')
    const myEnrollments = await prisma.enrollment.findMany({
      where: { userId: studentId, status: 'TAKING' },
      select: { subjectId: true }
    });

    const mySubjectIds = myEnrollments.map(e => e.subjectId);

    // 2. Buscar Tutorías
    const tutorings = await prisma.tutoring.findMany({
      where: {
        date: { gte: now },
        OR: [
          { subjectId: null }, // Tutorías Generales (para todos)
          { subjectId: { in: mySubjectIds } } // 🔥 Solo materias que estoy viendo
        ]
      },
      include: {
        subject: true,
        teacher: { select: { fullName: true } },
        bookings: true
      },
      orderBy: { date: 'asc' }
    });

    // Mapeo de respuesta (igual que antes)
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
    const studentId = parseInt(String(req.user.id));
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
// 8. FUNCIONES NUEVAS (CATÁLOGO Y GESTIÓN DE CURSOS)
// =====================================================================

// FILTROS CATÁLOGO
const getCatalogFilters = async (req: Request, res: Response) => {
  try {
    const careers = await prisma.career.findMany({
      select: { id: true, name: true, totalSemesters: true }
    });
    res.json({ careers });
  } catch (error) {
    res.status(500).json({ error: "Error cargando filtros" });
  }
};

// VER CURSOS ABIERTOS (FILTRADOS)
const getOpenCourses = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { careerId, semester } = req.query;

    if (!careerId || !semester) {
      return res.status(400).json({ error: "Faltan filtros" });
    }

    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { isActive: true }
    });

    if (!activePeriod) {
      return res.json([]);
    }

    const parallels = await prisma.parallel.findMany({
      where: {
        periodId: activePeriod.id,
        subject: {
          careerId: parseInt(String(careerId)),
          semesterLevel: parseInt(String(semester))
        }
      },
      include: {
        subject: true,
        teacher: true,
        _count: { select: { enrollments: true } }
      }
    });

    const myEnrollments = await prisma.enrollment.findMany({
      where: { userId: parseInt(String(id)), status: { not: 'FAILED' } },
      select: { subjectId: true, parallelId: true }
    });

    const mySubjectIds = myEnrollments.map(e => e.subjectId);
    const myParallelIds = myEnrollments.map(e => e.parallelId);

    const data = parallels.map(p => ({
      id: p.id,
      subjectId: p.subjectId,
      name: p.subject.name,
      code: p.code,
      teacher: p.teacher ? p.teacher.fullName : "Por asignar",
      credits: 4,
      semester: p.subject.semesterLevel,
      capacity: p.capacity,
      enrolledCount: p._count.enrollments,
      isFull: p._count.enrollments >= p.capacity,
      isEnrolled: mySubjectIds.includes(p.subjectId) && myParallelIds.includes(p.id)
    }));

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error buscando cursos" });
  }
};

// 🟢 4. VER CATÁLOGO COMPLETO (MALLA + HISTORIAL)
const getAllCourses = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String((req as any).user.id));

    // 1. Buscamos todas las materias de la carrera del estudiante
    // Primero necesitamos saber qué carrera tiene
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { careerId: true }
    });

    if (!user || !user.careerId) {
      return res.status(400).json({ error: "No tienes una carrera asignada. Solicítala en tu perfil." });
    }

    const subjects = await prisma.subject.findMany({
      where: { careerId: user.careerId }, // 🔥 Solo materias de su carrera
      orderBy: { semesterLevel: 'asc' },
      include: {
        enrollments: {
          where: { userId: userId },
          orderBy: { id: 'desc' }, // Traer el último intento
          take: 1,
          select: { status: true, finalGrade: true }
        }
      }
    });

    const data = subjects.map(s => {
      const lastEnrollment = s.enrollments[0];
      return {
        id: s.id,
        name: s.name,
        semester: s.semesterLevel,
        // Datos clave para la malla:
        enrollmentStatus: lastEnrollment ? lastEnrollment.status : null, // APPROVED, FAILED, TAKING
        grade: lastEnrollment ? lastEnrollment.finalGrade : null,
        isEnrolled: !!lastEnrollment && lastEnrollment.status === 'APPROVED' // Para bloquear en historial
      };
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener catálogo" });
  }
};

// Inscribirse a un curso
// 🟢 2. MODIFICADA: INSCRIBIRSE (VALIDACIÓN INTELIGENTE)
const enrollCourse = async (req: Request, res: Response) => {
  try {
    const { id } = (req as any).user;
    const { parallelId } = req.body;

    // 1. Validar Paralelo
    const parallel = await prisma.parallel.findUnique({
      where: { id: parseInt(parallelId) },
      include: { subject: true, _count: { select: { enrollments: true } } }
    });

    if (!parallel) return res.status(404).json({ error: "El curso no existe." });

    // 2. Validar Cupos
    if (parallel._count.enrollments >= parallel.capacity) {
      return res.status(400).json({ error: "El curso está lleno." });
    }

    // 3. 🔥 VALIDACIÓN ACADÉMICA (CORE)
    const history = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId: parseInt(String(id)),
          subjectId: parallel.subjectId
        }
      }
    });

    if (history) {
      // A. Si ya la aprobó -> BLOQUEAR
      if (history.status === 'APPROVED') {
        return res.status(400).json({ error: `Ya aprobaste ${parallel.subject.name} (Nota: ${history.finalGrade}). No puedes repetirla.` });
      }
      // B. Si la está cursando ahora -> BLOQUEAR
      if (history.status === 'TAKING') {
        return res.status(400).json({ error: "Ya estás cursando esta materia actualmente." });
      }
      // C. Si es 'FAILED' o 'PENDING' -> PERMITIR (Es repetición)
      // (El código continúa abajo y actualizará el registro existente o creará uno nuevo si borraste el anterior)
    }

    // 4. Inscribir (Upsert maneja la re-inscripción sobre un registro reprobado)
    await prisma.enrollment.upsert({
      where: {
        userId_subjectId: {
          userId: parseInt(String(id)),
          subjectId: parallel.subjectId
        }
      },
      update: {
        parallelId: parallel.id,
        status: 'TAKING',
        finalGrade: null // Reiniciamos nota al recursar
      },
      create: {
        userId: parseInt(String(id)),
        subjectId: parallel.subjectId,
        parallelId: parallel.id,
        status: 'TAKING'
      }
    });

    res.json({ message: "Inscripción exitosa" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al inscribirse" });
  }
};
// 🟢 SOLICITAR ASIGNACIÓN DE CARRERA
export const requestCareer = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = parseInt(String(req.user.id));

    await prisma.user.update({
      where: { id: userId },
      data: { requestingCareer: true }
    });

    res.json({ message: "Solicitud enviada al administrador." });
  } catch (error) {
    res.status(500).json({ error: "Error al enviar solicitud." });
  }
};

// Salir de un curso
const leaveCourse = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String((req as any).user.id));
    const { subjectId } = req.params; // Viene como subjectId pero es parallelId en el frontend

    // Convertimos a entero para Prisma
    const idToDelete = parseInt(String(subjectId));

    if (isNaN(idToDelete)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // INTENTO 1: Borrar por ID de Paralelo (Lo normal en el sistema nuevo)
    const deletedParallel = await prisma.enrollment.deleteMany({
      where: {
        userId: userId,
        parallelId: idToDelete
      }
    });

    if (deletedParallel.count > 0) {
      return res.json({ message: "Baja exitosa." });
    }

    // INTENTO 2: Limpieza de Zombies (Borrar por SubjectId si no tenía paralelo asignado)
    const deletedSubject = await prisma.enrollment.deleteMany({
      where: {
        userId: userId,
        subjectId: idToDelete
      }
    });

    if (deletedSubject.count > 0) {
      return res.json({ message: "Baja exitosa (registro antiguo)." });
    }

    res.status(404).json({ error: "No se encontró la inscripción." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al salir del curso" });
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
  bookTutoring,
  getAllCourses,
  enrollCourse,
  leaveCourse,
  getCatalogFilters,
  getOpenCourses,
  registerHistoricalGrades
};