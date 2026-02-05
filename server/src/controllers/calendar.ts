import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended Request interface to include user info from middleware
interface RequestWithUser extends Request {
    user?: { id: number };
}

// ==============================================================================
// 🟢 SECTION 1: COMMON (SHARED ACROSS ROLES)
// ==============================================================================

/**
 * Creates a personal extracurricular event for any user.
 * Validates that the event is not scheduled in the past.
 */
const createPersonalEvent = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).send("Unauthorized");

        const { title, description, date, time } = req.body;

        // 1. Construct Date with Timezone (UTC-5 Ecuador)
        // We append the timezone offset to ensure consistency between server/client
        const dateTime = new Date(`${date}T${time}:00.000-05:00`);
        const now = new Date();

        // 2. Validate Past Dates (Allow 1 minute grace period for latency)
        if (dateTime.getTime() < (now.getTime() - 60000)) {
            res.status(400).send("You cannot create events in the past.");
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
        res.status(500).send("ERROR_CREATING_PERSONAL_EVENT");
    }
};

/**
 * Deletes a personal event by ID.
 */
const deletePersonalEvent = async (req: RequestWithUser, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.personalEvent.delete({ where: { id: parseInt(String(id)) } });
        res.send({ success: true });
    } catch (e) {
        res.status(500).send("ERROR_DELETING_PERSONAL_EVENT");
    }
};

// ==============================================================================
// 🟢 SECTION 2: TEACHER (COURSE MANAGEMENT & AGENDA)
// ==============================================================================

/**
 * Retrieves all events associated with a specific course (Parallel).
 */
const getEvents = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.query;
        
        if (!courseId || courseId === 'undefined') {
            return res.send([]);
        }

        const pId = parseInt(String(courseId));
        if (isNaN(pId)) return res.send([]);

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
        console.error("Error fetching course events:", e);
        res.send([]);
    }
};

/**
 * Creates an academic event (Exam, Assignment, etc.) for a course.
 */
const createEvent = async (req: RequestWithUser, res: Response) => {
    try {
        const { title, date, time, type, parallelId, description } = req.body;

        if (!title || !date || !parallelId) {
            return res.status(400).send("Missing required fields");
        }

        const timeString = time || "07:00";
        // Manual UTC-5 Construction
        const finalDate = new Date(`${date}T${timeString}:00.000-05:00`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (finalDate < today) {
            return res.status(400).send("You cannot create academic events in the past.");
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
        console.error("Error creating event:", e);
        res.status(500).send("ERROR_CREATING_EVENT");
    }
};

/**
 * Deletes an academic event.
 */
const deleteEvent = async (req: RequestWithUser, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id: parseInt(String(id)) } });
        res.send({ message: "Event deleted successfully" });
    } catch (e) {
        console.error("Error deleting event:", e);
        res.status(500).send("ERROR_DELETING_EVENT");
    }
};

/**
 * Generates the Monthly Agenda for a Teacher.
 * Aggregates:
 * 1. Academic Events (Exams/Assignments)
 * 2. Tutoring Sessions
 * 3. Personal Events
 * 4. Recurring Class Schedules (Calculated loop)
 */
