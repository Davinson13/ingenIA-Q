import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando actualización de datos (MODO MANTENIMIENTO)...');

  // ----------------------------------------------------------------------
  // 1. OBTENER EL ESTUDIANTE (Sin borrar nada)
  // ----------------------------------------------------------------------
  const student = await prisma.user.findFirst({
    where: { email: 'estudiante@fica.edu.ec' }
  });

  if (!student) {
    console.error("❌ No se encontró al estudiante 'estudiante@fica.edu.ec'. Ejecuta el seed inicial primero.");
    return;
  }

  // ----------------------------------------------------------------------
  // 2. ACTUALIZAR NOTAS DE MATERIAS YA APROBADAS (Sobre 20)
  // ----------------------------------------------------------------------
  console.log('📝 Actualizando notas de materias finalizadas...');

  // Buscamos solo las materias que NO se están cursando (Aprobadas/Reprobadas)
  const finishedEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: student.id,
      status: { notIn: ['TAKING', 'PENDING'] }
    }
  });

  for (const enrollment of finishedEnrollments) {
    // Generar nota aleatoria entre 14.0 y 20.0
    const newGrade = parseFloat((Math.random() * (20 - 14) + 14).toFixed(1));

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { finalGrade: newGrade }
    });
  }
  console.log(`✅ ${finishedEnrollments.length} materias históricas actualizadas con notas sobre 20.`);

  // ----------------------------------------------------------------------
  // 3. GENERAR TAREAS PENDIENTES PARA MATERIAS EN CURSO
  // ----------------------------------------------------------------------
  console.log('📅 Generando eventos y tareas pendientes...');

  // Buscar solo las materias que SÍ está tomando
  const currentEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: student.id,
      status: { in: ['TAKING', 'PENDING'] }
    },
    include: { parallel: true, subject: true }
  });

  // Fechas futuras para que aparezcan como "Pendientes" en el Dashboard
  const today = new Date();
  const dateIn2Days = new Date(today); dateIn2Days.setDate(today.getDate() + 2);
  const dateIn1Week = new Date(today); dateIn1Week.setDate(today.getDate() + 7);
  const dateIn1Month = new Date(today); dateIn1Month.setDate(today.getDate() + 25);

  for (const enr of currentEnrollments) {
    // Necesitamos un paralelo para asignarle tareas. Si no tiene, buscamos uno existente de la materia.
    let parallelId = enr.parallelId;

    if (!parallelId) {
      const existingParallel = await prisma.parallel.findFirst({
        where: { subjectId: enr.subjectId }
      });
      if (existingParallel) {
        parallelId = existingParallel.id;
        // Vinculamos al estudiante a este paralelo para corregir la data
        await prisma.enrollment.update({
          where: { id: enr.id },
          data: { parallelId: parallelId }
        });
      }
    }

    if (parallelId) {
      // Verificar si ya tiene eventos futuros para no duplicar
      const existingFutureEvents = await prisma.event.findMany({
        where: { parallelId: parallelId, date: { gte: today } }
      });

      if (existingFutureEvents.length === 0) {
        console.log(`   -> Creando tareas para: ${enr.subject.name}`);

        await prisma.event.createMany({
          data: [
            {
              title: `Taller Práctico: ${enr.subject.name}`,
              description: "Resolución de problemas del capítulo actual.",
              date: dateIn2Days, // Vence en 2 días
              type: "INDIVIDUAL",
              parallelId: parallelId
            },
            {
              title: `Avance Proyecto: ${enr.subject.name}`,
              description: "Entrega del primer hito del proyecto grupal.",
              date: dateIn1Week, // Vence en 1 semana
              type: "GRUPAL",
              parallelId: parallelId
            },
            {
              title: `Examen Parcial: ${enr.subject.name}`,
              description: "Evaluación de conocimientos teóricos y prácticos.",
              date: dateIn1Month, // Vence en 1 mes
              type: "MEDIO",
              parallelId: parallelId
            }
          ]
        });
      }
    }
  }

  console.log('✅ Tareas pendientes generadas exitosamente.');
  console.log('🚀 DB Actualizada correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    // 🔥 CORRECCIÓN: Usamos throw en lugar de process.exit(1) para evitar el error de tipos
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });