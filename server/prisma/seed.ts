import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// DATOS EXTRAÍDOS DE LAS MALLAS CURRICULARES (FICA - UCE)
const CARRERAS_COMPLETAS = [
  {
    name: 'Ingeniería en Computación',
    totalSemesters: 10,
    subjects: [
      // SEMESTRE 1
      { name: 'Análisis I', semesterLevel: 1 },
      { name: 'Fundamentos de Matemática', semesterLevel: 1 },
      { name: 'Programación I', semesterLevel: 1 },
      { name: 'Introducción a la Ciencia de la Computación', semesterLevel: 1 },
      { name: 'Realidad Nacional y Saberes Ancestrales', semesterLevel: 1 },
      // SEMESTRE 2
      { name: 'Análisis II', semesterLevel: 2 },
      { name: 'Álgebra Lineal I', semesterLevel: 2 },
      { name: 'Programación II', semesterLevel: 2 },
      { name: 'Física', semesterLevel: 2 },
      { name: 'Comunicación Oral y Escrita', semesterLevel: 2 },
      // SEMESTRE 3
      { name: 'Probabilidades y Estadística Básica', semesterLevel: 3 },
      { name: 'Análisis III', semesterLevel: 3 },
      { name: 'Álgebra Lineal II', semesterLevel: 3 },
      { name: 'Estructura de Datos', semesterLevel: 3 },
      { name: 'Física para Ciencias de la Computación', semesterLevel: 3 },
      // SEMESTRE 4
      { name: 'Ecuaciones Diferenciales', semesterLevel: 4 },
      { name: 'Análisis Numérico', semesterLevel: 4 },
      { name: 'Matemática Discreta', semesterLevel: 4 },
      { name: 'Base de Datos I', semesterLevel: 4 },
      { name: 'Arquitectura de Software', semesterLevel: 4 },
      // SEMESTRE 5
      { name: 'Inferencia Estadística', semesterLevel: 5 },
      { name: 'Base de Datos II', semesterLevel: 5 },
      { name: 'Programación Avanzada I', semesterLevel: 5 },
      { name: 'Patrones de Diseño de Software', semesterLevel: 5 },
      { name: 'Arquitectura y Entornos Operativos', semesterLevel: 5 },
      { name: 'Metodología de la Investigación Científica', semesterLevel: 5 },
      // SEMESTRE 6
      { name: 'Optimización y Simulación', semesterLevel: 6 },
      { name: 'Inteligencia Artificial', semesterLevel: 6 },
      { name: 'Programación Avanzada II', semesterLevel: 6 },
      { name: 'Redes y Protocolos de Comunicación', semesterLevel: 6 },
      { name: 'Innovación y Emprendimiento', semesterLevel: 6 },
      // SEMESTRE 7
      { name: 'Aprendizaje Automático', semesterLevel: 7 },
      { name: 'Programación Avanzada III', semesterLevel: 7 },
      { name: 'Visualización Gráfica', semesterLevel: 7 },
      { name: 'Ingeniería de Software', semesterLevel: 7 },
      { name: 'Investigación Aplicada', semesterLevel: 7 },
      // SEMESTRE 8
      { name: 'Dispositivos Móviles', semesterLevel: 8 },
      { name: 'Criptografía y Seguridad de la Inf.', semesterLevel: 8 },
      { name: 'Programación Web', semesterLevel: 8 },
      { name: 'Fundamentos para Desarrollo de Videojuegos', semesterLevel: 8 },
      { name: 'Gobierno de las TIC', semesterLevel: 8 },
      { name: 'Taller 1', semesterLevel: 8 },
      // SEMESTRE 9
      { name: 'Minería de Datos', semesterLevel: 9 },
      { name: 'Sistemas Colaborativos', semesterLevel: 9 },
      { name: 'Programación Concurrente y Paralela', semesterLevel: 9 },
      { name: 'Proyecto de Videojuegos', semesterLevel: 9 },
      { name: 'Taller 2', semesterLevel: 9 },
      // SEMESTRE 10
      { name: 'Trabajo de Titulación', semesterLevel: 10 },
      { name: 'Programación Distribuida', semesterLevel: 10 },
      { name: 'Computación Grid y Cloud', semesterLevel: 10 },
      { name: 'Taller 3', semesterLevel: 10 }
    ]
  },
  {
    name: 'Ingeniería Civil',
    totalSemesters: 10,
    subjects: [
      // SEMESTRE 1
      { name: 'Cálculo Diferencial', semesterLevel: 1 },
      { name: 'Dibujo CAD', semesterLevel: 1 },
      { name: 'Programación 1', semesterLevel: 1 },
      { name: 'Química de Materiales', semesterLevel: 1 },
      { name: 'Física 1', semesterLevel: 1 },
      { name: 'Topografía 1', semesterLevel: 1 },
      { name: 'Realidad Nacional', semesterLevel: 1 },
      // SEMESTRE 2
      { name: 'Cálculo Integral', semesterLevel: 2 },
      { name: 'Estática', semesterLevel: 2 },
      { name: 'Programación 2', semesterLevel: 2 },
      { name: 'Estadística', semesterLevel: 2 },
      { name: 'Física 2', semesterLevel: 2 },
      { name: 'Topografía 2', semesterLevel: 2 },
      { name: 'Investigación Científica', semesterLevel: 2 },
      // SEMESTRE 3
      { name: 'Ecuaciones Diferenciales', semesterLevel: 3 },
      { name: 'Resistencia de Materiales 1', semesterLevel: 3 },
      { name: 'Dinámica', semesterLevel: 3 },
      { name: 'Ensayo de Materiales 1', semesterLevel: 3 },
      { name: 'Hidráulica 1', semesterLevel: 3 },
      { name: 'Trazado', semesterLevel: 3 },
      { name: 'Geología', semesterLevel: 3 },
      // SEMESTRE 4
      { name: 'Métodos Numéricos', semesterLevel: 4 },
      { name: 'Resistencia de Materiales 2', semesterLevel: 4 },
      { name: 'Hidrología Básica', semesterLevel: 4 },
      { name: 'Ensayo de Materiales 2', semesterLevel: 4 },
      { name: 'Hidráulica 2', semesterLevel: 4 },
      { name: 'Saneamiento Ambiental', semesterLevel: 4 },
      { name: 'Mecánica de Suelos 1', semesterLevel: 4 },
      // SEMESTRE 5
      { name: 'Concepción Arquitectónica', semesterLevel: 5 },
      { name: 'Estructuras 1', semesterLevel: 5 },
      { name: 'Hidrología Aplicada', semesterLevel: 5 },
      { name: 'Hormigón Armado 1', semesterLevel: 5 },
      { name: 'Diseño Hidráulico 1', semesterLevel: 5 },
      { name: 'Instalaciones Hidrosanitarias', semesterLevel: 5 },
      { name: 'Mecánica de Suelos 2', semesterLevel: 5 },
      // SEMESTRE 6
      { name: 'Construcciones 1', semesterLevel: 6 },
      { name: 'Estructuras 2', semesterLevel: 6 },
      { name: 'Instalaciones Eléctricas', semesterLevel: 6 },
      { name: 'Hormigón Armado 2', semesterLevel: 6 },
      { name: 'Diseño Hidráulico 2', semesterLevel: 6 },
      { name: 'Agua Potable', semesterLevel: 6 },
      { name: 'Mecánica de Suelos 3', semesterLevel: 6 },
      { name: 'Liderazgo', semesterLevel: 6 },
      // SEMESTRE 7
      { name: 'Construcciones 2', semesterLevel: 7 },
      { name: 'Estructuras 3', semesterLevel: 7 },
      { name: 'Estructuras Metálicas', semesterLevel: 7 },
      { name: 'Hormigón Armado 3', semesterLevel: 7 },
      { name: 'Vías de Comunicación', semesterLevel: 7 },
      { name: 'Alcantarillado', semesterLevel: 7 },
      { name: 'Geotecnia', semesterLevel: 7 },
      // SEMESTRE 8
      { name: 'Investigación e Innovación', semesterLevel: 8 },
      { name: 'Obras Civiles', semesterLevel: 8 },
      { name: 'Ingeniería Económica', semesterLevel: 8 },
      { name: 'Ingeniería de Tránsito', semesterLevel: 8 },
      { name: 'Impacto Ambiental', semesterLevel: 8 },
      { name: 'Química Sanitaria', semesterLevel: 8 },
      { name: 'Pavimentos', semesterLevel: 8 },
      { name: 'Administración de Empresas', semesterLevel: 8 },
      // SEMESTRE 9
      { name: 'Legislación Aplicada', semesterLevel: 9 },
      { name: 'Puentes', semesterLevel: 9 },
      { name: 'Presupuesto y Programación', semesterLevel: 9 },
      { name: 'Optimización de Procesos', semesterLevel: 9 },
      { name: 'Diseño de Presas', semesterLevel: 9 },
      { name: 'Plan Proyecto de Graduación', semesterLevel: 9 },
      // SEMESTRE 10
      { name: 'Formulación y Evaluación de Proyectos', semesterLevel: 10 },
      { name: 'Diseño Sismorresistente', semesterLevel: 10 },
      { name: 'Administración y Fiscalización', semesterLevel: 10 },
      { name: 'Seminario Proyecto Graduación', semesterLevel: 10 },
      { name: 'Proyecto de Graduación', semesterLevel: 10 },
      { name: 'Optativas', semesterLevel: 10 }
    ]
  },
  {
    name: 'Ingeniería en Sistemas de Información',
    totalSemesters: 10,
    subjects: [
      // SEMESTRE 1
      { name: 'Fundamentos de Matemáticas', semesterLevel: 1 },
      { name: 'Análisis I', semesterLevel: 1 },
      { name: 'Programación I', semesterLevel: 1 },
      { name: 'Fundamentos de SI', semesterLevel: 1 },
      { name: 'Física Aplicada', semesterLevel: 1 },
      // SEMESTRE 2
      { name: 'Matemáticas Discretas', semesterLevel: 2 },
      { name: 'Análisis II', semesterLevel: 2 },
      { name: 'Álgebra Lineal', semesterLevel: 2 },
      { name: 'Programación II', semesterLevel: 2 },
      { name: 'Nuevas Tecnologías e Innovación en SI', semesterLevel: 2 },
      { name: 'Comunicación y Lenguaje', semesterLevel: 2 },
      // SEMESTRE 3
      { name: 'Probabilidades y Estadística', semesterLevel: 3 },
      { name: 'Ecuaciones Diferenciales', semesterLevel: 3 },
      { name: 'Estructura de Datos', semesterLevel: 3 },
      { name: 'Arquitectura de Computadores', semesterLevel: 3 },
      { name: 'Interfaces de Usuario', semesterLevel: 3 },
      { name: 'Introducción a la Investigación', semesterLevel: 3 },
      // SEMESTRE 4
      { name: 'Métodos Numéricos', semesterLevel: 4 },
      { name: 'Algoritmos', semesterLevel: 4 },
      { name: 'Sistemas Operativos I', semesterLevel: 4 },
      { name: 'Infraestructura de TI I', semesterLevel: 4 },
      { name: 'Almacenaje de Datos', semesterLevel: 4 },
      { name: 'Liderazgo', semesterLevel: 4 },
      // SEMESTRE 5
      { name: 'Marcos de Desarrollo I', semesterLevel: 5 },
      { name: 'Sistemas Operativos II', semesterLevel: 5 },
      { name: 'Infraestructura de TI II', semesterLevel: 5 },
      { name: 'Gestión de Datos', semesterLevel: 5 },
      { name: 'Análisis y Diseño de Sistemas', semesterLevel: 5 },
      // SEMESTRE 6
      { name: 'Contabilidad Financiera', semesterLevel: 6 },
      { name: 'Marcos de Desarrollo II', semesterLevel: 6 },
      { name: 'Análisis de Datos', semesterLevel: 6 },
      { name: 'Seguridad y Gestión de Riesgos', semesterLevel: 6 },
      { name: 'Desarrollo de SI', semesterLevel: 6 },
      // SEMESTRE 7
      { name: 'Fundamentos de Economía', semesterLevel: 7 },
      { name: 'Programación Web', semesterLevel: 7 },
      { name: 'Inteligencia de Negocios', semesterLevel: 7 },
      { name: 'Investigación Aplicada', semesterLevel: 7 },
      { name: 'Arquitectura de Software', semesterLevel: 7 },
      { name: 'Sociedad de la Información', semesterLevel: 7 },
      // SEMESTRE 8
      { name: 'Auditoría TI', semesterLevel: 8 },
      { name: 'Programación Distribuida', semesterLevel: 8 },
      { name: 'Minería de Datos', semesterLevel: 8 },
      { name: 'Investigación Operativa', semesterLevel: 8 },
      { name: 'Control de Calidad del Software', semesterLevel: 8 },
      // SEMESTRE 9
      { name: 'Titulación (Formulación)', semesterLevel: 9 },
      { name: 'Legislación Informática', semesterLevel: 9 },
      { name: 'Gestión en Procesos de Negocios', semesterLevel: 9 },
      { name: 'Modelos de Investigación Operativa', semesterLevel: 9 },
      { name: 'Gestión de Proyectos de SI', semesterLevel: 9 },
      // SEMESTRE 10
      { name: 'Titulación (Desarrollo)', semesterLevel: 10 },
      { name: 'Programación para Dispositivos Móviles', semesterLevel: 10 },
      { name: 'Formación de Empresas', semesterLevel: 10 },
      { name: 'Sistemas de Información Empresarial', semesterLevel: 10 },
      { name: 'Estrategia y Gestión de Adquisición', semesterLevel: 10 }
    ]
  },
  {
    name: 'Diseño Industrial',
    totalSemesters: 10,
    subjects: [
      // SEMESTRE 1
      { name: 'Realidad Nacional y Saberes', semesterLevel: 1 },
      { name: 'Diseño Básico y Creatividad', semesterLevel: 1 },
      { name: 'Dibujo Artístico', semesterLevel: 1 },
      { name: 'Análisis Matemático I', semesterLevel: 1 },
      { name: 'Física I', semesterLevel: 1 },
      { name: 'Química', semesterLevel: 1 },
      // SEMESTRE 2
      { name: 'Expresión Oral y Escrita', semesterLevel: 2 },
      { name: 'Métodos del Diseño', semesterLevel: 2 },
      { name: 'Dibujo Técnico', semesterLevel: 2 },
      { name: 'Taller I: Funciones del Producto', semesterLevel: 2 },
      { name: 'Análisis Matemático II', semesterLevel: 2 },
      { name: 'Física II', semesterLevel: 2 },
      // SEMESTRE 3
      { name: 'Historia y Teoría del Diseño', semesterLevel: 3 },
      { name: 'Técnicas de Presentación Digital', semesterLevel: 3 },
      { name: 'Álgebra Lineal', semesterLevel: 3 },
      { name: 'Ingeniería de los Materiales', semesterLevel: 3 },
      { name: 'Informática Industrial', semesterLevel: 3 },
      // SEMESTRE 4
      { name: 'Ergonomía en el Diseño', semesterLevel: 4 },
      { name: 'Diseño Asistido por Computador', semesterLevel: 4 },
      { name: 'Taller II: Diseño Conceptual', semesterLevel: 4 },
      { name: 'Análisis Numérico', semesterLevel: 4 },
      { name: 'Resistencia de Materiales y Mecanismos', semesterLevel: 4 },
      // SEMESTRE 5
      { name: 'Envases y Embalajes', semesterLevel: 5 },
      { name: 'Diseño Mecánico', semesterLevel: 5 },
      { name: 'Simulación de Prototipos', semesterLevel: 5 },
      { name: 'Ecuaciones Diferenciales', semesterLevel: 5 },
      { name: 'Fundamentos de Calor y Fluidos', semesterLevel: 5 },
      // SEMESTRE 6
      { name: 'Emprendimiento', semesterLevel: 6 },
      { name: 'Taller III: Diseño de Productos', semesterLevel: 6 },
      { name: 'Estadística y Probabilidades', semesterLevel: 6 },
      { name: 'Introducción a la Ing. Producción', semesterLevel: 6 },
      { name: 'Gestión de Operaciones', semesterLevel: 6 },
      // SEMESTRE 7
      { name: 'Legislación Laboral', semesterLevel: 7 },
      { name: 'Modelos y Simulación Numérica', semesterLevel: 7 },
      { name: 'Procesos de Manufactura', semesterLevel: 7 },
      { name: 'Gestión de la Calidad Total', semesterLevel: 7 },
      { name: 'Diseño Sustentable', semesterLevel: 7 },
      // SEMESTRE 8
      { name: 'Taller IV: Desarrollo Productos', semesterLevel: 8 },
      { name: 'Optimización y Simulación Procesos', semesterLevel: 8 },
      { name: 'Higiene y Seguridad Industrial', semesterLevel: 8 },
      { name: 'Desarrollo Sostenible', semesterLevel: 8 },
      { name: 'Ecología Industrial', semesterLevel: 8 },
      // SEMESTRE 9
      { name: 'Metodología de la Investigación', semesterLevel: 9 },
      { name: 'Fabricación e Ingeniería Asistida', semesterLevel: 9 },
      { name: 'Gestión del Diseño e Innovación', semesterLevel: 9 },
      { name: 'Eficiencia Energética', semesterLevel: 9 },
      // SEMESTRE 10
      { name: 'Ingeniería Económica y Financiera', semesterLevel: 10 },
      { name: 'Taller V: Proyectos de Diseño', semesterLevel: 10 }
    ]
  }
];

