import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended Request interface to include authenticated user data
interface RequestWithUser extends Request {
    user?: { id: number };
}

// =====================================================================
// 1. GENERAL STATISTICS (DASHBOARD HEADER)
// =====================================================================

/**
 * Calculates high-level statistics for the student.
 * - GPA (Average of approved subjects)
 * - Progress percentage (Approved subjects / Total career subjects)
 * - Current Semester Level
 * - Active Courses Count (Filtered by Active Period)
 */
const getStudentStats = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));

        // Find active period to filter current courses
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                career: { include: { subjects: true } },
                enrollments: { include: { subject: true, parallel: true } }
            }
        });

        if (!user || !user.career) {
            return res.status(404).send("USER_OR_CAREER_NOT_FOUND");
        }

        const approvedSubjects = user.enrollments.filter(e => e.status === 'APPROVED');

        // 🔥 FILTER: Only count courses currently being taken in the ACTIVE period
        const takingSubjects = user.enrollments.filter(e =>
            ['TAKING', 'PENDING'].includes(e.status) &&
            (activePeriod ? e.parallel?.periodId === activePeriod.id : true)
        );

        let average = 0;
        if (approvedSubjects.length > 0) {
            const sumGrades = approvedSubjects.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);
            average = parseFloat((sumGrades / approvedSubjects.length).toFixed(2));
        }

        const totalSubjects = user.career.subjects.length;
        const progressPercentage = totalSubjects > 0
            ? Math.round((approvedSubjects.length / totalSubjects) * 100)
            : 0;

        let currentSemester = 1;
        if (takingSubjects.length > 0) {
            const levels = takingSubjects.map(t => t.subject.semesterLevel);
            currentSemester = levels.length > 0 ? Math.max(...levels) : 1;
        }

        res.send({
            fullName: user.fullName,
            careerName: user.career.name,
            stats: {
                average,
                approvedCount: approvedSubjects.length,
                totalSubjects,
                progress: progressPercentage,
                takingCount: takingSubjects.length,
                currentSemester
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_STATS");
    }
};

/**
 * 🟢 NEW: REGISTER HISTORICAL GRADES
 * Allows students to manually input past grades (e.g., "I passed Math I with 18").
 * Updates the academic history without assigning a parallel.
 */
const registerHistoricalGrades = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));
        const { grades } = req.body; // Array of { subjectId, grade }

        if (!Array.isArray(grades)) return res.status(400).json({ error: "Invalid format" });

        // Process each grade in a transaction
        await prisma.$transaction(
            grades.map((item: any) => {
                const finalGrade = parseFloat(item.grade);
                // Passing logic: Grade >= 14 is APPROVED
                const status = finalGrade >= 14 ? 'APPROVED' : 'FAILED';

                return prisma.enrollment.upsert({
                    where: {
                        userId_subjectId: {
                            userId: userId,
                            subjectId: parseInt(item.subjectId)
                        }
                    },
                    update: {
                        finalGrade: finalGrade,
                        status: status,
                        parallelId: null // Historical record, no current parallel
                    },
                    create: {
                        userId: userId,
                        subjectId: parseInt(item.subjectId),
                        finalGrade: finalGrade,
                        status: status,
                        parallelId: null
                    }
                });
            })
        );

        res.json({ message: "Academic history updated." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error saving history." });
    }
};

// =====================================================================
// 2. MAIN STUDENT DASHBOARD
// =====================================================================

/**
 * Aggregates all data needed for the Student Dashboard Home.
 * - Active Enrollments
 * - Upcoming Tasks/Exams
 * - Today's Schedule
 * - Historical Average
 */
const getStudentDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const studentId = parseInt(String(req.user?.id));
        const now = new Date();

        // 1. GET ACTIVE PERIOD
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        // If no active period, return empty state to avoid showing stale data
        if (!activePeriod) {
            return res.send({
                stats: { average: 0, pendingCount: 0, activeCourses: 0 },
                pendingTasks: [], todayClasses: [], courses: []
            });
        }

        // 2. GET ENROLLMENTS (Active Period Only)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: studentId,
                status: { in: ['TAKING', 'PENDING'] },
                parallel: {
                    periodId: activePeriod.id // 🔥 CRITICAL FILTER
                }
            },
            include: {
                parallel: {
                    include: {
                        subject: true,
                        schedules: true,
                        events: { where: { type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] } } }
                    }
                },
                subject: {
                    include: {
                        parallels: {
                            where: { periodId: activePeriod.id },
                            include: {
                                events: { where: { type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] } } },
                                schedules: true
                            }
                        }
                    }
                }
            }
        });

        // 3. GLOBAL AVERAGE (Historical)
        const finishedEnrollments = await prisma.enrollment.findMany({
            where: {
                userId: studentId,
                finalGrade: { not: null },
                status: { notIn: ['TAKING', 'PENDING'] }
            },
            select: { finalGrade: true }
        });

        const sumGrades = finishedEnrollments.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);
        const globalAverage = finishedEnrollments.length > 0
            ? (sumGrades / finishedEnrollments.length)
            : 0;

        // 4. PENDING TASKS (Upcoming 60 days)
        const startFilter = new Date(now);
        startFilter.setDate(startFilter.getDate() - 1);
        const endFilter = new Date(now);
        endFilter.setDate(endFilter.getDate() + 60);

        const parallelIds = enrollments.map(e => e.parallelId).filter(id => id !== null) as number[];

        const upcomingEvents = await prisma.event.findMany({
            where: {
                parallelId: { in: parallelIds },
                date: { gte: startFilter, lte: endFilter },
                type: { in: ['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'] }
            },
            include: {
                parallel: { include: { subject: true } }
            },
            orderBy: { date: 'asc' }
        });

        // Check which tasks are already submitted
        const myGrades = await prisma.activityGrade.findMany({
            where: {
                studentId: studentId,
                eventId: { in: upcomingEvents.map(e => e.id) }
            }
        });

        const pendingTasks = upcomingEvents.filter(evt => {
            const submission = myGrades.find(g => g.eventId === evt.id);
            return !submission || !submission.submissionLink;
        }).map(evt => {
            const evtDate = new Date(evt.date);
            const diffTime = evtDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                id: evt.id,
                title: evt.title,
                subject: evt.parallel.subject.name,
                date: evt.date,
                type: evt.type,
                daysLeft: daysLeft,
                parallelId: evt.parallelId
            };
        });

        // 5. TODAY'S CLASSES
        const dayOfWeek = now.getDay();
        const todayClasses: any[] = [];

        enrollments.forEach((enr: any) => {
            let schedules: any[] = [];
            let subjectName = "";

            if (enr.parallel) {
                schedules = enr.parallel.schedules || [];
                subjectName = enr.parallel.subject.name;
            }

            if (Array.isArray(schedules)) {
                const todaySchedule = schedules.find((s: any) => s.dayOfWeek === dayOfWeek);
                if (todaySchedule) {
                    todayClasses.push({
                        id: enr.id,
                        subject: subjectName,
                        time: `${todaySchedule.startTime} - ${todaySchedule.endTime}`,
                        classroom: 'General'
                    });
                }
            }
        });

        todayClasses.sort((a, b) => a.time.localeCompare(b.time));

        // 6. COURSES SUMMARY CARDS
        const coursesData = await Promise.all(enrollments.map(async (enr: any) => {
            let totalActivities = 0;
            let currentParallelId = enr.parallelId;

            if (enr.parallel) {
                totalActivities = enr.parallel.events?.length || 0;
            }

            const submittedCount = await prisma.activityGrade.count({
                where: {
                    studentId: studentId,
                    event: { parallelId: currentParallelId },
                    submissionLink: { not: null }
                }
            });

            const progress = totalActivities > 0 ? Math.round((submittedCount / totalActivities) * 100) : 0;

            return {
                id: currentParallelId,
                name: enr.parallel?.subject?.name || "No Name",
                code: enr.parallel?.code || 'A',
                teacher: "Main Teacher",
                progress: progress,
                average: enr.finalGrade || 0
            };
        }));

        res.send({
            stats: {
                average: parseFloat(globalAverage.toFixed(2)),
                pendingCount: pendingTasks.length,
                activeCourses: enrollments.length
            },
            pendingTasks,
            todayClasses,
            courses: coursesData
        });

    } catch (e) {
        console.error("Error student dashboard:", e);
        res.status(500).send("ERROR_DASHBOARD");
    }
};

// =====================================================================
// 3. WEEKLY SCHEDULE
// =====================================================================
const getWeeklySchedule = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        if (!activePeriod) return res.send([]);

        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                status: { in: ['TAKING', 'PENDING'] },
                parallel: { periodId: activePeriod.id } // 🔥 FILTER
            },
            include: {
                subject: true,
                parallel: { include: { schedules: true } }
            }
        });

        let scheduleEvents: any[] = [];
        enrollments.forEach((enrollment) => {
            if (enrollment.parallel && enrollment.parallel.schedules) {
                enrollment.parallel.schedules.forEach((sched: any) => {
                    scheduleEvents.push({
                        id: sched.id,
                        subjectName: enrollment.subject.name,
                        dayOfWeek: sched.dayOfWeek,
                        startTime: sched.startTime,
                        endTime: sched.endTime,
                        classroom: 'Room 101'
                    });
                });
            }
        });
        res.send(scheduleEvents);
    } catch (e) {
        console.log(e);
        res.status(500).send("ERROR_GETTING_SCHEDULE");
    }
};

// =====================================================================
// 4. MY COURSES (FULL LIST)
// =====================================================================
const getMyCourses = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        if (!activePeriod) return res.send([]);

        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: userId,
                status: { in: ['TAKING', 'PENDING'] },
                parallel: { periodId: activePeriod.id }
            },
            include: { subject: true, parallel: true }
        });

        const courses = enrollments.map((e) => {
            return {
                courseId: e.parallelId, // Link ID
                subjectName: e.subject.name,
                code: e.parallel?.code || "A",
                level: e.subject.semesterLevel,
                progress: 0
            };
        });

        res.send(courses);

    } catch (e) {
        console.log(e);
        res.status(500).send("ERROR_GET_COURSES");
    }
};

// =====================================================================
// 5. COURSE DETAIL (GRADES & AGENDA)
// =====================================================================
const getStudentCourseDetails = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));
        const { courseId } = req.params;
        const parallelId = parseInt(String(courseId || '0'));

        if (isNaN(parallelId) || parallelId === 0) { return res.status(400).send("INVALID_ID"); }

        const parallel = await prisma.parallel.findUnique({
            where: { id: parallelId },
            include: {
                subject: true,
                events: { orderBy: { date: 'desc' } }
            }
        });

        if (!parallel) { return res.status(404).send("COURSE_NOT_FOUND"); }

        const myGrades = await prisma.activityGrade.findMany({ where: { studentId: userId } });

        // Map events with student's submissions
        const activitiesList = parallel.events.map(evt => {
            const submissionObj: any = myGrades.find((g: any) => g.eventId === evt.id);
            return {
                id: evt.id,
                name: evt.title,
                type: evt.type,
                description: evt.description,
                limitDate: evt.date,
                myScore: submissionObj ? submissionObj.score : null,
                submissionLink: submissionObj?.submissionLink || null,
                submittedAt: submissionObj?.submittedAt || null,
                feedback: submissionObj?.feedback || null
            };
        });

        // Calculate Weighted Score Breakdown
        const accumulator: any = {
            'INDIVIDUAL': { sum: 0, count: 0, weight: 7, label: "Individual Work" },
            'GRUPAL': { sum: 0, count: 0, weight: 5, label: "Group Work" },
            'MEDIO': { sum: 0, count: 0, weight: 2, label: "Midterm Exam" },
            'FINAL': { sum: 0, count: 0, weight: 6, label: "Final Exam" }
        };

        parallel.events.forEach(evt => {
            const grade = myGrades.find((g: any) => g.eventId === evt.id);
            if (grade && grade.score !== null && accumulator[evt.type]) {
                accumulator[evt.type].sum += grade.score;
                accumulator[evt.type].count += 1;
            }
        });

        let finalTotal = 0;
        const scoreSummary = Object.keys(accumulator).map(key => {
            const data = accumulator[key];
            let average = 0;
            let weightedScore = 0;
            if (data.count > 0) {
                average = parseFloat((data.sum / data.count).toFixed(2));
                weightedScore = (average * data.weight) / 20;
            }
            finalTotal += weightedScore;
            return {
                category: key,
                label: data.label,
                weight: data.weight,
                average: average,
                weightedScore: parseFloat(weightedScore.toFixed(2))
            };
        });

        // Calculate Attendance
        const enrollment = await prisma.enrollment.findFirst({ where: { userId, parallelId: parallel.id } });
        let attendance: any[] = [];
        let attendancePct = 100;

        if (enrollment) {
            attendance = await prisma.attendance.findMany({
                where: { enrollmentId: enrollment.id },
                orderBy: { date: 'desc' }
            });

            let totalPoints = 0;
            let maxPoints = attendance.length * 2;

            attendance.forEach(att => {
                if (att.status === 'PRESENT' || att.status === 'EXCUSED') totalPoints += 2;
                else if (att.status === 'LATE') totalPoints += 1;
            });

            if (maxPoints > 0) {
                attendancePct = (totalPoints / maxPoints) * 100;
            }
        }

        res.send({
            subjectName: parallel.subject.name,
            parallelCode: parallel.code,
            activities: activitiesList,
            scoreSummary: scoreSummary,
            finalTotal: parseFloat(finalTotal.toFixed(2)),
            agenda: parallel.events,
            attendance: attendance,
            attendancePct: parseFloat(attendancePct.toFixed(2))
        });

    } catch (e) { console.log(e); res.status(500).send("ERROR"); }
};