const getMonthAgenda = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = parseInt(String(req.user?.id));
        const { month, year } = req.query;

        const targetMonth = parseInt(String(month));
        const targetYear = parseInt(String(year));

        // Define month boundaries
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        // 1. GET ACTIVE PERIOD (Critical Filter)
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        if (!activePeriod) return res.send([]); // Empty agenda if no active semester

        // 2. Fetch Academic Events (Only for active period courses)
        const academicEvents = await prisma.event.findMany({
            where: {
                parallel: { 
                    teacherId: teacherId,
                    periodId: activePeriod.id // 🔥 FILTER
                },
                date: { gte: startDate, lte: endDate }
            },
            include: { parallel: { include: { subject: true } } }
        });

        // 3. Fetch Tutorings
        const tutorings = await prisma.tutoring.findMany({
            where: {
                teacherId: teacherId,
                date: { gte: startDate, lte: endDate }
            },
            include: { subject: true }
        });

        // 4. Fetch Personal Events
        const personalEvents = await prisma.personalEvent.findMany({
            where: {
                userId: teacherId,
                date: { gte: startDate, lte: endDate }
            }
        });

        // 5. Fetch Recurring Class Schedules (Only for active period)
        const schedules = await prisma.schedule.findMany({
            where: { 
                parallel: { 
                    teacherId: teacherId,
                    periodId: activePeriod.id // 🔥 FILTER
                } 
            },
            include: { parallel: { include: { subject: true } } }
        });

        // 

        // --- GENERATE RECURRING EVENTS ---
        const classEvents: any[] = [];
        let loopDate = new Date(startDate);

        while (loopDate <= endDate) {
            const dayOfWeek = loopDate.getDay();
            // Filter schedules that match the current day of the loop
            const dailyClasses = schedules.filter(s => s.dayOfWeek === dayOfWeek);

            dailyClasses.forEach(sched => {
                const classDate = new Date(loopDate);
                const [hours, minutes] = sched.startTime.split(':');
                classDate.setHours(parseInt(hours), parseInt(minutes));

                classEvents.push({
                    id: `class-${sched.id}-${loopDate.getDate()}`,
                    title: sched.parallel.subject.name,
                    description: `Class Parallel ${sched.parallel.code}`,
                    date: classDate,
                    type: 'CLASE', // Frontend key
                    color: 'blue'
                });
            });
            // Advance one day
            loopDate.setDate(loopDate.getDate() + 1);
        }

        // --- MERGE ALL EVENTS ---
        const agenda = [
            ...classEvents,
            ...academicEvents.map(e => ({
                id: `acad-${e.id}`,
                title: e.title,
                description: `Activity: ${e.type}`,
                date: e.date,
                type: 'ACADEMICO',
                color: 'orange'
            })),
            ...tutorings.map(t => ({
                id: `tut-${t.id}`,
                title: "Tutoring Session",
                description: t.subject ? t.subject.name : "General Tutoring",
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

        // Sort chronologically
        agenda.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        res.send(agenda);

    } catch (e) {
        console.error("Error generating teacher agenda:", e);
        res.status(500).send("ERROR_GENERATING_AGENDA");
    }
};

// ==============================================================================
// 🟢 SECTION 3: STUDENT (COMPLETE AGGREGATED AGENDA)
// ==============================================================================

/**
 * Generates the comprehensive Monthly Agenda for a Student.
 * Complexity: High (Merges 5 data sources).
 */
const getStudentAgenda = async (req: RequestWithUser, res: Response) => {
    try {
        const studentId = parseInt(String(req.user?.id));
        const { month, year } = req.query;

        const targetMonth = parseInt(String(month));
        const targetYear = parseInt(String(year));

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        // 1. GET ACTIVE PERIOD
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        if (!activePeriod) return res.send([]); 

        // 2. FETCH ENROLLMENTS (My Classes)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: studentId,
                status: { in: ['TAKING', 'PENDING'] },
                parallel: { periodId: activePeriod.id } // 🔥 Ensure we only get current period classes
            },
            include: {
                parallel: { include: { subject: true, schedules: true } },
                subject: {
                    // Fallback: If no parallel is assigned yet, look for any parallel in active period
                    include: {
                        parallels: { 
                            where: { periodId: activePeriod.id }, 
                            include: { schedules: true } 
                        }
                    }
                }
            }
        });

        // 3. FETCH ACADEMIC ACTIVITIES (Homework/Exams)
        const validParallelIds: number[] = [];

        enrollments.forEach((enr: any) => {
            if (enr.parallelId) {
                validParallelIds.push(enr.parallelId);
            } else if (enr.subject && enr.subject.parallels.length > 0) {
                // If enrolled in subject but no parallel, consider all parallels for events (fallback)
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

        // 4. FETCH TUTORING BOOKINGS
        const myTutorings = await prisma.tutoringBooking.findMany({
            where: { studentId: studentId },
            include: { tutoring: { include: { subject: true } } }
        });

        // 5. FETCH PERSONAL EVENTS
        const personalEvents = await prisma.personalEvent.findMany({
            where: { userId: studentId, date: { gte: startDate, lte: endDate } }
        });

        // 6. FETCH EXTERNAL COURSES (Complementary)
        const externalCourses = await prisma.externalCourse.findMany({
            where: { studentId: studentId }
        });

        const agenda: any[] = [];

        // --- A. GENERATE RECURRING EVENTS (CLASSES + EXTERNAL) ---
        let loopDate = new Date(startDate);
        
        while (loopDate <= endDate) {
            const dayOfWeek = loopDate.getDay(); // 0=Sunday...

            // A1. ACADEMIC CLASSES LOGIC
            enrollments.forEach((enr: any) => {
                let schedulesToUse: any[] = [];
                let subjectName = enr.subject.name;

                // Case 1: Has official parallel
                if (enr.parallel && enr.parallel.schedules) {
                    schedulesToUse = enr.parallel.schedules;
                }
                // Case 2: No parallel assigned (NULL), use the first one available as placeholder
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
                                description: `Room: ${sch.classroom || 'General'}`,
                                date: d,
                                type: 'CLASE',
                                color: 'blue'
                            });
                        }
                    });
                }
            });

            // A2. EXTERNAL COURSES LOGIC
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
                            description: `Complementary Course (${ext.startTime} - ${ext.endTime})`,
                            date: d,
                            type: 'COMPLEMENTARIO',
                            color: 'teal'
                        });
                    }
                }
            });

            loopDate.setDate(loopDate.getDate() + 1);
        }

        // --- B. MAP SINGLE EVENTS ---
        const mappedAcademic = academicEventsData.map(e => ({
            id: `acad-${e.id}`,
            title: e.title,
            description: `Subject: ${e.parallel.subject.name} (${e.type})`,
            date: e.date,
            type: e.type === 'EXAMEN' ? 'EXAMEN' : 'DEBER', // Maps to frontend keys
            color: e.type === 'EXAMEN' ? 'red' : 'orange'
        }));

        const mappedTutorings = myTutorings.map(b => {
            const t = b.tutoring;
            // Manual date check just in case query range missed edge cases
            if (new Date(t.date) < startDate || new Date(t.date) > endDate) return null;
            return {
                id: `tut-${t.id}`,
                title: "Reserved Tutoring",
                description: t.subject ? t.subject.name : "General Tutoring",
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
        console.error("Error generating student agenda:", e);
        res.status(500).send("ERROR_GENERATING_AGENDA");
    }
};

// 🟢 6. CREATE EXTERNAL COURSE (VALIDATED)
const createExternalCourse = async (req: RequestWithUser, res: Response) => {
    try {
        const studentId = parseInt(String(req.user?.id));
        const { name, startTime, endTime, days, startDate, endDate } = req.body;

        // 1. Validate Date Ranges
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        const startString = startDate;
        const todayString = today.toISOString().split('T')[0];

        if (startString < todayString) {
            return res.status(400).send("Course cannot start in the past.");
        }

        if (end < start) {
            return res.status(400).send("End date cannot be before start date.");
        }

        // 2. Validate Time Ranges
        if (startTime >= endTime) {
            return res.status(400).send("End time must be after start time.");
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
        res.status(500).send("ERROR_CREATING_EXTERNAL_COURSE");
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