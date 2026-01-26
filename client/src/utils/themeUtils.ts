// client/src/utils/themeUtils.ts

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

interface ThemePalette {
    primary: string;       // Botones principales, headers fuertes
    primaryHover: string;  // Hover de botones
    secondary: string;     // Fondos suaves, badges
    text: string;          // Texto destacado
    border: string;        // Bordes de elementos destacados
    gradient: string;      // Para los encabezados grandes
    icon: string;          // Color de iconos
}

export const ROLE_THEMES: Record<UserRole, ThemePalette> = {
    STUDENT: {
        primary: 'bg-indigo-600',
        primaryHover: 'hover:bg-indigo-700',
        secondary: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        gradient: 'from-indigo-600 to-blue-500',
        icon: 'text-indigo-500'
    },
    TEACHER: {
        primary: 'bg-purple-600',
        primaryHover: 'hover:bg-purple-700',
        secondary: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        gradient: 'from-purple-700 to-pink-600', // Un gradiente más distintivo
        icon: 'text-purple-500'
    },
    ADMIN: {
        primary: 'bg-emerald-600',
        primaryHover: 'hover:bg-emerald-700',
        secondary: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        gradient: 'from-slate-800 to-emerald-800',
        icon: 'text-emerald-600'
    }
};

// Hook simple para obtener colores (puedes usarlo directamente o como función)
export const getTheme = (role: UserRole) => {
    return ROLE_THEMES[role] || ROLE_THEMES.STUDENT;
};