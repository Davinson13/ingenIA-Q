import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

const WEIGHTS: any = {
  'INDIVIDUAL': 7, 'GRUPAL': 5, 'MEDIO': 2, 'FINAL': 6
};

// Función auxiliar para calcular ponderados
const calculateWeightedTotal = (activities: any[], grades: any[]) => {
  let totalPoints = 0;
  const scoresByType: any = { 'INDIVIDUAL': [], 'GRUPAL': [], 'MEDIO': [], 'FINAL': [] };

  activities.forEach(act => {
    // Tipado explícito para 'g'
    const gradeObj = grades.find((g: any) => g.activityId === act.id);
    if (gradeObj && scoresByType[act.type]) {
        scoresByType[act.type].push(gradeObj.score);
    }
  });

  Object.keys(WEIGHTS).forEach(type => {
    const scores = scoresByType[type];
    const weight = WEIGHTS[type];
    if (scores && scores.length > 0) {
      const sum = scores.reduce((a: number, b: number) => a + b, 0);
      const avg20 = sum / scores.length;
      totalPoints += (avg20 * weight) / 20;
    }
  });

  return parseFloat(totalPoints.toFixed(2));
};

// 1. OBTENER MATRIZ
const getGradeMatrix = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId } = req.params;

    // Forzamos a String antes de parsear para evitar el error de TypeScript
    const idString = String(courseId || '');
    const parallelId = parseInt(idString, 10);

    if (isNaN(parallelId)) {
        res.status(400).send("ID_CURSO_INVALIDO");
        return;
    }

    // A. Obtener actividades
    const activities = await prisma.activity.findMany({
      where: { parallelId },
      orderBy: { id: 'asc' } 
    });

    // B. Obtener estudiantes y sus notas
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        subject: { parallels: { some: { id: parallelId } } },
        status: 'TAKING' 
      },
      include: { 
        user: {
          include: {
            activityGrades: {
              where: { activity: { parallelId } }
            }
          }
        } 
      },
      orderBy: { user: { fullName: 'asc' } }
    });

    // C. Formatear
    const matrix = enrollments.map(enrollment => {
      const student = enrollment.user;
      const studentGrades: any = {};
      
      activities.forEach(act => {
        // Definimos 'g' como any para evitar error de tipado
        const gradeObj = student.activityGrades.find((g: any) => g.activityId === act.id);
        studentGrades[act.id] = gradeObj ? gradeObj.score : 0;
      });

      const finalTotal = calculateWeightedTotal(activities, student.activityGrades);

      return {
        enrollmentId: enrollment.id,
        studentId: student.id,
        fullName: student.fullName,
        avatar: `https://ui-avatars.com/api/?name=${student.fullName}&background=random`,
        grades: studentGrades,
        finalTotal: finalTotal
      };
    });

    res.send({ activities, students: matrix });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_MATRIX");
  }
};

// 2. ACTUALIZAR NOTA
const updateActivityGrade = async (req: RequestWithUser, res: Response) => {
  try {
    const { activityId, studentId, score } = req.body;
    
    // Aseguramos que score sea número
    const scoreNum = parseFloat(score);

    // Forzamos IDs a enteros
    const actId = parseInt(String(activityId), 10);
    const studId = parseInt(String(studentId), 10);

    if (isNaN(actId) || isNaN(studId)) {
        res.status(400).send("IDS_INVALIDOS");
        return;
    }

    const grade = await prisma.activityGrade.upsert({
      where: {
        activityId_studentId: {
          activityId: actId,
          studentId: studId
        }
      },
      update: { score: scoreNum },
      create: {
        activityId: actId,
        studentId: studId,
        score: scoreNum
      }
    });

    res.send(grade);

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_UPDATING_ACTIVITY_GRADE");
  }
};

export { getGradeMatrix, updateActivityGrade };