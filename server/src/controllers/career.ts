import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Definimos una interfaz para extender la Request y evitar errores de "user"
interface RequestWithUser extends Request {
  user?: any; 
}

const getMyCareerPlan = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id; 

    // 1. Buscar al usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { career: true } 
    });

    // Validación explícita
    if (!user || !user.careerId || !user.career) {
      res.status(404).send("USUARIO_SIN_CARRERA_ASIGNADA");
      return; 
    }

    // 2. Buscar todas las materias Y el estado para ESTE usuario
    const subjects = await prisma.subject.findMany({
      where: { careerId: user.careerId },
      include: {
        enrollments: {
          where: { userId: userId }, // Solo el estado de ESTE usuario
          select: { status: true, finalGrade: true }
        }
      },
      orderBy: { semesterLevel: 'asc' }
    });

    // 3. Procesar datos para el frontend
    // El frontend espera un objeto limpio, así que aplanamos la estructura
    const subjectsWithStatus = subjects.map(s => {
      const enrollment = s.enrollments[0]; // Puede ser undefined si es PENDING
      return {
        id: s.id,
        name: s.name,
        semesterLevel: s.semesterLevel,
        status: enrollment ? enrollment.status : 'PENDING', // Si no hay registro, es pendiente
        grade: enrollment ? enrollment.finalGrade : null
      };
    });

    // 4. Agrupar por semestre (Usamos la lista procesada)
    const subjectsBySemester = subjectsWithStatus.reduce((acc: any, subject) => {
      const level = subject.semesterLevel;
      if (!acc[level]) acc[level] = [];
      acc[level].push(subject);
      return acc;
    }, {});

    res.send({
      careerName: user.career.name,
      totalSemesters: user.career.totalSemesters,
      plan: subjectsBySemester
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_PLAN");
  }
};

export { getMyCareerPlan };