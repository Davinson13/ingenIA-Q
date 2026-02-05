import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- INTERFACES ---

export interface User {
    id: number;
    fullName: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    careerId?: number; // Optional: Only relevant for students
    provider?: string; // Optional: e.g., 'google' or 'local'
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean; 
    login: (token: string, user: User) => void;
    logout: () => void;
}

/**
 * useAuthStore
 * Global state management for User Authentication using Zustand.
 * Persists data to localStorage to keep the user logged in on refresh.
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // Initial State
            token: null,
            user: null,
            isAuthenticated: false,

            // Action: Log in the user
            login: (token, user) => set({ 
                token, 
                user, 
                isAuthenticated: true 
            }),

            // Action: Log out (Clear session)
            logout: () => set({ 
                token: null, 
                user: null, 
                isAuthenticated: false 
            }),
        }),
        {
            name: 'ingeniaq-auth', // Key used in LocalStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);