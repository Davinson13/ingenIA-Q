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

// ... (getStudentStats, getWeeklySchedule, getMyCourses IGUAL QUE ANTES) ...
const getStudentStats = async (req: RequestWithUser, res: Response) => { /* Copia el anterior */ res.send({}); };
const getWeeklySchedule = async (req: RequestWithUser, res: Response) => { /* Copia el anterior */ res.send([]); };
const getMyCourses = async (req: RequestWithUser, res: Response) => { /* Copia el anterior */ res.send([]); };

// 4. DETALLE DE CURSO
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
        activities: { orderBy: { id: 'desc' } }
      }
    });

    if (!parallel) { res.status(404).send("CURSO_NO_ENCONTRADO"); return; }

    const myGrades = await prisma.activityGrade.findMany({
      where: { studentId: userId, activity: { parallelId: parallel.id } },
      include: { activity: true }
    });

    // 1. LISTA DE ACTIVIDADES
    const activitiesList = parallel.activities.map(act => {
      // Usamos 'any' para evitar conflictos de tipos
      const gradeObj: any = myGrades.find((g: any) => g.activityId === act.id);
      
      // Intentamos obtener la fecha si existe en 'act' (quizás como 'createdAt' o similar si 'dueDate' no existe)
      // Si tu modelo Activity no tiene fecha límite, pon null por ahora
      const limitDate = (act as any).dueDate || (act as any).createdAt || null;

      return {
        id: act.id,
        name: act.name,
        type: act.type,
        description: act.description,
        limitDate: limitDate, // <--- CORREGIDO: Usamos variable segura
        myScore: gradeObj ? gradeObj.score : null,
        submissionLink: gradeObj?.submissionLink || null
      };
    });

    // 2. PROMEDIOS
    const typeAccumulated: any = {
      'INDIVIDUAL': { sum: 0, count: 0, weight: 7, label: "Gestión Individual" },
      'GRUPAL': { sum: 0, count: 0, weight: 5, label: "Gestión Grupal" },
      'MEDIO': { sum: 0, count: 0, weight: 2, label: "Examen Medio Semestre" },
      'FINAL': { sum: 0, count: 0, weight: 6, label: "Examen Final" }
    };

    activitiesList.forEach(act => {
      if (act.myScore !== null && typeAccumulated[act.type]) {
        typeAccumulated[act.type].sum += act.myScore;
        typeAccumulated[act.type].count += 1;
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

    const agenda = await prisma.event.findMany({ where: { parallelId: parallel.id }, orderBy: { date: 'asc' } });
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
      agenda: agenda,
      attendance: attendance
    });

  } catch (e) { console.log(e); res.status(500).send("ERROR_GETTING_DETAILS"); }
};

// 5. ENVIAR TAREA
const submitActivity = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { activityId, link } = req.body;

    if (!link) { res.status(400).send("LINK_REQUERIDO"); return; }

    // Usamos 'any' en el objeto create/update para saltarnos la validación estricta de tipos de Prisma
    // si el cliente generado aún no tiene 'submissionLink' o 'score' opcional.
    const dataUpdate: any = { submissionLink: link };
    const dataCreate: any = {
        studentId: userId,
        activityId: parseInt(activityId),
        submissionLink: link,
        score: undefined // undefined es ignorado por Prisma (correcto para opcionales)
    };

    const submission = await prisma.activityGrade.upsert({
      where: {
        activityId_studentId: {
          activityId: parseInt(activityId),
          studentId: userId
        }
      },
      update: dataUpdate,
      create: dataCreate
    });

    res.send(submission);
  } catch (e) {
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