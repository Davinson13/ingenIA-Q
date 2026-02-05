import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  allowedRoles?: string[];
}

/**
 * ProtectedRoute Component
 * Handles authentication checks and role-based access control.
 * It acts as a gatekeeper for routes that require login or specific permissions.
 */
export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { isAuthenticated, user, token } = useAuthStore();

  // 1. CREDENTIALS CHECK
  // If the user is not authenticated or no token is present, redirect to the login page.
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // 2. ROLE CHECK (Permissions)
  // If the route requires specific roles and the authenticated user doesn't possess them:
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    
    // CRITICAL REDIRECTION LOGIC:
    // Redirect the user to their appropriate dashboard based on their role 
    // to prevent navigation loops or unauthorized access attempts.
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;

    // Default fallback for Students or unknown roles
    return <Navigate to="/dashboard" replace />;
  }

  // 3. ACCESS GRANTED
  // If all checks pass, render the child routes (the requested page).
  return <Outlet />;
};