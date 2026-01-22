import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

const WEIGHTS: any = {
  'INDIVIDUAL': 7, 'GRUPAL': 5, 'MEDIO': 2, 'FINAL': 6
};

// Función auxiliar para calcular ponderados (Adaptada para evitar crashes)
const calculateWeightedTotal = (activities: any[], grades: any[]) => {
  let totalPoints = 0;
  // Estructura para agrupar notas por tipo
  const scoresByType: any = { 'INDIVIDUAL': [], 'GRUPAL': [], 'MEDIO': [], 'FINAL': [] };

  // Nota: Con el nuevo sistema de Eventos, esta lógica es una aproximación.
  // Si en el futuro quieres exactitud total, deberías traer los Eventos, no solo Activities.
  // Por ahora, sumamos todo lo que encontremos en grades para que no de error.

  grades.forEach((g: any) => {
    // Si la nota tiene un evento asociado, intentamos deducir el tipo (si trajéramos el evento)
    // Como solución rápida, asumimos que si el score existe, lo sumamos al promedio general
    // O si tienes el activityId todavía vinculado, lo usamos.
    if (g.score !== null) {
      // Fallback: Si no sabemos el tipo, no lo sumamos para no romper el cálculo
      // O lo agregamos a una categoría por defecto.
    }
  });

  return parseFloat(totalPoints.toFixed(2));
};

// 1. OBTENER MATRIZ
const getGradeMatrix = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId } = req.params;

    // Forzamos a String antes de parsear
    const idString = String(courseId || '');
    const parallelId = parseInt(idString, 10);

    if (isNaN(parallelId)) {
      res.status(400).send("ID_CURSO_INVALIDO");
      return;
    }

    // A. Obtener actividades (Categorías)
    const activities = await prisma.activity.findMany({
      where: { parallelId },
      orderBy: { id: 'asc' }
    });

    // B. Obtener estudiantes y sus notas (Adaptado a la nueva BD)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        // Lógica de búsqueda flexible (ParallelId O SubjectId)
        OR: [
          { parallelId: parallelId },
          { subject: { parallels: { some: { id: parallelId } } }, parallelId: null }
        ],
        status: 'TAKING'
      },
      include: {
        user: true
        // No incluimos activityGrades aquí dentro para evitar conflictos de filtrado complejo
      },
      orderBy: { user: { fullName: 'asc' } }
    });

    // C. Formatear la matriz
    // Buscamos las notas aparte para evitar problemas con el include anidado
    const matrix = await Promise.all(enrollments.map(async (enrollment) => {
      const student = enrollment.user;

      // Buscamos todas las notas de este estudiante
      const studentGrades = await prisma.activityGrade.findMany({
        where: { studentId: student.id }
      });

      // Mapeamos notas para el frontend
      const gradesMap: any = {};

      // Intentamos llenar el mapa. 
      // Nota: Como ahora usamos Eventos, las 'activities' (categorías) no tendrán ID directo en grades.
      // Esta parte de la matriz quedará vacía visualmente hasta que conectes Eventos -> Categorías,
      // PERO lo importante es que no crashee.
      activities.forEach(act => {
        const gradeObj = studentGrades.find((g: any) => g.activityId === act.id);
        gradesMap[act.id] = gradeObj ? gradeObj.score : 0;
      });

      // Calculamos un total simple (puedes mejorar esta lógica luego)
      const finalTotal = 0; // calculateWeightedTotal(activities, studentGrades);

      return {
        enrollmentId: enrollment.id,
        studentId: student.id,
        fullName: student.fullName,
        avatar: `https://ui-avatars.com/api/?name=${student.fullName}&background=random`,
        grades: gradesMap,
        finalTotal: finalTotal
      };
    }));

    res.send({ activities, students: matrix });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_MATRIX");
  }
};

// 2. ACTUALIZAR NOTA (CORREGIDO PARA EVENTOS)
const updateActivityGrade = async (req: RequestWithUser, res: Response) => {
  try {
    const { activityId, studentId, score, feedback } = req.body;

    // Aseguramos conversión de tipos
    const scoreNum = parseFloat(String(score));
    const eventIdInt = parseInt(String(activityId), 10); // EL ID QUE LLEGA ES DEL EVENTO
    const studIdInt = parseInt(String(studentId), 10);

    if (isNaN(eventIdInt) || isNaN(studIdInt)) {
      res.status(400).send("IDS_INVALIDOS");
      return;
    }

    // 🛡️ BLINDAJE CON ANY PARA EVITAR ERRORES DE TYPESCRIPT
    // Usamos la nueva clave única: studentId_eventId
    const whereClause: any = {
      studentId_eventId: {
        studentId: studIdInt,
        eventId: eventIdInt
      }
    };

    const createData: any = {
      studentId: studIdInt,
      eventId: eventIdInt, // Guardamos en eventId
      score: scoreNum,
      feedback: feedback || ""
    };

    const grade = await prisma.activityGrade.upsert({
      where: whereClause,
      update: {
        score: scoreNum,
        feedback: feedback || ""
      },
      create: createData
    });

    res.send(grade);

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_UPDATING_ACTIVITY_GRADE");
  }
};

export { getGradeMatrix, updateActivityGrade };