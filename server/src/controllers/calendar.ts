import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// 1. OBTENER EVENTOS
const getEvents = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
        res.status(400).send("FALTA_COURSE_ID");
        return;
    }

    const events = await prisma.event.findMany({
      where: { parallelId: parseInt(String(courseId)) }, // Aseguramos string aquí también por si acaso
      orderBy: { date: 'asc' }
    });

    res.send(events);
  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_EVENTS");
  }
};

// 2. CREAR UN NUEVO EVENTO
const createEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { title, description, date, type, parallelId } = req.body;

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        type,
        parallelId: parseInt(String(parallelId))
      }
    });

    res.send(newEvent);
  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_CREATING_EVENT");
  }
};

// 3. BORRAR EVENTO (Aquí estaba el error)
const deleteEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    
    // CORRECCIÓN: Usamos String(id) para calmar a TypeScript
    await prisma.event.delete({ 
        where: { id: parseInt(String(id)) } 
    });
    
    res.send({ message: "Evento eliminado" });
  } catch (e) {
    console.log(e); // Agregué log para ver errores
    res.status(500).send("ERROR_DELETING");
  }
};

export { getEvents, createEvent, deleteEvent };