// =====================================================================
// 6. SUBMIT ACTIVITY (HOMEWORK)
// =====================================================================
const submitActivity = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));
        const { activityId, link } = req.body;

        if (!link) { return res.status(400).send("LINK_REQUIRED"); }

        const eventIdInt = parseInt(activityId);
        
        // Use composite key for Upsert
        const whereClause: any = { studentId_eventId: { studentId: userId, eventId: eventIdInt } };
        const createData: any = { studentId: userId, eventId: eventIdInt, submissionLink: link };
        const updateData: any = { submissionLink: link };

        const submission = await prisma.activityGrade.upsert({
            where: whereClause,
            update: updateData,
            create: createData
        });

        res.send(submission);

    } catch (e: any) {
        console.error("ERROR SUBMITTING ACTIVITY:", e);
        res.status(500).send("ERROR_SUBMITTING_ACTIVITY");
    }
};

// =====================================================================
// 7. TUTORING BOOKING
// =====================================================================

/**
 * Retrieves available tutoring sessions.
 * Filters: General sessions OR sessions for subjects the student is CURRENTLY taking.
 */
const getAvailableTutorings = async (req: RequestWithUser, res: Response) => {
    try {
        const studentId = parseInt(String(req.user?.id));
        const now = new Date();

        // 1. Get IDs of currently active subjects
        const myEnrollments = await prisma.enrollment.findMany({
            where: { userId: studentId, status: 'TAKING' },
            select: { subjectId: true }
        });

        const mySubjectIds = myEnrollments.map(e => e.subjectId);

        // 2. Find Tutorings
        const tutorings = await prisma.tutoring.findMany({
            where: {
                date: { gte: now },
                OR: [
                    { subjectId: null }, // General Tutorings
                    { subjectId: { in: mySubjectIds } } // 🔥 Only my subjects
                ]
            },
            include: {
                subject: true,
                teacher: { select: { fullName: true } },
                bookings: true
            },
            orderBy: { date: 'asc' }
        });

        // Map response
        const available = tutorings.map(t => {
            const bookedCount = t.bookings.length;
            const isBookedByMe = t.bookings.some(b => b.studentId === studentId);
            const remaining = t.capacity - bookedCount;

            return {
                id: t.id,
                date: t.date,
                teacherName: t.teacher.fullName,
                subjectName: t.subject ? t.subject.name : "General / Various",
                modality: t.modality,
                notes: t.notes,
                capacity: t.capacity,
                booked: bookedCount,
                remaining: remaining,
                isBooked: isBookedByMe,
                isFull: remaining <= 0
            };
        });

        res.send(available);

    } catch (e) {
        console.error("Error getting tutorings:", e);
        res.status(500).send("ERROR_GETTING_TUTORINGS");
    }
};

