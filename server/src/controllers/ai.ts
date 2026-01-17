// server/src/controllers/ai.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user?: any;
}

const chatWithAi = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user._id;
    const { question } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        career: true,
        enrollments: { include: { subject: true } }
      }
    });

    if (!user) {
      res.status(404).send("Usuario no encontrado");
      return;
    }

    let aiResponse = "";
    const lowerQuestion = question.toLowerCase();

    // Filtramos lo que sirve
    const approvedSubjects = user.enrollments.filter(e => e.status === 'APPROVED');
    const takingSubjects = user.enrollments.filter(e => e.status === 'TAKING');

    // --- LÓGICA DE RESPUESTA ---

    // 1. Pregunta por Notas/Promedio
    if (lowerQuestion.includes("nota") || lowerQuestion.includes("promedio") || lowerQuestion.includes("calificación")) {
      if (approvedSubjects.length > 0) {
        const sum = approvedSubjects.reduce((acc, curr) => acc + (curr.finalGrade || 0), 0);

        const avg = (sum / approvedSubjects.length).toFixed(2);

        aiResponse = `Tu promedio académico actual es de **${avg}/10**, calculado sobre ${approvedSubjects.length} materias aprobadas. 📊`;
      } else {
        aiResponse = "Aún no tienes notas registradas para calcular un promedio.";
      }
    }

    // 2. Pregunta por Materias Actuales (Cursando)
    else if (lowerQuestion.includes("cursando") || lowerQuestion.includes("viendo") || lowerQuestion.includes("actual") || lowerQuestion.includes("materias")) {
      if (takingSubjects.length > 0) {
        const lista = takingSubjects.map(t => t.subject.name).join(', ');
        const maxSemester = Math.max(...takingSubjects.map(t => t.subject.semesterLevel));
        aiResponse = `Este semestre (Nivel ${maxSemester}) estás cursando **${takingSubjects.length} materias**: \n\n🔹 ${lista}. \n\n¡Organízate bien! 📅`;
      } else {
        aiResponse = "Actualmente no estás matriculado en ninguna materia.";
      }
    }

    // 3. Pregunta por la Carrera
    else if (lowerQuestion.includes("carrera") || lowerQuestion.includes("estudio")) {
      aiResponse = `Eres estudiante de **${user.career?.name}**. Tu malla curricular tiene ${user.career?.totalSemesters} semestres. ¡Ya te falta menos! 🎓`;
    }

    // 4. Saludo
    else if (lowerQuestion.includes("hola") || lowerQuestion.includes("buenos") || lowerQuestion.includes("que tal")) {
      aiResponse = `¡Hola ${user.fullName.split(' ')[0]}! 🤖 Soy tu asistente académico. Pregúntame sobre tus notas, qué materias estás viendo o sobre tu carrera.`;
    }

    // 5. Default
    else {
      aiResponse = "Aún estoy aprendiendo 🧠. Intenta preguntarme: '¿Cuál es mi promedio?' o '¿Qué materias estoy cursando?'.";
    }

    res.send({
      text: aiResponse,
      sender: 'ai',
      timestamp: new Date()
    });

  } catch (e) {
    console.log(e);
    res.status(500).send("ERROR_AI_CHAT");
  }
};

export { chatWithAi };