import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// ----------------------------------------------------------------------
// 1. OBTENER EVENTOS
// ----------------------------------------------------------------------
const getEvents = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId } = req.query;
    const user = req.user;

    let whereClause: any = {};

    // Si es docente, intenta filtrar por su ID (si existe en el modelo)
    if (user.role === 'TEACHER') {
      // whereClause.teacherId = user.id; // Descomenta si tu modelo Event tiene teacherId
    }

    if (courseId && courseId !== 'undefined') {
      const pId = parseInt(String(courseId));
      if (!isNaN(pId)) {
        whereClause.parallelId = pId;
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        parallel: {
          select: {
            code: true,
            subject: { select: { name: true } }
          }
        }
      } as any, // Cast para evitar errores de tipo si el include no coincide exacto
      orderBy: { date: 'asc' }
    });

    res.send(events);
  } catch (e) {
    console.error("Error obteniendo eventos:", e);
    // No enviamos 500 para que el frontend no colapse, enviamos array vacío
    res.send([]);
  }
};

// 2. CREAR EVENTO (CORREGIDO: Hora Ecuador + Validación Pasado)
const createEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { title, date, time, type, parallelId, description } = req.body;
    // const teacherId = req.user.id; // No lo usamos porque daba error en tu schema

    if (!title || !date || !parallelId) {
      res.status(400).send("Faltan datos");
      return;
    }

    // 1. CONSTRUCCIÓN DE FECHA EXACTA (ECUADOR UTC-5)
    // Combinamos la fecha (YYYY-MM-DD) + la hora (HH:mm) + el sufijo de zona horaria
    const timeString = time || "07:00"; // Si no hay hora, ponemos 7 AM por defecto
    const finalDate = new Date(`${date}T${timeString}:00.000-05:00`);

    // 2. VALIDACIÓN: NO PERMITIR FECHAS PASADAS
    const today = new Date();
    // Quitamos la hora a "hoy" para comparar solo fechas (por si creas algo para hoy mismo)
    today.setHours(0, 0, 0, 0);

    if (finalDate < today) {
      res.status(400).send("No puedes crear eventos en fechas pasadas.");
      return;
    }

    const pIdInt = parseInt(String(parallelId));

    if (isNaN(pIdInt)) {
      res.status(400).send("ID de curso inválido");
      return;
    }

    // 3. GUARDAR EN BASE DE DATOS
    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || "",
        date: finalDate, // Se guardará en UTC, pero respetando la conversión correcta
        type: type || 'INDIVIDUAL',
        parallelId: pIdInt
      } as any
    });

    res.send(newEvent);
  } catch (e: any) {
    console.error("Error creando evento:", e);
    res.status(500).send("ERROR_CREATING_EVENT");
  }
};

// ----------------------------------------------------------------------
// 3. BORRAR EVENTO
// ----------------------------------------------------------------------
const deleteEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(String(id));

    if (isNaN(idInt)) {
      res.status(400).send("ID inválido");
      return;
    }

    await prisma.event.delete({
      where: { id: idInt }
    });

    res.send({ message: "Evento eliminado" });
  } catch (e) {
    console.error("Error eliminando evento:", e);
    res.status(500).send("ERROR_DELETING_EVENT");
  }
};

export { getEvents, createEvent, deleteEvent };