const bookTutoring = async (req: RequestWithUser, res: Response) => {
    try {
        const studentId = parseInt(String(req.user?.id));
        const { tutoringId } = req.body;
        const tId = parseInt(tutoringId);

        const tutoring = await prisma.tutoring.findUnique({
            where: { id: tId },
            include: { bookings: true }
        });

        if (!tutoring) return res.status(404).send("Tutoring not found");
        if (tutoring.bookings.length >= tutoring.capacity) return res.status(400).send("Sorry! No spots left.");

        const alreadyBooked = tutoring.bookings.some(b => b.studentId === studentId);
        if (alreadyBooked) return res.status(400).send("You are already booked for this session.");

        await prisma.tutoringBooking.create({
            data: { tutoringId: tId, studentId: studentId }
        });

        res.send({ success: true, message: "Booking successful" });

    } catch (e) {
        console.error("Error booking tutoring:", e);
        res.status(500).send("ERROR_BOOKING");
    }
};

// =====================================================================
// 8. COURSE CATALOG & ENROLLMENT (NEW FUNCTIONS)
// =====================================================================

// GET CATALOG FILTERS
const getCatalogFilters = async (req: Request, res: Response) => {
    try {
        const careers = await prisma.career.findMany({
            select: { id: true, name: true, totalSemesters: true }
        });
        res.json({ careers });
    } catch (error) {
        res.status(500).json({ error: "Error loading filters" });
    }
};

// GET OPEN COURSES (FILTERED)
const getOpenCourses = async (req: Request, res: Response) => {
    try {
        const { id } = (req as any).user;
        const { careerId, semester } = req.query;

        if (!careerId || !semester) {
            return res.status(400).json({ error: "Missing filters" });
        }

        const activePeriod = await prisma.academicPeriod.findFirst({
            where: { isActive: true }
        });

        if (!activePeriod) {
            return res.json([]);
        }

        const parallels = await prisma.parallel.findMany({
            where: {
                periodId: activePeriod.id,
                subject: {
                    careerId: parseInt(String(careerId)),
                    semesterLevel: parseInt(String(semester))
                }
            },
            include: {
                subject: true,
                teacher: true,
                _count: { select: { enrollments: true } }
            }
        });

        const myEnrollments = await prisma.enrollment.findMany({
            where: { userId: parseInt(String(id)), status: { not: 'FAILED' } },
            select: { subjectId: true, parallelId: true }
        });

        const mySubjectIds = myEnrollments.map(e => e.subjectId);
        const myParallelIds = myEnrollments.map(e => e.parallelId);

        const data = parallels.map(p => ({
            id: p.id,
            subjectId: p.subjectId,
            name: p.subject.name,
            code: p.code,
            teacher: p.teacher ? p.teacher.fullName : "Unassigned",
            credits: 4,
            semester: p.subject.semesterLevel,
            capacity: p.capacity,
            enrolledCount: p._count.enrollments,
            isFull: p._count.enrollments >= p.capacity,
            isEnrolled: mySubjectIds.includes(p.subjectId) && myParallelIds.includes(p.id)
        }));

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching open courses" });
    }
};

// 🟢 4. GET FULL CATALOG (MESH + HISTORY)
const getAllCourses = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(String((req as any).user.id));

        // 1. Get user career
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { careerId: true }
        });

        if (!user || !user.careerId) {
            return res.status(400).json({ error: "No career assigned. Please request it in your profile." });
        }

        const subjects = await prisma.subject.findMany({
            where: { careerId: user.careerId }, // 🔥 Only subjects from their career
            orderBy: { semesterLevel: 'asc' },
            include: {
                enrollments: {
                    where: { userId: userId },
                    orderBy: { id: 'desc' }, // Get latest attempt
                    take: 1,
                    select: { status: true, finalGrade: true }
                }
            }
        });

        const data = subjects.map(s => {
            const lastEnrollment = s.enrollments[0];
            return {
                id: s.id,
                name: s.name,
                semester: s.semesterLevel,
                // Key data for mesh visualization:
                enrollmentStatus: lastEnrollment ? lastEnrollment.status : null, // APPROVED, FAILED, TAKING
                grade: lastEnrollment ? lastEnrollment.finalGrade : null,
                isEnrolled: !!lastEnrollment && lastEnrollment.status === 'APPROVED' // To lock in history
            };
        });

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching catalog" });
    }
};

