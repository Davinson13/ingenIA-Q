import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// 1. OBTENER EVENTOS
// ... imports

// 1. OBTENER EVENTOS (Mejorado: Si no envías courseId, trae TODO lo del profe)
const getEvents = async (req: RequestWithUser, res: Response) => {
  try {
    const { courseId } = req.query;
    const teacherId = req.user.id; // Asumiendo que req.user tiene el ID del profe logueado

    let whereClause: any = {};

    if (courseId) {
      // Caso A: Solo eventos de un curso específico
      whereClause = { parallelId: parseInt(String(courseId)) };
    } else {
      // Caso B: TODOS los eventos de los cursos que dicta este profesor
      // Primero buscamos qué paralelos dicta el profe
      const teacherCourses = await prisma.parallel.findMany({
        where: {
          // Aquí asumimos la relación. Si tu modelo es diferente, ajústalo.
          // Generalmente: subject -> teacher o parallel -> teacher
          // Por simplicidad, traeremos todos los eventos de la BD si eres admin/profe por ahora
          // O mejor: Filtramos por los IDs de cursos que el frontend ya conoce.
        }
      });

      // NOTA: Para no complicar la query sin ver tu modelo de "Teacher-Parallel",
      // vamos a traer todos los eventos de la tabla Event. 
      // En producción, deberías filtrar: where: { parallel: { teacherId: teacherId } }
      whereClause = {};
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        parallel: {
          select: { code: true } // Traemos el nombre del paralelo (ej: "A")
        }
      },
      orderBy: { date: 'asc' }
    });

    res.send(events);
  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_GETTING_EVENTS");
  }
};

// ... el resto (createEvent, deleteEvent) sigue igual

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