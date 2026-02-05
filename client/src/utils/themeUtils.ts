// client/src/utils/themeUtils.ts

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface ThemePalette {
    primary: string;       // Main buttons, strong headers
    primaryHover: string;  // Button hover states
    secondary: string;     // Soft backgrounds, badges
    text: string;          // Highlighted text color
    border: string;        // Borders for highlighted elements
    gradient: string;      // Gradient class for large headers/banners
    icon: string;          // Icon specific colors
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
        gradient: 'from-purple-700 to-pink-600', // Distinct gradient
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

/**
 * Retrieves the color theme palette based on the user's role.
 * Falls back to the STUDENT theme if the role is undefined or invalid.
 * * @param role - The current user's role ('STUDENT', 'TEACHER', 'ADMIN')
 * @returns The ThemePalette object containing Tailwind classes.
 */
export const getTheme = (role: UserRole): ThemePalette => {
    return ROLE_THEMES[role] || ROLE_THEMES.STUDENT;
};