// 🟢 2. ENROLL COURSE (SMART VALIDATION)
const enrollCourse = async (req: Request, res: Response) => {
    try {
        const { id } = (req as any).user;
        const { parallelId } = req.body;

        // 1. Validate Parallel
        const parallel = await prisma.parallel.findUnique({
            where: { id: parseInt(parallelId) },
            include: { subject: true, _count: { select: { enrollments: true } } }
        });

        if (!parallel) return res.status(404).json({ error: "Course does not exist." });

        // 2. Validate Capacity
        if (parallel._count.enrollments >= parallel.capacity) {
            return res.status(400).json({ error: "Course is full." });
        }

        // 3. 🔥 ACADEMIC VALIDATION (CORE)
        const history = await prisma.enrollment.findUnique({
            where: {
                userId_subjectId: {
                    userId: parseInt(String(id)),
                    subjectId: parallel.subjectId
                }
            }
        });

        if (history) {
            // A. Already Approved -> BLOCK
            if (history.status === 'APPROVED') {
                return res.status(400).json({ error: `You already passed ${parallel.subject.name} (Grade: ${history.finalGrade}). You cannot retake it.` });
            }
            // B. Currently Taking -> BLOCK
            if (history.status === 'TAKING') {
                return res.status(400).json({ error: "You are currently taking this course." });
            }
            // C. If 'FAILED' or 'PENDING' -> ALLOW (Retaking)
            // (Upsert below handles re-enrollment)
        }

        // 4. Enroll (Upsert handles re-enrollment over failed record)
        await prisma.enrollment.upsert({
            where: {
                userId_subjectId: {
                    userId: parseInt(String(id)),
                    subjectId: parallel.subjectId
                }
            },
            update: {
                parallelId: parallel.id,
                status: 'TAKING',
                finalGrade: null // Reset grade when retaking
            },
            create: {
                userId: parseInt(String(id)),
                subjectId: parallel.subjectId,
                parallelId: parallel.id,
                status: 'TAKING'
            }
        });

        res.json({ message: "Enrollment successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Enrollment failed" });
    }
};

// REQUEST CAREER ASSIGNMENT
export const requestCareer = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));

        await prisma.user.update({
            where: { id: userId },
            data: { requestingCareer: true }
        });

        res.json({ message: "Request sent to administrator." });
    } catch (error) {
        res.status(500).json({ error: "Error sending request." });
    }
};

// LEAVE COURSE (DROP)
const leaveCourse = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(String((req as any).user.id));
        const { subjectId } = req.params; // Comes as subjectId but it's parallelId in frontend

        const idToDelete = parseInt(String(subjectId));

        if (isNaN(idToDelete)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        // ATTEMPT 1: Delete by Parallel ID (Standard for new system)
        const deletedParallel = await prisma.enrollment.deleteMany({
            where: {
                userId: userId,
                parallelId: idToDelete
            }
        });

        if (deletedParallel.count > 0) {
            return res.json({ message: "Successfully dropped course." });
        }

        // ATTEMPT 2: Zombie Cleanup (Delete by SubjectId if no parallel assigned)
        const deletedSubject = await prisma.enrollment.deleteMany({
            where: {
                userId: userId,
                subjectId: idToDelete
            }
        });

        if (deletedSubject.count > 0) {
            return res.json({ message: "Successfully dropped course (legacy record)." });
        }

        res.status(404).json({ error: "Enrollment not found." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error dropping course" });
    }
};

// =====================================================================
// EXPORTS
// =====================================================================
export {
    getStudentStats,
    getStudentDashboard,
    getWeeklySchedule,
    getMyCourses,
    getStudentCourseDetails,
    submitActivity,
    getAvailableTutorings,
    bookTutoring,
    getAllCourses,
    enrollCourse,
    leaveCourse,
    getCatalogFilters,
    getOpenCourses,
    registerHistoricalGrades
};