import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// ---------------------------------------------------------
// 1. ESTADÍSTICAS DEL ESTUDIANTE (DASHBOARD)
// ---------------------------------------------------------
const getStudentStats = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id;

    // 1. Obtener datos del estudiante y su carrera
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        career: {
          include: { subjects: true } 
        },
        enrollments: {
            include: { subject: true } 
        }
      }
    });

    if (!user || !user.career) {
      res.status(404).send("DATOS_NO_ENCONTRADOS");
      return;
    }

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
        currentSemester = Math.max(...takingSubjects.map(t => t.subject.semesterLevel));
    } else if (approvedSubjects.length > 0) {
        currentSemester = Math.max(...approvedSubjects.map(a => a.subject.semesterLevel)) + 1;
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
    console.log(e);
    res.status(500).send("ERROR_STATS");
  }
};

// ---------------------------------------------------------
// 2. HORARIO SEMANAL (CALENDARIO) - ¡ESTA ES LA QUE FALTABA!
// ---------------------------------------------------------
const getWeeklySchedule = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id;

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

// EXPORTAMOS AMBAS FUNCIONES
export { getStudentStats, getWeeklySchedule };