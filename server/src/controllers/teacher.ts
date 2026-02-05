import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: { id: number };
}

// =====================================================================
// 1. TEACHER DASHBOARD
// =====================================================================

/**
 * Aggregates statistics for the Teacher Dashboard.
 * Includes Active Courses, Total Students, Risk Students (Low Avg), and Pending Grades.
 * Also generates a dynamic agenda combining today's classes and upcoming events.
 */
const getTeacherDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = parseInt(String(req.user?.id));
        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0=Sunday
        today.setHours(0, 0, 0, 0);

        // 1. GET ACTIVE PERIOD (CRITICAL FILTER)
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        // If no period is active, return empty dashboard
        if (!activePeriod) {
            return res.send({
                stats: { courses: 0, students: 0, pending: 0, risk: 0 },
                courseStats: [],
                nextEvents: []
            });
        }

        // 2. FETCH COURSES (Active Period Only)
        // Include schedules to build today's agenda
        const courses = await prisma.parallel.findMany({
            where: { 
                teacherId: teacherId,
                periodId: activePeriod.id // 🔥 GOLDEN FILTER
            },
            include: { 
                subject: true, 
                schedules: true, 
                _count: { select: { enrollments: true } } 
            }
        });

        const totalCourses = courses.length;

        // 3. CALCULATE STATISTICS
        const courseStats = await Promise.all(courses.map(async (c) => {
            const studentCount = await prisma.enrollment.count({
                where: { 
                    OR: [{ parallelId: c.id }, { subjectId: c.subjectId, parallelId: null }], 
                    status: 'TAKING' 
                }
            });
            
            // Calculate Average Grade for Course
            const grades = await prisma.activityGrade.findMany({
                where: { event: { parallelId: c.id }, score: { not: null } }, select: { score: true }
            });
            const sum = grades.reduce((acc, g) => acc + (g.score || 0), 0);
            const avg = grades.length > 0 ? (sum / grades.length) : 0;
            
            return { 
                id: c.id, 
                name: c.subject.name, 
                code: c.code, 
                students: studentCount, 
                average: parseFloat(avg.toFixed(2)) 
            };
        }));

        const totalStudents = courseStats.reduce((acc, c) => acc + c.students, 0);
        
        // Risk = Average grade below 14/20
        const riskCount = courseStats.filter(c => c.average > 0 && c.average < 14).length;
        
        // Pending Grades: Submissions that have no score yet
        const pendingGrades = await prisma.activityGrade.count({
            where: { 
                event: { parallel: { teacherId: teacherId, periodId: activePeriod.id } }, 
                submissionLink: { not: null }, 
                score: null 
            }
        });

        // 4. 🔥 DYNAMIC AGENDA (Classes Today + Upcoming Events)

        // A. Generate "Today's Classes" from schedule rules
        const todaysClasses = courses.flatMap(course => {
            return course.schedules
                .filter(s => s.dayOfWeek === currentDayOfWeek)
                .map(s => ({
                    id: `class-${course.id}-${s.id}`,
                    title: `Class: ${course.subject.name} (${course.code})`,
                    date: new Date().toISOString(),
                    time: `${s.startTime} - ${s.endTime}`,
                    type: "CLASE",
                    courseName: course.subject.name,
                    isTutoring: false,
                    isClass: true
                }));
        });

        // B. Academic Events (Exams/Homework)
        const academicEvents = await prisma.event.findMany({
            where: { 
                parallel: { teacherId: teacherId, periodId: activePeriod.id }, 
                date: { gte: today } 
            },
            include: { parallel: { include: { subject: true } } }
        });

        // C. Tutoring Sessions
        const tutoringEvents = await prisma.tutoring.findMany({
            where: { teacherId: teacherId, date: { gte: today } },
            include: { subject: true }
        });

        // D. Merge and Sort
        const mixedEvents = [
            ...todaysClasses,
            ...academicEvents.map(evt => ({
                id: evt.id,
                title: evt.title,
                date: evt.date,
                type: evt.type,
                courseName: evt.parallel.subject.name,
                isTutoring: false,
                isClass: false
            })),
            ...tutoringEvents.map(tut => ({
                id: tut.id,
                title: "Tutoring: " + (tut.notes || "General"),
                date: tut.date,
                type: "TUTORIA",
                courseName: tut.subject ? tut.subject.name : "All Subjects",
                isTutoring: true,
                isClass: false
            }))
        ].sort((a: any, b: any) => {
            if (a.isClass && !b.isClass) return -1; // Classes first
            if (!a.isClass && b.isClass) return 1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }).slice(0, 7);

        res.send({
            stats: { courses: totalCourses, students: totalStudents, pending: pendingGrades, risk: riskCount },
            courseStats,
            nextEvents: mixedEvents
        });

    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_DASHBOARD");
    }
};

