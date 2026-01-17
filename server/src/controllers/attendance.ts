import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// 1. OBTENER LISTA DE ASISTENCIA (Por fecha y curso)
const getAttendance = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId, date } = req.query; // Ejemplo date: "2026-01-16"
    
    if (!courseId || !date) {
        res.status(400).send("FALTAN_DATOS");
        return;
    }

    const parallelId = parseInt(String(courseId));
    // Convertimos el string a objeto Date (sin hora)
    const queryDate = new Date(String(date));

    // A. Buscar estudiantes del curso
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        subject: { parallels: { some: { id: parallelId } } },
        status: 'TAKING'
      },
      include: {
        user: true,
        // B. Intentar buscar si ya tienen asistencia ese día
        attendance: {
          where: { date: queryDate }
        }
      },
      orderBy: { user: { fullName: 'asc' } }
    });

    // C. Formatear respuesta
    const roster = enrollments.map(e => ({
      enrollmentId: e.id,
      studentId: e.user.id,
      fullName: e.user.fullName,
      avatar: `https://ui-avatars.com/api/?name=${e.user.fullName}&background=random`,
      // Si existe registro usa ese, si no, asume "PRESENT" por defecto visualmente (o null)
      status: e.attendance.length > 0 ? e.attendance[0].status : null 
    }));

    res.send(roster);

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_ATTENDANCE");
  }
};

// 2. GUARDAR ASISTENCIA
const saveAttendance = async (req: RequestWithUser, res: Response) => {
  try {
    const { date, records } = req.body; 
    // records es un array: [{ enrollmentId: 1, status: 'ABSENT' }, ...]

    const targetDate = new Date(date);

    // Usamos una transacción para guardar todo rápido
    const transactions = records.map((rec: any) => {
      return prisma.attendance.upsert({
        where: {
          date_enrollmentId: {
            date: targetDate,
            enrollmentId: rec.enrollmentId
          }
        },
        update: { status: rec.status },
        create: {
          date: targetDate,
          enrollmentId: rec.enrollmentId,
          status: rec.status
        }
      });
    });

    await prisma.$transaction(transactions);

    res.send({ message: "Asistencia guardada" });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_SAVING_ATTENDANCE");
  }
};

export { getAttendance, saveAttendance };