import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();

// Configurar Gemini
// Usamos "gemini-1.5-flash" porque es rápido y barato (gratis en este tier)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Usamos "gemini-pro" que es el estándar estable y gratuito actualmente
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

interface RequestWithUser extends Request {
  user?: any;
}

export const chatWithTutor = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = parseInt(String(req.user.id));
    const { message } = req.body;

    if (!message) return res.status(400).send("El mensaje es requerido.");

    // 1. OBTENER CONTEXTO DEL ESTUDIANTE (RAG)
    // Buscamos quién es y qué estudia para que la IA no alucine.
    const studentData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        career: true,
        enrollments: {
          where: { status: 'TAKING' },
          include: {
            subject: true,
            parallel: { include: { schedules: true } }
          }
        }
      }
    });

    if (!studentData) return res.status(404).send("Estudiante no encontrado.");

    // 2. PREPARAR EL "PROMPT DEL SISTEMA"
    // Le damos personalidad a la IA y le pasamos los datos del alumno.

    const coursesList = studentData.enrollments.map(e =>
      `- ${e.subject.name} (Paralelo ${e.parallel?.code || 'N/A'})`
    ).join("\n");

    // ... dentro de chatWithTutor ...

        const prompt = `
            Eres un tutor universitario eficiente llamado IngenIA.
            
            ESTUDIANTE: ${studentData.fullName}
            MATERIAS: ${coursesList || "Sin registro"}

            PREGUNTA: "${message}"

            REGLAS DE RESPUESTA:
            1. VELOCIDAD: Sé extremadamente conciso. Máximo 2-3 oraciones si es posible.
            2. FORMATO: Usa Markdown para resaltar palabras clave (negrita) o hacer listas cortas.
            3. ESTILO: Directo, sin saludos protocolarios largos ("Hola estimado estudiante..."). Ve al punto.
            4. Si preguntan algo fuera de lo académico, responde brevemente que no puedes ayudar con eso.
        `;

// ... el resto sigue igual ...

    // 3. ENVIAR A GEMINI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. RESPONDER AL FRONTEND
    res.json({ reply: text });

  } catch (error) {
    console.error("Error con Gemini:", error);
    res.status(500).json({ reply: "Lo siento, mi cerebro digital está sobrecargado. Intenta de nuevo en unos segundos." });
  }
};