// =====================================================================
// 2. TUTORING MANAGEMENT
// =====================================================================

/**
 * Creates a new Tutoring Session (Virtual or In-Person).
 */
const createTutoring = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = parseInt(String(req.user?.id));
        const { date, time, subjectId, capacity, notes, modality } = req.body;

        const dateTimeString = `${date}T${time}:00.000Z`;
        const finalSubjectId = (subjectId && subjectId !== "0" && subjectId !== 0) ? parseInt(subjectId) : null;

        const tutoring = await prisma.tutoring.create({
            data: {
                date: dateTimeString,
                capacity: parseInt(capacity),
                notes: notes,
                modality: modality || "PRESENCIAL", 
                teacherId: teacherId,
                subjectId: finalSubjectId
            }
        });
        res.send(tutoring);
    } catch (e) { res.status(500).send("ERROR_CREATING_TUTORING"); }
};

const getTutorings = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = parseInt(String(req.user?.id));
        const tutorings = await prisma.tutoring.findMany({
            where: { teacherId: teacherId },
            include: { subject: true, bookings: { include: { student: true } } },
            orderBy: { date: 'asc' }
        });
        const data = tutorings.map(t => ({
            id: t.id,
            date: t.date,
            capacity: t.capacity,
            booked: t.bookings.length,
            notes: t.notes,
            modality: t.modality, 
            subjectName: t.subject ? t.subject.name : "General",
            students: t.bookings.map(b => b.student.fullName)
        }));
        res.send(data);
    } catch (e) { res.status(500).send("ERROR_GETTING_TUTORINGS"); }
};

// =====================================================================
// 3. MY COURSES (Active Only)
// =====================================================================
const getTeacherCourses = async (req: RequestWithUser, res: Response) => {
    try {
        const teacherId = parseInt(String(req.user?.id));
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        if (!activePeriod) return res.send([]); 

        const courses = await prisma.parallel.findMany({
            where: { 
                teacherId: teacherId, 
                periodId: activePeriod.id 
            },
            include: { subject: true, schedules: true }, 
            orderBy: { subject: { name: 'asc' } }
        });

        const data = courses.map(c => ({
            ...c,
            name: c.subject.name,
            description: `Parallel ${c.code}`,
            scheduleInfo: c.schedules.length > 0 ? `${c.schedules[0].startTime} - ${c.schedules[0].endTime}` : "No Schedule"
        }));
        res.send(data);
    } catch (e) { res.status(500).send("ERROR_GETTING_COURSES"); }
};

// =====================================================================
// 4. COURSE DETAILS & GRADING
// =====================================================================
const getCourseGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.params;
        const idParseado = parseInt(String(courseId));
        if (isNaN(idParseado)) { return res.status(400).send("INVALID_ID"); }

        const parallel = await prisma.parallel.findUnique({
            where: { id: idParseado },
            include: { subject: true }
        });
        if (!parallel) { return res.status(404).send("COURSE_NOT_FOUND"); }
        res.send({ courseName: parallel.subject.name, parallelCode: parallel.code });
    } catch (e) { res.status(500).send("ERROR"); }
};

const getActivityGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const eventId = parseInt(String(activityId));
        if (isNaN(eventId)) { return res.status(400).send("INVALID_ID"); }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { parallel: { include: { subject: true } } }
        });
        if (!event) return res.status(404).send("Activity not found");

        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: event.parallelId }, { subjectId: event.parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        const grades = await prisma.activityGrade.findMany({ where: { eventId: eventId } });

        const students = enrollments.map(enr => {
            const grade = grades.find(g => g.studentId === enr.userId);
            return {
                studentId: enr.userId,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                gradeId: grade?.id || null,
                score: grade?.score ?? "",
                feedback: grade?.feedback || "",
                submissionLink: grade?.submissionLink || null,
                submittedAt: grade?.submittedAt || null
            };
        });

        res.send({
            activity: {
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.date,
                type: event.type
            },
            students
        });
    } catch (e) { res.status(500).send("ERROR_LOADING_ACTIVITY"); }
};

const saveActivityGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId } = req.params;
        const { studentId, score, feedback } = req.body;
        const eventId = parseInt(String(activityId));
        const sId = parseInt(String(studentId));
        const finalScore = (score === "" || score === null) ? null : parseFloat(score);

        const grade = await prisma.activityGrade.upsert({
            where: { studentId_eventId: { studentId: sId, eventId: eventId } },
            update: { score: finalScore, feedback: feedback },
            create: { studentId: sId, eventId: eventId, score: finalScore, feedback: feedback }
        });
        res.send(grade);
    } catch (e) { res.status(500).send("ERROR_SAVING_GRADE"); }
};

/**
 * Calculates the Grade Matrix for a Course.
 * Rows: Students, Cols: Weighted Categories (Individual, Group, Midterm, Final).
 */
const getCourseGradeMatrix = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.params;
        const parallelId = parseInt(String(courseId));
        if (isNaN(parallelId)) { return res.status(400).send("INVALID_ID"); }

        const parallel = await prisma.parallel.findUnique({ where: { id: parallelId } });
        if (!parallel) return res.status(404).send("Course not found");

        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: parallelId }, { subjectId: parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        const studentIds = enrollments.map(e => e.userId);
        const events = await prisma.event.findMany({ where: { parallelId: parallelId } });
        const allGrades = await prisma.activityGrade.findMany({ where: { studentId: { in: studentIds } } });
        const allAttendance = await prisma.attendance.findMany({ where: { enrollmentId: { in: enrollments.map(e => e.id) } } });

        const WEIGHTS: any = { 'INDIVIDUAL': 7, 'GRUPAL': 5, 'MEDIO': 2, 'FINAL': 6 };

        const matrix = enrollments.map(enr => {
            const studentId = enr.userId;
            const acc: any = { 'INDIVIDUAL': { sum: 0, count: 0 }, 'GRUPAL': { sum: 0, count: 0 }, 'MEDIO': { sum: 0, count: 0 }, 'FINAL': { sum: 0, count: 0 } };

            events.forEach((evt) => {
                const typeKey = evt.type ? evt.type.toUpperCase() : 'INDIVIDUAL';
                const grade = allGrades.find(g => g.eventId === evt.id && g.studentId === studentId);
                if (grade && grade.score != null) {
                    acc[typeKey].sum += Number(grade.score);
                    acc[typeKey].count += 1;
                }
            });

            let finalTotal = 0;
            const breakdown: any = {};
            Object.keys(WEIGHTS).forEach(key => {
                const data = acc[key];
                let weighted = 0;
                if (data.count > 0) weighted = (data.sum / data.count / 20) * WEIGHTS[key];
                breakdown[key] = parseFloat(weighted.toFixed(2));
                finalTotal += weighted;
            });

            // Attendance Calculation
            const studentAtt = allAttendance.filter(a => a.enrollmentId === enr.id);
            let totalPoints = 0;
            let maxPoints = studentAtt.length * 2;
            studentAtt.forEach(att => {
                if (att.status === 'PRESENT' || att.status === 'EXCUSED') totalPoints += 2;
                else if (att.status === 'LATE') totalPoints += 1;
            });
            let attendancePct = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 100;

            return {
                studentId,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                breakdown,
                finalTotal: parseFloat(finalTotal.toFixed(2)),
                attendancePct: parseFloat(attendancePct.toFixed(2))
            };
        });

        const courseSum = matrix.reduce((acc, curr) => acc + curr.finalTotal, 0);
        const courseAverage = matrix.length > 0 ? (courseSum / matrix.length) : 0;

        res.send({ students: matrix, courseAverage: parseFloat(courseAverage.toFixed(2)) });
    } catch (e) { res.status(500).send("ERROR_GETTING_GRADE_MATRIX"); }
};

