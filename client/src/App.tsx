import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/shared/MainLayout';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubjectsPage } from './pages/student/SubjectsPage';
import { CalendarPage } from './pages/student/CalendarPage';
import { AiTutorPage } from './pages/student/AiTutorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas Privadas (Protegidas por MainLayout) */}
        <Route path="/dashboard" element={<MainLayout />}>
          
          {/* Dashboard Principal */}
          <Route index element={<StudentDashboard />} />
          
          {/* Mis Materias (Aquí estaba el error, ahora usamos el componente) */}
          <Route path="subjects" element={<SubjectsPage />} /> 
          
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="ai-tutor" element={<AiTutorPage />} />
          
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;