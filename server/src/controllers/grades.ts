import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
    user?: any;
}

const WEIGHTS: Record<string, number> = {
    'INDIVIDUAL': 7, 'GRUPAL': 5, 'MEDIO': 2, 'FINAL': 6
};

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Calculates the weighted total (GPA) for a student.
 * Currently returns 0 as a placeholder while the event-based calculation logic is finalized.
 */
const calculateWeightedTotal = (activities: any[], grades: any[]) => {
    let totalPoints = 0;
    // Note: With the new Event system, this logic is an approximation.
    // Future Todo: Fetch Events to determine the weight type, not just ActivityGrade.
    return parseFloat(totalPoints.toFixed(2));
};

// =====================================================================
// 1. GET GRADE MATRIX (For Teachers)
// =====================================================================

/**
 * Retrieves the complete grade book (Matrix) for a specific course.
 * Rows: Students, Columns: Activities (Categories).
 */
const getGradeMatrix = async (req: RequestWithUser, res: Response) => {
    try {
        const { courseId } = req.params;

        // Force string conversion before parsing to ensure safety
        const idString = String(courseId || '');
        const parallelId = parseInt(idString, 10);

        if (isNaN(parallelId)) {
            return res.status(400).send("INVALID_COURSE_ID");
        }

        // A. Get Activities (Evaluation Categories)
        const activities = await prisma.activity.findMany({
            where: { parallelId },
            orderBy: { id: 'asc' }
        });

        // B. Get Students and their grades
        // Using flexible search logic to handle both direct and subject-based enrollment
        const enrollments = await prisma.enrollment.findMany({
            where: {
                OR: [
                    { parallelId: parallelId },
                    { subject: { parallels: { some: { id: parallelId } } }, parallelId: null }
                ],
                status: 'TAKING'
            },
            include: {
                user: true
                // Note: We fetch grades separately inside the map loop to avoid complex filtering issues
            },
            orderBy: { user: { fullName: 'asc' } }
        });

        // C. Format the Matrix
        const matrix = await Promise.all(enrollments.map(async (enrollment) => {
            const student = enrollment.user;

            // Fetch all grades for this student
            const studentGrades = await prisma.activityGrade.findMany({
                where: { studentId: student.id }
            });

            // Map grades for frontend consumption
            const gradesMap: Record<number, number> = {};

            // Fill the map.
            // Note: Since we are moving to Event-based grading, direct Activity ID mapping might be empty 
            // until the migration is fully complete. This ensures it doesn't crash.
            activities.forEach(act => {
                const gradeObj = studentGrades.find((g: any) => g.activityId === act.id);
                gradesMap[act.id] = gradeObj && gradeObj.score ? gradeObj.score : 0;
            });

            // Calculate simple total
            const finalTotal = calculateWeightedTotal(activities, studentGrades);

            return {
                enrollmentId: enrollment.id,
                studentId: student.id,
                fullName: student.fullName,
                avatar: `https://ui-avatars.com/api/?name=${student.fullName}&background=random`,
                grades: gradesMap,
                finalTotal: finalTotal
            };
        }));

        res.send({ activities, students: matrix });

    } catch (e) {
        console.error("Error getting grade matrix:", e);
        res.status(500).send("ERROR_GETTING_MATRIX");
    }
};

// =====================================================================
// 2. UPDATE GRADE (Event-Based)
// =====================================================================

/**
 * Updates or creates a grade for a specific student and event.
 * Uses the composite unique key (studentId_eventId) to ensure data integrity.
 */
const updateActivityGrade = async (req: RequestWithUser, res: Response) => {
    try {
        const { activityId, studentId, score, feedback } = req.body;

        // Ensure type safety
        const scoreNum = parseFloat(String(score));
        const eventIdInt = parseInt(String(activityId), 10); // The incoming ID refers to the EVENT
        const studIdInt = parseInt(String(studentId), 10);

        if (isNaN(eventIdInt) || isNaN(studIdInt)) {
            return res.status(400).send("INVALID_IDS");
        }

        // 🛡️ TYPE CASTING TO ANY (Prisma Safety)
        // We use 'any' for the where clause to bypass strict TypeScript checks 
        // on the dynamically generated composite key 'studentId_eventId'
        const whereClause: any = {
            studentId_eventId: {
                studentId: studIdInt,
                eventId: eventIdInt
            }
        };

        const createData: any = {
            studentId: studIdInt,
            eventId: eventIdInt, // We save it to eventId, not activityId
            score: scoreNum,
            feedback: feedback || ""
        };

        const grade = await prisma.activityGrade.upsert({
            where: whereClause,
            update: {
                score: scoreNum,
                feedback: feedback || ""
            },
            create: createData
        });

        res.send(grade);

    } catch (e) {
        console.error("Error updating grade:", e);
        res.status(500).send("ERROR_UPDATING_ACTIVITY_GRADE");
    }
};

export { getGradeMatrix, updateActivityGrade };