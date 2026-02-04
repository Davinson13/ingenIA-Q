import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  careerId?: number;
  provider?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean; // <--- CAMBIADO: Antes era isAuth
  login: (token: string, user: User) => void; // <--- CAMBIADO: Antes era setLogin
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false, // <--- CAMBIADO

      // Acción: Cuando el usuario se loguea
      login: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true 
      }),

      // Acción: Cerrar sesión (borra todo)
      logout: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'ingeniaq-auth', // Nombre en LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);