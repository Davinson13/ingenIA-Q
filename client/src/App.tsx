import { Routes, Route, Navigate } from 'react-router-dom'; // Quitamos BrowserRouter
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/shared/MainLayout';
// CORRECCIÓN: Importar desde la carpeta shared, no auth
import { ProtectedRoute } from './components/shared/ProtectedRoute'; 

// Páginas Estudiante
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubjectsPage } from './pages/student/SubjectsPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { AiTutorPage } from './pages/student/AiTutorPage';

// Páginas Docente
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage';
import { TeacherGradesPage } from './pages/teacher/TeacherGradesPage';
// Puedes importar las otras páginas cuando las crees realmente
// import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage'; 

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
          <Route path="subjects" element={<SubjectsPage />} />
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

          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCoursesPage />} />
          <Route path="activities" element={<div className="p-10">Actividades (En construcción)</div>} />
          <Route path="grades" element={<TeacherGradesPage />} />
          {/* Reutilizamos el calendario de estudiantes por ahora */}
          <Route path="calendar" element={<CalendarPage />} /> 
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