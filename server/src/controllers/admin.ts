import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended Request interface to include user info from middleware
interface RequestWithUser extends Request {
    user?: any; // Replace 'any' with your actual User type if available
}

// =====================================================================
// 1. DASHBOARD ANALYTICS
// =====================================================================

/**
 * Retrieves high-level statistics for the admin dashboard.
 * Includes total users, student/teacher breakdown, pending requests, and active period.
 */
export const getAdminDashboard = async (req: RequestWithUser, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
        const totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });

        // Count users requesting a career assignment
        const pendingRequests = await prisma.user.count({
            where: { requestingCareer: true }
        });

        // Fetch active period name or default to "None"
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        const totalSubjects = await prisma.subject.count();

        res.send({
            users: totalUsers,
            students: totalStudents,
            teachers: totalTeachers,
            pendingRequests,
            activePeriod: activePeriod ? activePeriod.name : "None",
            subjects: totalSubjects
        });
    } catch (e) {
        console.error("Error fetching dashboard stats:", e);
        res.status(500).send("ERROR_DASHBOARD_STATS");
    }
};

// =====================================================================
// 2. USER MANAGEMENT
// =====================================================================

/**
 * Retrieves all users with their career information.
 */
export const getAdminUsers = async (req: RequestWithUser, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { fullName: 'asc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                requestingCareer: true,
                career: { select: { id: true, name: true } }
            }
        });
        res.send(users);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_USERS");
    }
};

/**
 * Retrieves a simplified list of careers for dropdown menus.
 */
export const getCareersList = async (req: RequestWithUser, res: Response) => {
    try {
        const careers = await prisma.career.findMany({
            select: { id: true, name: true }
        });
        res.send(careers);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_CAREERS");
    }
};

/**
 * Updates a user's role and assigned career.
 * Automatically clears the 'requestingCareer' flag if a career is assigned.
 */
export const updateUser = async (req: RequestWithUser, res: Response) => {
    try {
        const { id } = req.params;
        const { role, careerId } = req.body;

        let finalCareerId: number | null = null;

        // Validate and parse careerId if the role is STUDENT
        if (role === 'STUDENT' && careerId) {
            const parsedId = parseInt(String(careerId));
            if (!isNaN(parsedId) && parsedId > 0) {
                finalCareerId = parsedId;
            }
        }

        await prisma.user.update({
            where: { id: parseInt(String(id)) },
            data: {
                role: role,
                careerId: finalCareerId,
                // If a career is assigned, turn off the request flag
                requestingCareer: finalCareerId ? false : undefined
            }
        });

        res.send({ message: "User updated successfully." });
    } catch (e) {
        console.error("Error updating user:", e);
        res.status(500).send("ERROR_UPDATING_USER");
    }
};

/**
 * Simple endpoint to update just the role (Legacy/Alternative).
 */
export const updateUserRole = async (req: RequestWithUser, res: Response) => {
    try {
        const { id, role } = req.body;
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role }
        });
        res.send(user);
    } catch (e) {
        res.status(500).send("ERROR_UPDATING_ROLE");
    }
};

// =====================================================================
// 3. ACADEMIC PERIODS MANAGEMENT
// =====================================================================

/**
 * Retrieves all academic periods ordered by start date.
 */
export const getPeriods = async (req: RequestWithUser, res: Response) => {
    try {
        const periods = await prisma.academicPeriod.findMany({ orderBy: { startDate: 'desc' } });
        res.send(periods);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_PERIODS");
    }
};

/**
 * Creates a new academic period.
 */
export const createPeriod = async (req: Request, res: Response) => {
    try {
        const { name, startDate, endDate } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newPeriod = await prisma.academicPeriod.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: false
            }
        });

        res.json(newPeriod);
    } catch (error) {
        console.error("Error creating period:", error);
        res.status(500).json({ error: "Failed to create period" });
    }
};

/**
 * Toggles the active status of a period.
 * Ensures only one period is active at a time.
 */
export const togglePeriodStatus = async (req: RequestWithUser, res: Response) => {
    try {
        const { id } = req.params;
        const periodId = parseInt(String(id));

        if (isNaN(periodId)) return res.status(400).send("Invalid ID");

        const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } });

        if (!period) return res.status(404).send("Period not found");

        // If activating this one, deactivate all others first
        if (!period.isActive) {
            await prisma.academicPeriod.updateMany({ data: { isActive: false } });
        }

        const updated = await prisma.academicPeriod.update({
            where: { id: periodId },
            data: { isActive: !period.isActive }
        });

        res.send(updated);
    } catch (e) {
        res.status(500).send("ERROR_TOGGLE_PERIOD");
    }
};

/**
 * Updates period details (Name and Dates).
 */
export const updatePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate } = req.body;

        await prisma.academicPeriod.update({
            where: { id: parseInt(String(id)) },
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            }
        });
        res.json({ message: "Period updated" });
    } catch (error) {
        res.status(500).json({ error: "Error updating period" });
    }
};

/**
 * Deletes a period and all associated data (Cascade delete via Transaction).
 */
