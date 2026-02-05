import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

// --- GEMINI CONFIGURATION ---
// We use "gemini-1.5-flash" for speed and efficiency.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Interface to handle User ID from the auth middleware
interface RequestWithUser extends Request {
    user?: { id: number }; // Typed specifically for the ID
}

/**
 * Handles the chat interaction between a student and the AI Tutor.
 * Uses RAG (Retrieval-Augmented Generation) by injecting the student's
 * academic context (courses, schedule) into the prompt.
 */
export const chatWithTutor = async (req: RequestWithUser, res: Response) => {
    try {
        const userId = parseInt(String(req.user?.id));
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message content is required." });
        }

        // 1. RETRIEVE STUDENT CONTEXT (RAG)
        // Fetch academic data to prevent the AI from "hallucinating" details.
        const studentData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                career: true,
                enrollments: {
                    where: { status: 'TAKING' }, // Only active courses
                    include: {
                        subject: true,
                        parallel: { include: { schedules: true } }
                    }
                }
            }
        });

        if (!studentData) {
            return res.status(404).json({ error: "Student profile not found." });
        }

        // 2. CONSTRUCT SYSTEM PROMPT
        // Format the course list for the AI to understand.
        const coursesList = studentData.enrollments.map(e =>
            `- ${e.subject.name} (Parallel ${e.parallel?.code || 'N/A'})`
        ).join("\n");

        const prompt = `
            You are an efficient university tutor named IngenIA.
            
            STUDENT CONTEXT:
            - Name: ${studentData.fullName}
            - Major: ${studentData.career?.name || "General"}
            - Current Courses:
            ${coursesList || "No active courses registered."}

            USER QUESTION: "${message}"

            RESPONSE GUIDELINES:
            1. CONCISENESS: Be extremely brief. Maximum 2-3 sentences if possible.
            2. FORMATTING: Use Markdown to highlight key terms (bold) or bullet points.
            3. TONE: Direct and professional. Do not use greetings like "Hello dear student". Go straight to the answer.
            4. SCOPE: If the question is strictly non-academic (e.g., "tell me a joke"), reply briefly that you are an academic assistant.
            5. TRANSLATE: Response in the Spanish and English
        `;

        // 3. CALL GEMINI API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. SEND RESPONSE
        res.json({ reply: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ 
            reply: "My digital brain is currently overloaded. Please try again in a few seconds." 
        });
    }
};