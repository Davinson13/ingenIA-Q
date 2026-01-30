import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Obtener lista de Carreras
export const getPublicCareers = async (req: Request, res: Response) => {
    try {
        const careers = await prisma.career.findMany({
            select: { id: true, name: true, totalSemesters: true }
        });
        res.send(careers);
    } catch (e) {
        res.status(500).send("ERROR_GETTING_CAREERS");
    }
};

// 2. Obtener Oferta Académica
export const getPublicAcademicOffer = async (req: Request, res: Response) => {
    try {
        const { careerId } = req.params;
        
        // 🔥 CORRECCIÓN: Parsear con seguridad
        const id = parseInt(careerId as string);

        if (isNaN(id)) {
            res.status(400).send("ID de carrera inválido");
            return; // 👈 Importante: detener ejecución
        }
        
        // Buscar el periodo activo
        const activePeriod = await prisma.academicPeriod.findFirst({ where: { isActive: true } });
        if (!activePeriod) {
            res.status(404).send("NO_ACTIVE_PERIOD");
            return;
        }

        const subjects = await prisma.subject.findMany({
            where: { careerId: id }, // Usamos el ID parseado
            include: {
                parallels: {
                    where: { periodId: activePeriod.id },
                    include: {
                        schedules: true,
                        // Si falla 'teacher', verifica si tu relación se llama 'user' en schema.prisma
                        teacher: { select: { fullName: true } } 
                    }
                }
            }
        });

        res.send({
            period: activePeriod.name,
            subjects: subjects
        });

    } catch (e) {
        console.error(e);
        res.status(500).send("ERROR_GETTING_OFFER");
    }
};