// =====================================================================
// 5. ATTENDANCE & DROPPING STUDENTS
// =====================================================================
const getDailyAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.query;
        const dateStr = String(req.query.date);
        const parallelId = parseInt(String(courseId));
        if (!courseId || !dateStr) { return res.status(400).send("Missing data"); }

        const parallel = await prisma.parallel.findUnique({ where: { id: parallelId } });
        if (!parallel) { return res.status(404).send("Parallel not found"); }

        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [{ parallelId: parallelId }, { subjectId: parallel.subjectId, parallelId: null }],
                status: 'TAKING'
            },
            include: { user: true },
            orderBy: { user: { fullName: 'asc' } }
        });

        const startDate = new Date(dateStr);
        const endDate = new Date(dateStr);
        endDate.setDate(endDate.getDate() + 1);

        const attendances = await prisma.attendance.findMany({
            where: { date: { gte: startDate, lt: endDate }, enrollmentId: { in: enrollments.map(e => e.id) } }
        });

        const result = enrollments.map(enr => {
            const att = attendances.find(a => a.enrollmentId === enr.id);
            return {
                enrollmentId: enr.id,
                studentId: enr.user.id,
                fullName: enr.user.fullName,
                avatar: `https://ui-avatars.com/api/?name=${enr.user.fullName}&background=random`,
                status: att ? att.status : 'PRESENT'
            };
        });
        res.send(result);
    } catch (e) { res.status(500).send("ERROR"); }
};

const saveDailyAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { date, records } = req.body;
        const today = new Date();
        const selectedDate = new Date(date);
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) { return res.status(400).send("Cannot save attendance for future dates."); }

        const dateObj = new Date(`${date}T12:00:00.000Z`);
        await Promise.all(records.map((r: any) => {
            return prisma.attendance.upsert({
                where: { date_enrollmentId: { enrollmentId: r.enrollmentId, date: dateObj } },
                update: { status: r.status },
                create: { enrollmentId: r.enrollmentId, date: dateObj, status: r.status }
            });
        }));
        res.send({ message: "Saved successfully" });
    } catch (e) { res.status(500).send("ERROR_SAVING_ATTENDANCE"); }
};

const updateStudentGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { enrollmentId, grade } = req.body;
        const updated = await prisma.enrollment.update({
            where: { id: parseInt(String(enrollmentId)) },
            data: { finalGrade: parseFloat(grade) }
        });
        res.send(updated);
    } catch (e) { res.status(500).send("ERROR_UPDATING_GRADE"); }
};

// 🟢 4. REMOVE STUDENT (SAFE DELETE)
const removeStudent = async (req: Request, res: Response) => {
    try {
        const { subjectId, studentId } = req.body;
        if (!subjectId || !studentId) return res.status(400).json({ error: "Missing data" });

        const pId = parseInt(String(subjectId));
        const sId = parseInt(String(studentId));

        if (isNaN(pId) || isNaN(sId)) return res.status(400).json({ error: "Invalid IDs" });

        const parallel = await prisma.parallel.findUnique({
            where: { id: pId },
            select: { subjectId: true }
        });

        if (!parallel) return res.status(404).json({ error: "Course not found." });

        const deleted = await prisma.enrollment.deleteMany({
            where: {
                userId: sId,
                OR: [
                    { parallelId: pId },
                    { subjectId: parallel.subjectId, parallelId: null }
                ]
            }
        });

        if (deleted.count === 0) return res.status(404).json({ error: "Student not found in this course." });

        res.json({ message: "Student removed successfully." });
    } catch (error) { res.status(500).json({ error: "Internal error removing student." }); }
};

export {
    getTeacherDashboard,
    createTutoring,
    getTutorings,
    getTeacherCourses,
    getCourseGrades,
    getActivityGrades,
    saveActivityGrade,
    getCourseGradeMatrix,
    getDailyAttendance,
    saveDailyAttendance,
    updateStudentGrade,
    removeStudent
};