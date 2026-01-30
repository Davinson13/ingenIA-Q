import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, user, token } = useAuthStore();
  

  // 1. CHEQUEO DE CREDENCIALES
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // 2. CHEQUEO DE ROL (Permisos)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // 🔥 CORRECCIÓN: Redirigir a SU propio dashboard según quién sea
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/dashboard" replace />; // Default Estudiante
  }

  // 3. PASE USTED
  return <Outlet />;
};