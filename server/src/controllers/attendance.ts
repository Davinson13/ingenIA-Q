import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended Request to include authenticated user info
interface RequestWithUser extends Request {
    user?: any;
}

// =====================================================================
// 1. GET ATTENDANCE
// =====================================================================

/**
 * Retrieves the attendance list for a specific course and date.
 * If no date is provided, defaults to the current date.
 * Returns student details along with their status (Present, Late, Absent).
 */
const getAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId, date } = req.query;

        if (!courseId) { 
            return res.status(400).send("Missing courseId"); 
        }

        const parallelId = parseInt(String(courseId));
        let searchDate = new Date(String(date));
        
        // Validate date, default to today if invalid
        if (isNaN(searchDate.getTime())) {
            searchDate = new Date();
        }

        // Verify the course exists
        const parallel = await prisma.parallel.findUnique({ where: { id: parallelId } });
        if (!parallel) { 
            return res.status(404).send("Course not found"); 
        }

        // Fetch students enrolled in this course (TAKING status)
        // Handles legacy data where parallelId might be null but linked via subjectId
        const enrollments = await prisma.enrollment.findMany({
            where: {
                status: "TAKING",
                OR: [
                    { parallelId: parallelId }, 
                    { subjectId: parallel.subjectId, parallelId: null }
                ]
            },
            include: {
                user: true,
                // Only fetch attendance record for the specific date
                attendance: { where: { date: searchDate } }
            },
            orderBy: { user: { fullName: "asc" } }
        });

        // Map data for frontend consumption
        const data = enrollments.map(e => ({
            enrollmentId: e.id,
            studentId: e.user.id,
            fullName: e.user.fullName,
            avatar: `https://ui-avatars.com/api/?name=${e.user.fullName}&background=random`,
            // Extract status if exists, otherwise null (Frontend handles default)
            status: e.attendance.length > 0 ? e.attendance[0].status : null
        }));

        res.send(data);
    } catch (e) {
        console.error("Error fetching attendance:", e);
        res.status(500).send("ERROR_GETTING_ATTENDANCE");
    }
};

// =====================================================================
// 2. SAVE ATTENDANCE
// =====================================================================

/**
 * Saves or updates attendance records for multiple students in a single transaction.
 * Fixes the unique constraint key naming issue ('date_enrollmentId').
 */
const saveAttendance = async (req: RequestWithUser, res: Response) => {
    try {
        const { date, records } = req.body; 

        if (!records || !Array.isArray(records)) {
            return res.status(400).send("Invalid data format");
        }

        let saveDate = new Date(String(date));
        if (isNaN(saveDate.getTime())) {
            saveDate = new Date();
        }

        // Prepare bulk upsert operations
        const operations = records.map((rec: any) => {
            // 👇 FIX: Using correct composite key name from Prisma schema
            const whereClause = {
                date_enrollmentId: { 
                    enrollmentId: rec.enrollmentId,
                    date: saveDate
                }
            };

            return prisma.attendance.upsert({
                where: whereClause,
                update: { status: rec.status },
                create: {
                    enrollmentId: rec.enrollmentId,
                    date: saveDate,
                    status: rec.status
                }
            });
        });

        // Execute all updates in a single transaction for data integrity
        await prisma.$transaction(operations);
        
        res.send({ message: "Attendance saved successfully" });

    } catch (e) {
        console.error("Error saving attendance:", e);
        res.status(500).send("ERROR_SAVING_ATTENDANCE");
    }
};

export { getAttendance, saveAttendance };