export const deletePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const periodId = parseInt(String(id));

        await prisma.$transaction(async (tx) => {
            // Find involved parallels (courses)
            const parallels = await tx.parallel.findMany({
                where: { periodId: periodId },
                select: { id: true }
            });

            const parallelIds = parallels.map(p => p.id);

            if (parallelIds.length > 0) {
                // Delete Grades
                await tx.activityGrade.deleteMany({
                    where: { event: { parallelId: { in: parallelIds } } }
                });

                // Delete Attendance
                await tx.attendance.deleteMany({
                    where: { enrollment: { parallelId: { in: parallelIds } } }
                });

                // Delete Schedules
                await tx.schedule.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // Delete Agenda Events
                await tx.event.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // Delete Evaluation Activities (Grade categories)
                await tx.activity.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // Delete Enrollments
                await tx.enrollment.deleteMany({
                    where: { parallelId: { in: parallelIds } }
                });

                // Delete Parallels
                await tx.parallel.deleteMany({
                    where: { periodId: periodId }
                });
            }

            // Finally delete the Period
            await tx.academicPeriod.delete({
                where: { id: periodId }
            });
        });

        res.json({ message: "Period deleted successfully." });

    } catch (error) {
        console.error("Critical error deleting period:", error);
        res.status(500).json({ error: "Could not delete period. Check server logs." });
    }
};

// =====================================================================
// 4. ACADEMIC STRUCTURE (Careers, Subjects, Parallels)
// =====================================================================

/**
 * Retrieves the full academic tree: Careers -> Subjects -> Parallels -> Schedules/Teachers.
 * Only returns parallels for the currently ACTIVE period.
 */
export const getAcademicStructure = async (req: Request, res: Response) => {
    try {
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });

        const careers = await prisma.career.findMany({
            include: {
                subjects: {
                    include: {
                        parallels: {
                            // Filter parallels by active period if one exists
                            where: activePeriod ? { periodId: activePeriod.id } : undefined,
                            include: {
                                teacher: true,
                                schedules: true
                            }
                        }
                    }
                }
            }
        });
        res.json(careers);
    } catch (error) {
        res.status(500).json({ error: "Error fetching academic structure" });
    }
};

/**
 * Creates a new Parallel (Course instance) for a subject.
 * Automatically generates default evaluation activities.
 */
export const createParallel = async (req: RequestWithUser, res: Response) => {
    try {
        const { subjectId, code, capacity, teacherId } = req.body;

        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        if (!activePeriod) {
            return res.status(400).send("No active period found. Please activate one first.");
        }

        const newParallel = await prisma.parallel.create({
            data: {
                code,
                capacity: parseInt(capacity),
                subjectId: parseInt(subjectId),
                periodId: activePeriod.id,
                teacherId: parseInt(teacherId)
            }
        });

        // Initialize default evaluation structure
        await prisma.activity.createMany({
            data: [
                { name: "Individual Work", type: "INDIVIDUAL", maxScore: 7.0, parallelId: newParallel.id },
                { name: "Group Work", type: "GRUPAL", maxScore: 5.0, parallelId: newParallel.id },
                { name: "Midterm Exam", type: "MEDIO", maxScore: 2.0, parallelId: newParallel.id },
                { name: "Final Exam", type: "FINAL", maxScore: 6.0, parallelId: newParallel.id }
            ]
        });

        res.send(newParallel);
    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_CREATING_PARALLEL");
    }
};

/**
 * Updates Parallel details (Teacher or Capacity).
 */
export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { teacherId, capacity } = req.body;
        const courseId = parseInt(String(id));

        await prisma.parallel.update({
            where: { id: courseId },
            data: {
                teacherId: teacherId ? parseInt(String(teacherId)) : undefined,
                capacity: capacity ? parseInt(String(capacity)) : undefined
            }
        });

        res.json({ message: "Course updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error updating course" });
    }
};

/**
 * Deletes a Parallel (Course).
 * Validates that no students are enrolled before deletion.
 */
export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const courseId = parseInt(String(id));

        // Validation: Check for enrollments
        const enrolled = await prisma.enrollment.count({
            where: { parallelId: courseId }
        });

        if (enrolled > 0) {
            return res.status(400).json({ error: "Cannot delete: Course has enrolled students." });
        }

        // Cleanup dependencies
        await prisma.schedule.deleteMany({ where: { parallelId: courseId } });
        await prisma.activity.deleteMany({ where: { parallelId: courseId } });
        
        // Delete course
        await prisma.parallel.delete({ where: { id: courseId } });

        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting course" });
    }
};

/**
 * Adds a time block to a Parallel's schedule.
 */
export const addSchedule = async (req: RequestWithUser, res: Response) => {
    try {
        const { parallelId, dayOfWeek, startTime, endTime } = req.body;

        const schedule = await prisma.schedule.create({
            data: {
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                parallelId: parseInt(parallelId)
            }
        });
        res.send(schedule);
    } catch (e) {
        res.status(500).send("ERROR_ADDING_SCHEDULE");
    }
};

/**
 * Deletes a specific schedule block.
 */
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.schedule.delete({ where: { id: parseInt(String(id)) } });
        res.json({ message: "Schedule deleted" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting schedule" });
    }
};