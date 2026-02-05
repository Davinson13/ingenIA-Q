import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended Request interface
interface RequestWithUser extends Request {
    user?: { id: number };
}

/**
 * Retrieves the complete academic career plan (mesh) for the logged-in student.
 * It combines the static list of subjects for the career with the 
 * student's personal progress (Approved, Taking, Pending).
 */
const getMyCareerPlan = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = req.user?.id;

        // 1. Security Validation
        if (!userId) {
            console.error("❌ Error: User ID missing in token.");
            res.status(401).send("INVALID_TOKEN");
            return;
        }

        // 2. Fetch User and Career info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { career: true }
        });

        if (!user) {
            res.status(404).send("USER_NOT_FOUND");
            return;
        }

        if (!user.careerId || !user.career) {
            res.status(404).send("USER_HAS_NO_CAREER_ASSIGNED");
            return;
        }

        // 3. Fetch all Subjects AND the status specifically for THIS user
        // This is a "Left Join" logic: Get all subjects, and attach enrollment info if it exists.
        const subjects = await prisma.subject.findMany({
            where: { careerId: user.careerId },
            include: {
                enrollments: {
                    where: { userId: userId }, // Filter only THIS user's history
                    select: { status: true, finalGrade: true }
                }
            },
            orderBy: { semesterLevel: 'asc' }
        });

        // 4. Flatten the data for the Frontend
        const subjectsWithStatus = subjects.map(s => {
            // Since we filtered by userId, the array has 0 or 1 element
            const enrollment = s.enrollments[0]; 
            return {
                id: s.id,
                name: s.name,
                semesterLevel: s.semesterLevel,
                status: enrollment ? enrollment.status : 'PENDING', // Default to PENDING
                grade: enrollment ? enrollment.finalGrade : null
            };
        });

        // 5. Group subjects by Semester Level
        const subjectsBySemester = subjectsWithStatus.reduce((acc: any, subject) => {
            const level = subject.semesterLevel;
            if (!acc[level]) acc[level] = [];
            acc[level].push(subject);
            return acc;
        }, {});

        res.send({
            careerName: user.career.name,
            totalSemesters: user.career.totalSemesters,
            plan: subjectsBySemester
        });

    } catch (e) {
        console.error("🔥 ERROR IN CAREER PLAN:", e);
        res.status(500).send("ERROR_GETTING_PLAN");
    }
};

export { getMyCareerPlan };