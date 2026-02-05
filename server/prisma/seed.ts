import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --------------------------------------------------------
// CURRICULUM DATA (FICA - UCE)
// Translated to English for consistency
// --------------------------------------------------------

const COMPLETE_CAREERS = [
  {
    name: 'Computer Engineering', // Ingeniería en Computación
    totalSemesters: 10,
    subjects: [
      // SEMESTER 1
      { name: 'Analysis I', semesterLevel: 1 },
      { name: 'Math Fundamentals', semesterLevel: 1 },
      { name: 'Programming I', semesterLevel: 1 },
      { name: 'Intro to Computer Science', semesterLevel: 1 },
      { name: 'National Reality', semesterLevel: 1 },
      // SEMESTER 2
      { name: 'Analysis II', semesterLevel: 2 },
      { name: 'Linear Algebra I', semesterLevel: 2 },
      { name: 'Programming II', semesterLevel: 2 },
      { name: 'Physics', semesterLevel: 2 },
      { name: 'Oral & Written Communication', semesterLevel: 2 },
      // SEMESTER 3
      { name: 'Probability & Basic Statistics', semesterLevel: 3 },
      { name: 'Analysis III', semesterLevel: 3 },
      { name: 'Linear Algebra II', semesterLevel: 3 },
      { name: 'Data Structures', semesterLevel: 3 },
      { name: 'Physics for CS', semesterLevel: 3 },
      // SEMESTER 4
      { name: 'Differential Equations', semesterLevel: 4 },
      { name: 'Numerical Analysis', semesterLevel: 4 },
      { name: 'Discrete Mathematics', semesterLevel: 4 },
      { name: 'Databases I', semesterLevel: 4 },
      { name: 'Software Architecture', semesterLevel: 4 },
      // SEMESTER 5
      { name: 'Statistical Inference', semesterLevel: 5 },
      { name: 'Databases II', semesterLevel: 5 },
      { name: 'Advanced Programming I', semesterLevel: 5 },
      { name: 'Software Design Patterns', semesterLevel: 5 },
      { name: 'Architecture & OS', semesterLevel: 5 },
      { name: 'Scientific Research Methodology', semesterLevel: 5 },
      // SEMESTER 6
      { name: 'Optimization & Simulation', semesterLevel: 6 },
      { name: 'Artificial Intelligence', semesterLevel: 6 },
      { name: 'Advanced Programming II', semesterLevel: 6 },
      { name: 'Network Protocols', semesterLevel: 6 },
      { name: 'Innovation & Entrepreneurship', semesterLevel: 6 },
      // SEMESTER 7
      { name: 'Machine Learning', semesterLevel: 7 },
      { name: 'Advanced Programming III', semesterLevel: 7 },
      { name: 'Graphic Visualization', semesterLevel: 7 },
      { name: 'Software Engineering', semesterLevel: 7 },
      { name: 'Applied Research', semesterLevel: 7 },
      // SEMESTER 8
      { name: 'Mobile Devices', semesterLevel: 8 },
      { name: 'Cryptography & Security', semesterLevel: 8 },
      { name: 'Web Programming', semesterLevel: 8 },
      { name: 'Game Development Fundamentals', semesterLevel: 8 },
      { name: 'ICT Governance', semesterLevel: 8 },
      { name: 'Workshop 1', semesterLevel: 8 },
      // SEMESTER 9
      { name: 'Data Mining', semesterLevel: 9 },
      { name: 'Collaborative Systems', semesterLevel: 9 },
      { name: 'Concurrent & Parallel Programming', semesterLevel: 9 },
      { name: 'Game Project', semesterLevel: 9 },
      { name: 'Workshop 2', semesterLevel: 9 },
      // SEMESTER 10
      { name: 'Graduation Project', semesterLevel: 10 },
      { name: 'Distributed Programming', semesterLevel: 10 },
      { name: 'Grid & Cloud Computing', semesterLevel: 10 },
      { name: 'Workshop 3', semesterLevel: 10 }
    ]
  },
  {
    name: 'Civil Engineering', // Ingeniería Civil
    totalSemesters: 10,
    subjects: [
      // SEMESTER 1
      { name: 'Differential Calculus', semesterLevel: 1 },
      { name: 'CAD Drawing', semesterLevel: 1 },
      { name: 'Programming 1', semesterLevel: 1 },
      { name: 'Materials Chemistry', semesterLevel: 1 },
      { name: 'Physics 1', semesterLevel: 1 },
      { name: 'Topography 1', semesterLevel: 1 },
      { name: 'National Reality', semesterLevel: 1 },
      // SEMESTER 2
      { name: 'Integral Calculus', semesterLevel: 2 },
      { name: 'Statics', semesterLevel: 2 },
      { name: 'Programming 2', semesterLevel: 2 },
      { name: 'Statistics', semesterLevel: 2 },
      { name: 'Physics 2', semesterLevel: 2 },
      { name: 'Topography 2', semesterLevel: 2 },
      { name: 'Scientific Research', semesterLevel: 2 },
      // SEMESTER 3
      { name: 'Differential Equations', semesterLevel: 3 },
      { name: 'Strength of Materials 1', semesterLevel: 3 },
      { name: 'Dynamics', semesterLevel: 3 },
      { name: 'Materials Testing 1', semesterLevel: 3 },
      { name: 'Hydraulics 1', semesterLevel: 3 },
      { name: 'Layout', semesterLevel: 3 },
      { name: 'Geology', semesterLevel: 3 },
      // SEMESTER 4
      { name: 'Numerical Methods', semesterLevel: 4 },
      { name: 'Strength of Materials 2', semesterLevel: 4 },
      { name: 'Basic Hydrology', semesterLevel: 4 },
      { name: 'Materials Testing 2', semesterLevel: 4 },
      { name: 'Hydraulics 2', semesterLevel: 4 },
      { name: 'Environmental Sanitation', semesterLevel: 4 },
      { name: 'Soil Mechanics 1', semesterLevel: 4 },
      // SEMESTER 5
      { name: 'Architectural Conception', semesterLevel: 5 },
      { name: 'Structures 1', semesterLevel: 5 },
      { name: 'Applied Hydrology', semesterLevel: 5 },
      { name: 'Reinforced Concrete 1', semesterLevel: 5 },
      { name: 'Hydraulic Design 1', semesterLevel: 5 },
      { name: 'Hydrosanitary Installations', semesterLevel: 5 },
      { name: 'Soil Mechanics 2', semesterLevel: 5 },
      // SEMESTER 6
      { name: 'Constructions 1', semesterLevel: 6 },
      { name: 'Structures 2', semesterLevel: 6 },
      { name: 'Electrical Installations', semesterLevel: 6 },
      { name: 'Reinforced Concrete 2', semesterLevel: 6 },
      { name: 'Hydraulic Design 2', semesterLevel: 6 },
      { name: 'Potable Water', semesterLevel: 6 },
      { name: 'Soil Mechanics 3', semesterLevel: 6 },
      { name: 'Leadership', semesterLevel: 6 },
      // SEMESTER 7
      { name: 'Constructions 2', semesterLevel: 7 },
      { name: 'Structures 3', semesterLevel: 7 },
      { name: 'Metallic Structures', semesterLevel: 7 },
      { name: 'Reinforced Concrete 3', semesterLevel: 7 },
      { name: 'Communication Routes', semesterLevel: 7 },
      { name: 'Sewerage', semesterLevel: 7 },
      { name: 'Geotechnics', semesterLevel: 7 },
      // SEMESTER 8
      { name: 'Research & Innovation', semesterLevel: 8 },
      { name: 'Civil Works', semesterLevel: 8 },
      { name: 'Engineering Economics', semesterLevel: 8 },
      { name: 'Traffic Engineering', semesterLevel: 8 },
      { name: 'Environmental Impact', semesterLevel: 8 },
      { name: 'Sanitary Chemistry', semesterLevel: 8 },
      { name: 'Pavements', semesterLevel: 8 },
      { name: 'Business Administration', semesterLevel: 8 },
      // SEMESTER 9
      { name: 'Applied Legislation', semesterLevel: 9 },
      { name: 'Bridges', semesterLevel: 9 },
      { name: 'Budget & Programming', semesterLevel: 9 },
      { name: 'Process Optimization', semesterLevel: 9 },
      { name: 'Dam Design', semesterLevel: 9 },
      { name: 'Graduation Project Plan', semesterLevel: 9 },
      // SEMESTER 10
      { name: 'Project Formulation & Eval', semesterLevel: 10 },
      { name: 'Seismic Resistant Design', semesterLevel: 10 },
      { name: 'Administration & Oversight', semesterLevel: 10 },
      { name: 'Graduation Project Seminar', semesterLevel: 10 },
      { name: 'Graduation Project', semesterLevel: 10 },
      { name: 'Electives', semesterLevel: 10 }
    ]
  },
  {
    name: 'Information Systems Engineering', // Ingeniería en Sistemas de Información
    totalSemesters: 10,
    subjects: [
      // SEMESTER 1
      { name: 'Math Fundamentals', semesterLevel: 1 },
      { name: 'Analysis I', semesterLevel: 1 },
      { name: 'Programming I', semesterLevel: 1 },
      { name: 'IS Fundamentals', semesterLevel: 1 },
      { name: 'Applied Physics', semesterLevel: 1 },
      // SEMESTER 2
      { name: 'Discrete Mathematics', semesterLevel: 2 },
      { name: 'Analysis II', semesterLevel: 2 },
      { name: 'Linear Algebra', semesterLevel: 2 },
      { name: 'Programming II', semesterLevel: 2 },
      { name: 'New Technologies & Innovation', semesterLevel: 2 },
      { name: 'Communication & Language', semesterLevel: 2 },
      // SEMESTER 3
      { name: 'Probability & Statistics', semesterLevel: 3 },
      { name: 'Differential Equations', semesterLevel: 3 },
      { name: 'Data Structures', semesterLevel: 3 },
      { name: 'Computer Architecture', semesterLevel: 3 },
      { name: 'User Interfaces', semesterLevel: 3 },
      { name: 'Intro to Research', semesterLevel: 3 },
      // SEMESTER 4
      { name: 'Numerical Methods', semesterLevel: 4 },
      { name: 'Algorithms', semesterLevel: 4 },
      { name: 'Operating Systems I', semesterLevel: 4 },
      { name: 'IT Infrastructure I', semesterLevel: 4 },
      { name: 'Data Warehousing', semesterLevel: 4 },
      { name: 'Leadership', semesterLevel: 4 },
      // SEMESTER 5
      { name: 'Development Frameworks I', semesterLevel: 5 },
      { name: 'Operating Systems II', semesterLevel: 5 },
      { name: 'IT Infrastructure II', semesterLevel: 5 },
      { name: 'Data Management', semesterLevel: 5 },
      { name: 'Systems Analysis & Design', semesterLevel: 5 },
      // SEMESTER 6
      { name: 'Financial Accounting', semesterLevel: 6 },
      { name: 'Development Frameworks II', semesterLevel: 6 },
      { name: 'Data Analysis', semesterLevel: 6 },
      { name: 'Security & Risk Management', semesterLevel: 6 },
      { name: 'IS Development', semesterLevel: 6 },
      // SEMESTER 7
      { name: 'Economics Fundamentals', semesterLevel: 7 },
      { name: 'Web Programming', semesterLevel: 7 },
      { name: 'Business Intelligence', semesterLevel: 7 },
      { name: 'Applied Research', semesterLevel: 7 },
      { name: 'Software Architecture', semesterLevel: 7 },
      { name: 'Information Society', semesterLevel: 7 },
      // SEMESTER 8
      { name: 'IT Auditing', semesterLevel: 8 },
      { name: 'Distributed Programming', semesterLevel: 8 },
      { name: 'Data Mining', semesterLevel: 8 },
      { name: 'Operations Research', semesterLevel: 8 },
      { name: 'Software Quality Control', semesterLevel: 8 },
      // SEMESTER 9
      { name: 'Graduation (Formulation)', semesterLevel: 9 },
      { name: 'IT Legislation', semesterLevel: 9 },
      { name: 'Business Process Management', semesterLevel: 9 },
      { name: 'Operations Research Models', semesterLevel: 9 },
      { name: 'IS Project Management', semesterLevel: 9 },
      // SEMESTER 10
      { name: 'Graduation (Development)', semesterLevel: 10 },
      { name: 'Mobile Programming', semesterLevel: 10 },
      { name: 'Entrepreneurship Formation', semesterLevel: 10 },
      { name: 'Enterprise Information Systems', semesterLevel: 10 },
      { name: 'Acquisition Strategy', semesterLevel: 10 }
    ]
  },
  {
    name: 'Industrial Design', // Diseño Industrial
    totalSemesters: 10,
    subjects: [
      // SEMESTER 1
      { name: 'National Reality', semesterLevel: 1 },
      { name: 'Basic Design & Creativity', semesterLevel: 1 },
      { name: 'Artistic Drawing', semesterLevel: 1 },
      { name: 'Mathematical Analysis I', semesterLevel: 1 },
      { name: 'Physics I', semesterLevel: 1 },
      { name: 'Chemistry', semesterLevel: 1 },
      // SEMESTER 2
      { name: 'Oral & Written Expression', semesterLevel: 2 },
      { name: 'Design Methods', semesterLevel: 2 },
      { name: 'Technical Drawing', semesterLevel: 2 },
      { name: 'Workshop I: Product Functions', semesterLevel: 2 },
      { name: 'Mathematical Analysis II', semesterLevel: 2 },
      { name: 'Physics II', semesterLevel: 2 },
      // SEMESTER 3
      { name: 'History & Theory of Design', semesterLevel: 3 },
      { name: 'Digital Presentation Techniques', semesterLevel: 3 },
      { name: 'Linear Algebra', semesterLevel: 3 },
      { name: 'Materials Engineering', semesterLevel: 3 },
      { name: 'Industrial Computing', semesterLevel: 3 },
      // SEMESTER 4
      { name: 'Ergonomics in Design', semesterLevel: 4 },
      { name: 'Computer Aided Design', semesterLevel: 4 },
      { name: 'Workshop II: Conceptual Design', semesterLevel: 4 },
      { name: 'Numerical Analysis', semesterLevel: 4 },
      { name: 'Mechanisms & Strength of Materials', semesterLevel: 4 },
      // SEMESTER 5
      { name: 'Packaging', semesterLevel: 5 },
      { name: 'Mechanical Design', semesterLevel: 5 },
      { name: 'Prototype Simulation', semesterLevel: 5 },
      { name: 'Differential Equations', semesterLevel: 5 },
      { name: 'Heat & Fluids Fundamentals', semesterLevel: 5 },
      // SEMESTER 6
      { name: 'Entrepreneurship', semesterLevel: 6 },
      { name: 'Workshop III: Product Design', semesterLevel: 6 },
      { name: 'Statistics & Probability', semesterLevel: 6 },
      { name: 'Intro to Production Eng.', semesterLevel: 6 },
      { name: 'Operations Management', semesterLevel: 6 },
      // SEMESTER 7
      { name: 'Labor Legislation', semesterLevel: 7 },
      { name: 'Models & Numerical Simulation', semesterLevel: 7 },
      { name: 'Manufacturing Processes', semesterLevel: 7 },
      { name: 'Total Quality Management', semesterLevel: 7 },
      { name: 'Sustainable Design', semesterLevel: 7 },
      // SEMESTER 8
      { name: 'Workshop IV: Product Development', semesterLevel: 8 },
      { name: 'Process Optimization & Sim', semesterLevel: 8 },
      { name: 'Industrial Hygiene & Safety', semesterLevel: 8 },
      { name: 'Sustainable Development', semesterLevel: 8 },
      { name: 'Industrial Ecology', semesterLevel: 8 },
      // SEMESTER 9
      { name: 'Research Methodology', semesterLevel: 9 },
      { name: 'Manufacturing & CAE', semesterLevel: 9 },
      { name: 'Design Management & Innovation', semesterLevel: 9 },
      { name: 'Energy Efficiency', semesterLevel: 9 },
      // SEMESTER 10
      { name: 'Economic & Financial Engineering', semesterLevel: 10 },
      { name: 'Workshop V: Design Projects', semesterLevel: 10 }
    ]
  }
];

// --------------------------------------------------------
// MAIN SEED FUNCTION
// --------------------------------------------------------

async function main() {
  console.log('🌱 Starting COMPLETE database seed for FICA - ingenIA-Q...');

  // 1. DATABASE CLEANUP (Critical Order)
  // Delete tables with foreign keys first to avoid constraint errors
  console.log('🧹 Cleaning database...');
  await prisma.activityGrade.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.tutoringBooking.deleteMany();
  await prisma.tutoring.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.parallel.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.academicPeriod.deleteMany();
  // Delete users and careers last
  await prisma.user.deleteMany();
  await prisma.career.deleteMany();

  // 2. Create Careers and Subjects
  for (const careerInfo of COMPLETE_CAREERS) {
    console.log(`📚 Processing career: ${careerInfo.name}`);

    await prisma.career.create({
      data: {
        name: careerInfo.name,
        totalSemesters: careerInfo.totalSemesters,
        subjects: {
          create: careerInfo.subjects
        }
      }
    });
    console.log(`   -> ✅ Inserted ${careerInfo.subjects.length} subjects successfully.`);
  }

  // 3. Create Users (Admin, Teacher, Student)
  const hashedPassword = await bcrypt.hash('admin123', 10); // Default password for everyone

  // -- ADMIN
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fica.edu.ec',
      fullName: 'FICA Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true, // 🔥 MANDATORY
      provider: 'LOCAL'
    },
  });
  console.log(`👤 Admin User: ${adminUser.email}`);

  // -- TEACHER
  const teacherUser = await prisma.user.create({
    data: {
      email: 'profe@fica.edu.ec',
      fullName: 'Eng. Roberto Dávila',
      password: hashedPassword,
      role: 'TEACHER',
      isVerified: true, // 🔥 MANDATORY
      provider: 'LOCAL'
    }
  });
  console.log(`👨‍🏫 Teacher User: ${teacherUser.email}`);

  // -- STUDENT
  const systemsCareer = await prisma.career.findFirst({
    where: { name: { contains: 'Information Systems' } }
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@fica.edu.ec',
      fullName: 'Juan Pérez',
      password: hashedPassword,
      role: 'STUDENT',
      careerId: systemsCareer?.id,
      isVerified: true, // 🔥 MANDATORY
      provider: 'LOCAL'
    },
  });
  console.log(`🎓 Student User: ${studentUser.email}`);

  // 4. CREATE ACADEMIC PERIOD
  console.log('📅 Creating Academic Period...');
  const currentPeriod = await prisma.academicPeriod.create({
    data: {
      name: '2026-A',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-05-20'),
      isActive: true,
    }
  });

  // 5. SIMULATE HISTORY AND SCHEDULES FOR STUDENT
  const systemsSubjects = await prisma.subject.findMany({
    where: { careerId: systemsCareer?.id }
  });

  console.log('📝 Creating history, schedules, and assigning teacher...');
  const daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday

  for (const subject of systemsSubjects) {
    let status = 'PENDING';
    let grade = null;

    if (subject.semesterLevel < 3) {
      status = 'APPROVED';
      // 🔥 GRADE OUT OF 20: Generates between 14.0 and 20.0
      grade = parseFloat((Math.random() * (20 - 14) + 14).toFixed(1));
    } else if (subject.semesterLevel === 3) {
      status = 'TAKING';
    }

    // A. CREATE ENROLLMENT
    if (status !== 'PENDING') {
      await prisma.enrollment.create({
        data: {
          userId: studentUser.id,
          subjectId: subject.id,
          status: status as any,
          finalGrade: grade
        }
      });
    }

    // B. CREATE SCHEDULES AND PARALLELS (Only for current courses)
    if (status === 'TAKING') {
      // Create parallel and ASSIGN TEACHER
      const parallel = await prisma.parallel.create({
        data: {
          code: 'A',
          subjectId: subject.id,
          periodId: currentPeriod.id,
          capacity: 30,
          teacherId: teacherUser.id
        }
      });

      // C. CREATE STATIC EVALUATION STRUCTURE (TOTAL 20 POINTS)
      // console.log('📊 Creating static evaluation structure...');

      await prisma.activity.createMany({
        data: [
          {
            name: "Individual Work (Assignments/Workshops)",
            type: "INDIVIDUAL",
            maxScore: 6.0,
            parallelId: parallel.id
          },
          {
            name: "Group Work (Projects)",
            type: "GRUPAL",
            maxScore: 4.0,
            parallelId: parallel.id
          },
          {
            name: "Midterm Exam",
            type: "MEDIO",
            maxScore: 5.0,
            parallelId: parallel.id
          },
          {
            name: "Final Exam",
            type: "FINAL",
            maxScore: 5.0,
            parallelId: parallel.id
          }
          // TOTAL: 6 + 4 + 5 + 5 = 20 POINTS
        ]
      });

      const day1 = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
      let day2 = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
      while (day1 === day2) day2 = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];

      const hours = ["07:00", "09:00", "11:00", "14:00", "16:00"];
      const startTime = hours[Math.floor(Math.random() * hours.length)];

      const endHourNum = parseInt(startTime.split(':')[0]) + 2;
      const endTime = `${endHourNum < 10 ? '0' : ''}${endHourNum}:00`;

      await prisma.schedule.create({
        data: { dayOfWeek: day1, startTime: startTime, endTime: endTime, parallelId: parallel.id }
      });

      await prisma.schedule.create({
        data: { dayOfWeek: day2, startTime: startTime, endTime: endTime, parallelId: parallel.id }
      });
    }
  }

  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });