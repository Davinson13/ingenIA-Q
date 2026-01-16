import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// PESOS ESTÁTICOS (Para cálculo de notas)
const WEIGHTS: any = {
  'INDIVIDUAL': 7,
  'GRUPAL': 5,
  'MEDIO': 2,
  'FINAL': 6
};

// ---------------------------------------------------------
// 1. ESTADÍSTICAS DEL ESTUDIANTE (DASHBOARD)
// ---------------------------------------------------------
// 1. ESTADÍSTICAS DEL ESTUDIANTE (CON LOGS DE DEPURACIÓN)
const getStudentStats = async (req: RequestWithUser, res: Response) => {
  try {
    // 🕵️‍♂️ DETECTIVE DE ERRORES:
    console.log("------------------------------------------------");
    console.log("🔍 REVISANDO TOKEN RECIBIDO:");
    console.log(req.user);
    // Si aquí ves "_id", es que el navegador sigue usando el token viejo.

    // 1. Validación de seguridad ANTES de llamar a Prisma
    if (!req.user || !req.user.id) {
      console.error("❌ ERROR CRÍTICO: El token no tiene 'id'. Posiblemente es un token viejo de MongoDB.");
      res.status(401).send("TOKEN_INVALIDO_REINICIA_SESION");
      return;
    }

    const userId = req.user.id;
    console.log(`✅ ID válido detectado: ${userId}. Consultando base de datos...`);

    // 2. Obtener datos del estudiante
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        career: { include: { subjects: true } },
        enrollments: { include: { subject: true } }
      }
    });

    if (!user) {
      console.error(`❌ El usuario con ID ${userId} no existe en la BD (¿Hiciste seed de nuevo?).`);
      res.status(404).send("USUARIO_NO_ENCONTRADO");
      return;
    }

    if (!user.career) {
      res.status(400).send("USUARIO_SIN_CARRERA");
      return;
    }

    // ... (El resto de tus cálculos matemáticos siguen igual aquí abajo) ...
    // 2. CÁLCULOS MATEMÁTICOS
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
    } else if (approvedSubjects.length > 0) {
      const levels = approvedSubjects.map(a => a.subject.semesterLevel);
      currentSemester = levels.length > 0 ? Math.max(...levels) + 1 : 1;
    }

    res.send({
      fullName: user.fullName,
      careerName: user.career.name,
      stats: {
        average: average,
        approvedCount: approvedSubjects.length,
        totalSubjects: totalSubjects,
        progress: progressPercentage,
        takingCount: takingSubjects.length,
        currentSemester: currentSemester
      }
    });

  } catch (e) {
    console.error("🔥 ERROR EN SERVER:", e);
    res.status(500).send("ERROR_STATS");
  }
};

// ---------------------------------------------------------
// 2. HORARIO SEMANAL (CALENDARIO)
// ---------------------------------------------------------
const getWeeklySchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id; // CORREGIDO: .id

    // 1. Buscar materias que el estudiante está cursando (TAKING)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
        status: 'TAKING'
      },
      include: {
        subject: {
          include: {
            parallels: {
              include: { schedules: true }
            }
          }
        }
      }
    });

    // 2. Aplanar la estructura para el frontend
    let scheduleEvents: any[] = [];

    enrollments.forEach((enrollment) => {
      // Asumimos que toma el primer paralelo disponible (simplificación para MVP)
      const parallel = enrollment.subject.parallels[0];

      if (parallel && parallel.schedules) {
        parallel.schedules.forEach(sched => {
          scheduleEvents.push({
            id: sched.id,
            subjectName: enrollment.subject.name,
            dayOfWeek: sched.dayOfWeek, // 1=Lunes
            startTime: sched.startTime,
            endTime: sched.endTime,
            classroom: 'Aula 101' // Dato simulado por ahora
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
// 3. LISTA DE CALIFICACIONES (HISTORIAL)
// ---------------------------------------------------------
const getStudentGrades = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;

    // Buscar todas las matrículas del estudiante
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: userId },
      include: {
        subject: true
      },
      orderBy: { subject: { semesterLevel: 'asc' } } // Ordenar por semestre
    });

    // Formatear para el frontend
    const grades = enrollments.map(e => ({
      id: e.id,
      subjectName: e.subject.name,
      semester: e.subject.semesterLevel,
      status: e.status, // TAKING, APPROVED, FAILED
      grade: e.finalGrade // Puede ser null si aún no tiene nota
    }));

    res.send(grades);

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_STUDENT_GRADES");
  }
};

// 4. DETALLE DE CURSO Y ACTIVIDADES
const getStudentCourseDetails = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    // CORRECCIÓN PARA: parseInt error
    const idString = String(courseId || '');
    const parallelId = parseInt(idString, 10);

    if (isNaN(parallelId)) {
      res.status(400).send("ID_CURSO_INVALIDO");
      return;
    }

    const parallel = await prisma.parallel.findUnique({
      where: { id: parallelId },
      include: {
        subject: true,
        activities: { orderBy: { id: 'asc' } }
      }
    });

    // CORRECCIÓN PARA: Object is possibly 'null'
    if (!parallel) {
      res.status(404).send("CURSO_NO_ENCONTRADO");
      return;
    }

    const myGrades = await prisma.activityGrade.findMany({
      where: {
        studentId: userId,
        activity: { parallelId: parallel.id }
      },
      include: { activity: true }
    });

    const typeAccumulated: any = {
      'INDIVIDUAL': { sum: 0, count: 0, weight: 7 },
      'GRUPAL': { sum: 0, count: 0, weight: 5 },
      'MEDIO': { sum: 0, count: 0, weight: 2 },
      'FINAL': { sum: 0, count: 0, weight: 6 }
    };

    const activitiesList = parallel.activities.map(act => {
      // CORRECCIÓN PARA: Parameter 'g' implicitly has an 'any' type
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
        const points = (avg20 * data.weight) / 20;
        finalTotal += points;
      }
    });

    res.send({
      subjectName: parallel.subject.name,
      parallelCode: parallel.code,
      activities: activitiesList,
      finalTotal: parseFloat(finalTotal.toFixed(2))
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_STUDENT_COURSE_DETAILS");
  }
};

// EXPORTAMOS LAS 4 FUNCIONES
export {
  getStudentStats,
  getWeeklySchedule,
  getStudentGrades,
  getStudentCourseDetails
};