async function main() {
  console.log('🌱 Iniciando carga COMPLETA de mallas FICA - ingenIA-Q...');

  // 1. Limpieza de base de datos para evitar duplicados
  await prisma.enrollment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.parallel.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.career.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academicPeriod.deleteMany();

  // 2. Crear las Carreras y sus Materias
  for (const careerInfo of CARRERAS_COMPLETAS) {
    console.log(`📚 Procesando carrera: ${careerInfo.name}`);

    await prisma.career.create({
      data: {
        name: careerInfo.name,
        totalSemesters: careerInfo.totalSemesters,
        subjects: {
          create: careerInfo.subjects
        }
      }
    });
    console.log(`   -> ✅ Se insertaron ${careerInfo.subjects.length} materias correctamente.`);
  }

  // 3. Crear Usuarios (Admin, Estudiante, Docente)
  const hashedPassword = await bcrypt.hash('admin123', 10); // Contraseña para todos

  // -- ADMIN
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fica.edu.ec',
      fullName: 'Administrador FICA',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`👤 Usuario Admin: ${adminUser.email}`);

  // -- DOCENTE (Nuevo Agregado)
  const teacherUser = await prisma.user.create({
    data: {
      email: 'profe@fica.edu.ec',
      fullName: 'Ing. Roberto Dávila',
      password: hashedPassword,
      role: 'TEACHER',
    }
  });
  console.log(`👨‍🏫 Usuario Docente: ${teacherUser.email}`);


  // -- ESTUDIANTE
  const sistemasCareer = await prisma.career.findFirst({
    where: { name: { contains: 'Sistemas' } }
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'estudiante@fica.edu.ec',
      fullName: 'Juan Pérez',
      password: hashedPassword,
      role: 'STUDENT',
      careerId: sistemasCareer?.id
    },
  });
  console.log(`🎓 Usuario Estudiante: ${studentUser.email}`);

  // 4. CREAR PERIODO ACADÉMICO
  console.log('📅 Creando Periodo Académico...');
  const periodoActual = await prisma.academicPeriod.create({
    data: {
      name: '2026-A',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-05-20'),
      isActive: true,
    }
  });

  // 5. SIMULAR HISTORIAL Y CREAR HORARIOS PARA ESTUDIANTE
  const materiasSistemas = await prisma.subject.findMany({
    where: { careerId: sistemasCareer?.id }
  });

  console.log('📝 Creando historial, horarios y asignando al docente...');
  const dias = [1, 2, 3, 4, 5]; // Lunes a Viernes

  for (const materia of materiasSistemas) {
    let estado = 'PENDING';
    let nota = null;

    if (materia.semesterLevel < 3) {
      estado = 'APPROVED';
      nota = parseFloat((Math.random() * (10 - 7) + 7).toFixed(1));
    } else if (materia.semesterLevel === 3) {
      estado = 'TAKING';
    }

    // A. CREAR MATRÍCULA
    if (estado !== 'PENDING') {
      await prisma.enrollment.create({
        data: {
          userId: studentUser.id,
          subjectId: materia.id,
          status: estado as any,
          finalGrade: nota
        }
      });
    }

    // B. CREAR HORARIOS Y PARALELOS (Solo para las que está cursando)
    if (estado === 'TAKING') {
      // Creamos el paralelo y ASIGNAMOS AL DOCENTE CREADO
      const paralelo = await prisma.parallel.create({
        data: {
          code: 'A',
          subjectId: materia.id,
          periodId: periodoActual.id,
          capacity: 30,
          teacherId: teacherUser.id // <--- ¡AQUÍ ESTÁ LA MAGIA! Asignamos al Ing. Dávila
        }
      });

      // C. CREAR ESTRUCTURA DE EVALUACIÓN ESTÁTICA
      console.log('📊 Creando estructura de evaluación estática...');

      await prisma.activity.createMany({
        data: [
          {
            name: "Gestión Individual (Talleres/Deberes)",
            type: "INDIVIDUAL",
            maxScore: 7.0,
            parallelId: paralelo.id
          },
          {
            name: "Gestión Grupal (Proyectos)",
            type: "GRUPAL",
            maxScore: 5.0,
            parallelId: paralelo.id
          },
          {
            name: "Examen Medio Semestre",
            type: "MEDIO",
            maxScore: 2.0,
            parallelId: paralelo.id
          },
          {
            name: "Examen Final",
            type: "FINAL",
            maxScore: 6.0,
            parallelId: paralelo.id
          }
        ]
      });

      const dia1 = dias[Math.floor(Math.random() * dias.length)];
      let dia2 = dias[Math.floor(Math.random() * dias.length)];
      while (dia1 === dia2) dia2 = dias[Math.floor(Math.random() * dias.length)];

      const horas = ["07:00", "09:00", "11:00", "14:00", "16:00"];
      const horaInicio = horas[Math.floor(Math.random() * horas.length)];

      const horaFinNum = parseInt(horaInicio.split(':')[0]) + 2;
      const horaFin = `${horaFinNum < 10 ? '0' : ''}${horaFinNum}:00`;

      await prisma.schedule.create({
        data: { dayOfWeek: dia1, startTime: horaInicio, endTime: horaFin, parallelId: paralelo.id }
      });

      await prisma.schedule.create({
        data: { dayOfWeek: dia2, startTime: horaInicio, endTime: horaFin, parallelId: paralelo.id }
      });
    }
  }

  console.log('✅ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });