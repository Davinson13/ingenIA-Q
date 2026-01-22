import { Routes, Route, Navigate } from 'react-router-dom'; // Quitamos BrowserRouter
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/shared/MainLayout';
// CORRECCIÓN: Importar desde la carpeta shared, no auth
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Páginas Estudiante
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CalendarPage } from './pages/student/CalendarPage';
import { AiTutorPage } from './pages/student/AiTutorPage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage'; 
import { StudentCourseDetail } from './pages/student/StudentCourseDetail';


// Páginas Docente
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage';
import { TeacherGradesPage } from './pages/teacher/TeacherGradesPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { TeacherCalendarPage } from './pages/teacher/TeacherCalendarPage';
import { TeacherCourseDetail } from './pages/teacher/TeacherCourseDetail';
import { TeacherActivityGradePage } from './pages/teacher/TeacherActivityGradePage';

// Puedes importar las otras páginas cuando las crees realmente

function App() {
  return (
    // YA NO USAMOS <BrowserRouter> AQUÍ (Está en main.tsx)
    <Routes>
      {/* 1. RUTA PÚBLICA (Login) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ======================================================= */}
      {/* 2. AREA DE ESTUDIANTES (Ruta base: /dashboard)          */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="subjects" element={<StudentCoursesPage />} />
          <Route path="course/:id" element={<StudentCourseDetail />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
        </Route>
      </Route>

      {/* ======================================================= */}
      {/* 3. AREA DE DOCENTES (Ruta base: /teacher)               */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']} />}>
        <Route path="/teacher" element={<MainLayout />}>
          {/* Redirigir /teacher directo al dashboard */}
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="course/:id" element={<TeacherCourseDetail />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCoursesPage />} />
          <Route path="grades" element={<TeacherGradesPage />} />
          <Route path="course/:id" element={<TeacherCourseDetail />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="calendar" element={<TeacherCalendarPage />} />
          <Route path="/teacher/course/:courseId/activity/:activityId/grade" element={<TeacherActivityGradePage />}/>
        </Route>
      </Route>

      {/* ======================================================= */}
      {/* 4. AREA DE ADMIN (Ruta base: /admin)                    */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<div className="p-10">Panel Admin (Próximamente)</div>} />
        </Route>
      </Route>

      {/* Ruta 404 - Cualquier otra cosa va al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;