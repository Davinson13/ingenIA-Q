import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

// ==============================================================================
// 🟢 SECCIÓN 1: COMÚN (PARA TODOS LOS ROLES)
// ==============================================================================

// 🟢 5. CREAR EVENTO EXTRACURRICULAR (VALIDADO)
const createPersonalEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user.id;
    const { title, description, date, time } = req.body;

    // 1. Construir fecha con zona horaria (UTC-5 Ecuador)
    const dateTime = new Date(`${date}T${time}:00.000-05:00`);
    const now = new Date();

    // 2. Validar que no sea pasado (damos 1 min de gracia por latencia)
    if (dateTime.getTime() < (now.getTime() - 60000)) {
      res.status(400).send("No puedes crear eventos en fechas u horas pasadas.");
      return;
    }

    const event = await prisma.personalEvent.create({
      data: {
        title,
        description,
        date: dateTime,
        userId
      }
    });

    res.send(event);
  } catch (e) {
    console.error(e);
    res.status(500).send("ERROR_CREATING_PERSONAL");
  }
};

// ELIMINAR EVENTO PERSONAL
const deletePersonalEvent = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.personalEvent.delete({ where: { id: parseInt(String(id)) } });
    res.send({ success: true });
  } catch (e) {
    res.status(500).send("ERROR_DELETING_PERSONAL");
  }
};

// ==============================================================================
// 🟢 SECCIÓN 2: DOCENTE (GESTIÓN DE CURSOS Y AGENDA)
// ==============================================================================

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

const getMonthAgenda = async (req: RequestWithUser, res: Response) => {
  try {
    const teacherId = req.user.id;
    const { month, year } = req.query;

    const targetMonth = parseInt(String(month));
    const targetYear = parseInt(String(year));

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // 1. Académicos
    const academicEvents = await prisma.event.findMany({
      where: {
        parallel: { teacherId: teacherId },
        date: { gte: startDate, lte: endDate }
      },
      include: { parallel: { include: { subject: true } } }
    });

    // 2. Tutorías
    const tutorings = await prisma.tutoring.findMany({
      where: {
        teacherId: teacherId,
        date: { gte: startDate, lte: endDate }
      },
      include: { subject: true }
    });

    // 3. Personales
    const personalEvents = await prisma.personalEvent.findMany({
      where: {
        userId: teacherId,
        date: { gte: startDate, lte: endDate }
      }
    });

    // 4. Clases Recurrentes
    const schedules = await prisma.schedule.findMany({
      where: { parallel: { teacherId: teacherId } },
      include: { parallel: { include: { subject: true } } }
    });

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

    const agenda = [
      ...classEvents,
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
    console.error("Error agenda docente:", e);
    res.status(500).send("ERROR_AGENDA");
  }
};

// ==============================================================================
// 🟢 SECCIÓN 3: ESTUDIANTE (AGENDA COMPLETA CORREGIDA)
// ==============================================================================

const getStudentAgenda = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = req.user.id;
    const { month, year } = req.query;

    const targetMonth = parseInt(String(month));
    const targetYear = parseInt(String(year));

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // 1. MIS CLASES (Inscripciones)
    // 🔥 CORRECCIÓN: Quitamos 'events: true' dentro de subject, ya que no existe esa relación directa
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentId,
        status: { in: ['TAKING', 'PENDING', 'APPROVED'] }
      },
      include: {
        parallel: { include: { subject: true, schedules: true } },
        subject: {
          include: {
            parallels: { include: { schedules: true } } // Solo traemos paralelos para backup
          }
        }
      }
    });

    // 2. ACTIVIDADES ACADÉMICAS
    const validParallelIds: number[] = [];

    // 🔥 CORRECCIÓN: Usamos (enr: any) para que TS no se queje de propiedades anidadas
    enrollments.forEach((enr: any) => {
      if (enr.parallelId) {
        validParallelIds.push(enr.parallelId);
      } else if (enr.subject && enr.subject.parallels.length > 0) {
        // Si no tiene paralelo asignado, miramos todos los paralelos de la materia
        enr.subject.parallels.forEach((p: any) => validParallelIds.push(p.id));
      }
    });

    const academicEventsData = await prisma.event.findMany({
      where: {
        parallelId: { in: validParallelIds },
        date: { gte: startDate, lte: endDate }
      },
      include: { parallel: { include: { subject: true } } }
    });

    // 3. MIS TUTORÍAS (Reservadas)
    const myTutorings = await prisma.tutoringBooking.findMany({
      where: { studentId: studentId },
      include: { tutoring: { include: { subject: true } } }
    });

    // 4. PERSONALES
    const personalEvents = await prisma.personalEvent.findMany({
      where: { userId: studentId, date: { gte: startDate, lte: endDate } }
    });

    // 5. CURSOS COMPLEMENTARIOS
    const externalCourses = await prisma.externalCourse.findMany({
      where: { studentId: studentId }
    });

    const agenda: any[] = [];

    // A. Generar Eventos Recurrentes (Clases + Cursos Externos)
    let loopDate = new Date(startDate);
    while (loopDate <= endDate) {
      const dayOfWeek = loopDate.getDay(); // 0=Domingo...

      // A1. CLASES (LÓGICA MEJORADA)
      enrollments.forEach((enr: any) => {
        let schedulesToUse: any[] = [];
        let subjectName = enr.subject.name;

        // CASO 1: Tiene paralelo oficial
        if (enr.parallel && enr.parallel.schedules) {
          schedulesToUse = enr.parallel.schedules;
        }
        // CASO 2: No tiene paralelo (es NULL), usamos el primero que encontremos de la materia
        else if (enr.subject && enr.subject.parallels && enr.subject.parallels.length > 0) {
          schedulesToUse = enr.subject.parallels[0].schedules;
        }

        if (schedulesToUse.length > 0) {
          schedulesToUse.forEach((sch: any) => {
            if (sch.dayOfWeek === dayOfWeek) {
              const d = new Date(loopDate);
              const [h, m] = sch.startTime.split(':');
              d.setHours(parseInt(h), parseInt(m));

              agenda.push({
                id: `class-${enr.id}-${d.getDate()}-${h}`,
                title: subjectName,
                description: `Aula: ${sch.classroom || 'General'}`,
                date: d,
                type: 'CLASE',
                color: 'blue'
              });
            }
          });
        }
      });

      // A2. Externos
      externalCourses.forEach(ext => {
        if (loopDate >= ext.startDate && loopDate <= ext.endDate) {
          const daysArray = ext.days.split(',').map(Number);
          if (daysArray.includes(dayOfWeek)) {
            const d = new Date(loopDate);
            const [h, m] = ext.startTime.split(':');
            d.setHours(parseInt(h), parseInt(m));
            agenda.push({
              id: `ext-${ext.id}-${d.getDate()}`,
              title: ext.name,
              description: `Curso Complementario (${ext.startTime} - ${ext.endTime})`,
              date: d,
              type: 'COMPLEMENTARIO',
              color: 'teal'
            });
          }
        }
      });

      loopDate.setDate(loopDate.getDate() + 1);
    }

    // B. Mapear Eventos Únicos
    const mappedAcademic = academicEventsData.map(e => ({
      id: `acad-${e.id}`,
      title: e.title,
      description: `Materia: ${e.parallel.subject.name} (${e.type})`,
      date: e.date,
      type: e.type === 'EXAMEN' ? 'EXAMEN' : 'DEBER',
      color: e.type === 'EXAMEN' ? 'red' : 'orange'
    }));

    const mappedTutorings = myTutorings.map(b => {
      const t = b.tutoring;
      if (new Date(t.date) < startDate || new Date(t.date) > endDate) return null;
      return {
        id: `tut-${t.id}`,
        title: "Tutoría Reservada",
        description: t.subject ? t.subject.name : "Tutoría General",
        date: t.date,
        type: 'TUTORIA',
        color: 'purple'
      };
    }).filter(e => e !== null);

    const mappedPersonal = personalEvents.map(p => ({
      id: `pers-${p.id}`,
      title: p.title,
      description: p.description || "Personal",
      date: p.date,
      type: 'EXTRA',
      color: 'green'
    }));

    const finalAgenda = [...agenda, ...mappedAcademic, ...mappedTutorings, ...mappedPersonal];
    finalAgenda.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.send(finalAgenda);

  } catch (e) {
    console.error("Error student agenda:", e);
    res.status(500).send("ERROR_AGENDA");
  }
};

// 🟢 6. CREAR CURSO COMPLEMENTARIO (VALIDADO)
const createExternalCourse = async (req: RequestWithUser, res: Response) => {
  try {
    const studentId = req.user.id;
    const { name, startTime, endTime, days, startDate, endDate } = req.body;

    // 1. Validar fechas de inicio
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Comparamos solo fecha, sin hora

    // Ajuste zona horaria simple: sumamos 5 horas para compensar si viene en UTC 
    // (o usamos comparación de string YYYY-MM-DD para ser más seguros)
    const startString = startDate;
    const todayString = today.toISOString().split('T')[0];

    if (startString < todayString) {
      res.status(400).send("El curso no puede iniciar en una fecha pasada.");
      return;
    }

    if (end < start) {
      res.status(400).send("La fecha de fin no puede ser antes de la de inicio.");
      return;
    }

    // 2. Validar Horas
    if (startTime >= endTime) {
      res.status(400).send("La hora de fin debe ser después de la hora de inicio.");
      return;
    }

    const course = await prisma.externalCourse.create({
      data: {
        name,
        startTime,
        endTime,
        days: days.join(','),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        studentId
      }
    });
    res.send(course);
  } catch (e) {
    console.error(e);
    res.status(500).send("ERROR_CREATING_COURSE");
  }
};

export {
  getEvents,
  createEvent,
  deleteEvent,
  getMonthAgenda,
  createPersonalEvent,
  deletePersonalEvent,
  getStudentAgenda,
  createExternalCourse
};