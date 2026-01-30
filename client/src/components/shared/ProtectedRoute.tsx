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
    // 🔥 CORRECCIÓN CRÍTICA: Romper el bucle redirigiendo al dashboard CORRECTO
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;

    // Solo si es estudiante (o rol desconocido) lo mandamos al dashboard de estudiante
    return <Navigate to="/dashboard" replace />;
  }

  // 3. PASE USTED
  return <Outlet />;
};