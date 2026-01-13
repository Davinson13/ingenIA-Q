import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definimos qué forma tiene el Usuario
interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

// Definimos qué acciones tiene nuestro "Almacén"
interface AuthState {
  token: string | null;
  user: User | null;
  isAuth: boolean;
  setLogin: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuth: false,

      // Acción: Cuando el usuario se loguea
      setLogin: (token, user) => set({ token, user, isAuth: true }),

      // Acción: Cerrar sesión (borra todo)
      logout: () => set({ token: null, user: null, isAuth: false }),
    }),
    {
      name: 'ingeniaq-storage', // Nombre con el que se guarda en el navegador
    }
  )
);