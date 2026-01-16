import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, user, token } = useAuthStore();

  // 1. Si no está logueado, al Login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si tiene el rol incorrecto, redirigir a SU dashboard correspondiente
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    // Por defecto (Estudiantes)
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Acceso concedido
  return <Outlet />;
};