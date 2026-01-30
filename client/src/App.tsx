import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/shared/MainLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { VerifyPage } from './pages/auth/VerifyPage';

// Páginas Estudiante
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CalendarPage } from './pages/student/CalendarPage';
import { AiTutorPage } from './pages/student/AiTutorPage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage';
import { StudentCourseDetail } from './pages/student/StudentCourseDetail';
import { StudentTutoringPage } from './pages/student/StudentTutoringPage';


// Páginas Docente
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage';
import { TeacherGradesPage } from './pages/teacher/TeacherGradesPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { TeacherCalendar } from './pages/teacher/TeacherCalendar';
import { TeacherCourseDetail } from './pages/teacher/TeacherCourseDetail';
import { TeacherActivityGradePage } from './pages/teacher/TeacherActivityGradePage';
import { TeacherTutoring } from './pages/teacher/TeacherTutoring';

// 🔥 PÁGINAS ADMIN (NUEVAS IMPORTACIONES)
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPeriodsPage } from './pages/admin/AdminPeriodsPage';
import { AdminAcademicPage } from './pages/admin/AdminAcademicPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';


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
          <Route path="/dashboard/tutorings" element={<StudentTutoringPage />} />
        </Route>
      </Route>


      {/*Guest*/}

      {/* 1. RUTA PÚBLICA */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />

      {/* Si quieres que sea la principal temporalmente, cambia la redirección del root: */}
      <Route path="/" element={<Navigate to="/login" replace />} />

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
          <Route path="calendar" element={<TeacherCalendar />} />
          <Route path="/teacher/course/:courseId/activity/:activityId/grade" element={<TeacherActivityGradePage />} />
          <Route
            path="/teacher/tutorings" element={<TeacherTutoring />}
          />
        </Route>
      </Route>

      {/* ======================================================= */}
      {/* 4. AREA DE ADMIN (ACTUALIZADA)                          */}
      {/* ======================================================= */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          {/* Rutas reales del Admin */}
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="periods" element={<AdminPeriodsPage />} />
          <Route path="academic" element={<AdminAcademicPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* Ruta 404 - Cualquier otra cosa va al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}

export default App;