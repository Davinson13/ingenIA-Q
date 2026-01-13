import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, user, token } = useAuthStore();
  const location = useLocation();

  // --- ZONA DE DIAGNÓSTICO (Borrar luego) ---
  console.log(`🛡️ GUARDIA en ${location.pathname}:`);
  console.log("   - Autenticado:", isAuthenticated);
  console.log("   - Token existe:", !!token);
  console.log("   - Usuario:", user?.fullName);
  console.log("   - Rol del Usuario:", user?.role);
  console.log("   - Roles Permitidos aquí:", allowedRoles);
  // -------------------------------------------

  // 1. CHEQUEO DE CREDENCIALES
  if (!isAuthenticated || !token) {
    console.log("🔴 ACCESO DENEGADO: No estás logueado. Volviendo al login.");
    return <Navigate to="/login" replace />;
  }

  // 2. CHEQUEO DE ROL (Permisos)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log(`🔴 ACCESO DENEGADO: Tu rol ${user.role} no está en la lista permitida ${allowedRoles}`);
    return <Navigate to="/dashboard" replace />;
  }

  // 3. PASE USTED
  console.log("🟢 ACCESO CONCEDIDO");
  return <Outlet />;
};