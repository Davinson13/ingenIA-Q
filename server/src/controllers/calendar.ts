import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// ==============================================================================
// SECCIÓN 1: GESTIÓN DE EVENTOS ACADÉMICOS (DENTRO DEL CURSO)
// ==============================================================================

// 1. OBTENER EVENTOS DE UN CURSO ESPECÍFICO
const getEvents = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId } = req.query;
    if (!courseId || courseId === 'undefined') {
      res.send([]);
      return;
    }

    const pId = parseInt(String(courseId));
    if (isNaN(pId)) {
      res.send([]);
      return;
    }

    const events = await prisma.event.findMany({
      where: { parallelId: pId },
      include: {
        parallel: {
          select: {
            code: true,
            subject: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    res.send(events);
  } catch (e) {
    console.error("Error obteniendo eventos de curso:", e);
    res.send([]);
  }
};

// 2. CREAR EVENTO ACADÉMICO
const createEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { title, date, time, type, parallelId, description } = req.body;

    if (!title || !date || !parallelId) {
      res.status(400).send("Faltan datos");
      return;
    }

    const timeString = time || "07:00";
    const finalDate = new Date(`${date}T${timeString}:00.000-05:00`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (finalDate < today) {
      res.status(400).send("No puedes crear eventos en fechas pasadas.");
      return;
    }

    const pIdInt = parseInt(String(parallelId));

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || "",
        date: finalDate,
        type: type || 'INDIVIDUAL',
        parallelId: pIdInt
      }
    });

    res.send(newEvent);
  } catch (e) {
    console.error("Error creando evento:", e);
    res.status(500).send("ERROR_CREATING_EVENT");
  }
};

// 3. BORRAR EVENTO ACADÉMICO
const deleteEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(String(id));
    await prisma.event.delete({ where: { id: idInt } });
    res.send({ message: "Evento eliminado" });
  } catch (e) {
    console.error("Error eliminando evento:", e);
    res.status(500).send("ERROR_DELETING_EVENT");
  }
};


// ==============================================================================
// SECCIÓN 2: AGENDA GLOBAL MENSUAL
// ==============================================================================

// 4. OBTENER AGENDA MENSUAL UNIFICADA
const getMonthAgenda = async (req: RequestWithUser, res: Response) => {
  try {
    const teacherId = req.user.id;
    const { month, year } = req.query;

    const targetMonth = parseInt(String(month));
    const targetYear = parseInt(String(year));

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // A. TRAER EVENTOS DE LA DB
    const academicEvents = await prisma.event.findMany({
      where: {
        parallel: { teacherId: teacherId },
        date: { gte: startDate, lte: endDate }
      },
      include: { parallel: { include: { subject: true } } }
    });

    const tutorings = await prisma.tutoring.findMany({
      where: {
        teacherId: teacherId,
        date: { gte: startDate, lte: endDate }
      },
      include: { subject: true }
    });

    const personalEvents = await prisma.personalEvent.findMany({
      where: {
        teacherId: teacherId,
        date: { gte: startDate, lte: endDate }
      }
    });

    // B. GENERAR HORARIO DE CLASES
    const schedules = await prisma.schedule.findMany({
      where: { parallel: { teacherId: teacherId } },
      include: { parallel: { include: { subject: true } } }
    });

    // 🔥 CORRECCIÓN 1: Definimos explícitamente el tipo del array como any[]
    const classEvents: any[] = [];
    let loopDate = new Date(startDate);

    while (loopDate <= endDate) {
      const dayOfWeek = loopDate.getDay();

      const dailyClasses = schedules.filter(s => s.dayOfWeek === dayOfWeek);

      dailyClasses.forEach(sched => {
        const classDate = new Date(loopDate);
        const [hours, minutes] = sched.startTime.split(':');
        classDate.setHours(parseInt(hours), parseInt(minutes));

        classEvents.push({
          id: `class-${sched.id}-${loopDate.getDate()}`,
          title: sched.parallel.subject.name,
          description: `Clase Paralelo ${sched.parallel.code}`,
          date: classDate,
          type: 'CLASE',
          color: 'blue'
        });
      });
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // C. MEZCLAR TODO
    const agenda = [
      ...classEvents, // Ahora TypeScript sabe que esto es un array
      ...academicEvents.map(e => ({
        id: `acad-${e.id}`,
        title: e.title,
        description: `Actividad: ${e.type}`,
        date: e.date,
        type: 'ACADEMICO',
        color: 'orange'
      })),
      ...tutorings.map(t => ({
        id: `tut-${t.id}`,
        title: "Tutoría",
        description: t.subject ? t.subject.name : "Tutoría General",
        date: t.date,
        type: 'TUTORIA',
        color: 'purple'
      })),
      ...personalEvents.map(p => ({
        id: `pers-${p.id}`,
        title: p.title,
        description: p.description || "Personal",
        date: p.date,
        type: 'EXTRA',
        color: 'green'
      }))
    ];

    agenda.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.send(agenda);

  } catch (e) {
    console.error("Error agenda mensual:", e);
    res.status(500).send("ERROR_AGENDA");
  }
};

// 5. CREAR EVENTO EXTRACURRICULAR
const createPersonalEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const teacherId = req.user.id;
    const { title, description, date, time } = req.body;

    const dateTime = new Date(`${date}T${time}:00.000Z`);

    const event = await prisma.personalEvent.create({
      data: {
        title,
        description,
        date: dateTime,
        teacherId
      }
    });

    res.send(event);
  } catch (e) {
    console.error(e);
    res.status(500).send("ERROR_CREATING_PERSONAL");
  }
};

// 6. BORRAR EVENTO EXTRACURRICULAR
const deletePersonalEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    // 🔥 CORRECCIÓN 2: Usamos String(id) para asegurar que parseInt reciba texto
    await prisma.personalEvent.delete({ where: { id: parseInt(String(id)) } });
    res.send({ success: true });
  } catch (e) {
    res.status(500).send("ERROR_DELETING_PERSONAL");
  }
};

export {
  getEvents,
  createEvent,
  deleteEvent,
  getMonthAgenda,
  createPersonalEvent,
  deletePersonalEvent
};