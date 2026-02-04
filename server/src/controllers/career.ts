import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Definimos una interfaz para extender la Request
interface RequestWithUser extends Request {
  user?: any;
}

const getMyCareerPlan = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;

    // Validación de seguridad extra
    if (!userId) {
      console.error("❌ Error: ID de usuario no encontrado en el token.");
      res.status(401).send("TOKEN_INVALIDO");
      return;
    }

    // 2. Buscar al usuario y su carrera
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { career: true }
    });

    if (!user) {
      res.status(404).send("USUARIO_NO_ENCONTRADO");
      return;
    }

    if (!user.careerId || !user.career) {
      res.status(404).send("USUARIO_SIN_CARRERA_ASIGNADA");
      return;
    }

    // 3. Buscar todas las materias Y el estado para ESTE usuario
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

    // 4. Procesar datos para el frontend
    const subjectsWithStatus = subjects.map(s => {
      const enrollment = s.enrollments[0];
      return {
        id: s.id,
        name: s.name,
        semesterLevel: s.semesterLevel,
        status: enrollment ? enrollment.status : 'PENDING', // PENDING por defecto
        grade: enrollment ? enrollment.finalGrade : null
      };
    });

    // 5. Agrupar por semestre
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
    console.error("🔥 ERROR EN CAREER PLAN:", e); // Log detallado
    res.status(500).send("ERROR_GETTING_PLAN");
  }
};

export { getMyCareerPlan };