import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Bot,
  LogOut,
  X,
  Users,
  Search,
  Settings,
  Library,
  FileClock,
  Map,
} from 'lucide-react';

/**
 * Interface for Theme Configuration.
 * Defines the color palette and styling classes for different user roles (Student, Teacher, Admin).
 */
interface ThemeConfig {
  sidebarBg: string;
  borderColor: string;
  headerBg: string;
  logoGradient: string;
  activeItem: string;
  badge: string;
  roleLabel: string;
}

/**
 * Interface for Menu Items.
 * Represents a single navigation link in the sidebar menu.
 */
interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType; // Correct type for passing React components (icons) as props
  highlight?: boolean;     // Optional: highlights special features like AI tools
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar Component
 * Renders the main vertical navigation menu. 
 * It dynamically adapts its colors, menu items, and links based on the 
 * authenticated user's role (Student, Teacher, Admin).
 * It supports mobile responsive toggling via the `isOpen` prop.
 */
export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  // --- Menu Definitions ---

  const studentMenus: MenuItem[] = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Calendar', path: '/dashboard/calendar', icon: CalendarDays },
    { label: 'My Subjects', path: '/dashboard/subjects', icon: BookOpen },
    { label: 'Find Tutor', path: '/dashboard/tutorings', icon: Search },
    { label: 'AI Tutor', path: '/dashboard/ai-tutor', icon: Bot, highlight: true },
    { label: 'Course Catalog', path: '/dashboard/catalog', icon: Library },
    { label: 'History', path: '/dashboard/history', icon: FileClock },
    { label: 'Curriculum', path: '/dashboard/mesh', icon: Map },
  ];

  const teacherMenus: MenuItem[] = [
    { label: 'Teacher Panel', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', path: '/teacher/courses', icon: BookOpen },
    { label: 'My Agenda', path: '/teacher/calendar', icon: CalendarDays },
    { label: 'Tutoring', path: '/teacher/tutorings', icon: Users },
  ];

  const adminMenus: MenuItem[] = [
    { label: 'Admin Panel', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Periods', path: '/admin/periods', icon: CalendarDays },
    { label: 'Academic Mgmt', path: '/admin/academic', icon: BookOpen },
    { label: 'Users', path: '/admin/users', icon: Users },
  ];

  // --- Role Logic ---
  // Determine which menu set and profile path to use based on the user's role.
  let menus = studentMenus;
  let profilePath = '/dashboard/profile'; // Default path for Students

  if (user?.role === 'TEACHER') {
    menus = teacherMenus;
    profilePath = '/teacher/profile';
  }
  if (user?.role === 'ADMIN') {
    menus = adminMenus;
    profilePath = '/admin/profile';
  }

  // --- Theme Configuration ---
  // Maps user roles to specific CSS classes (Tailwind) for dynamic styling of the sidebar.
  const themeMap: Record<string, ThemeConfig> = {
    STUDENT: {
      sidebarBg: "bg-slate-900",
      borderColor: "border-slate-800",
      headerBg: "bg-slate-800/50",
      logoGradient: "from-blue-400 to-teal-400",
      activeItem: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      roleLabel: "Student"
    },
    TEACHER: {
      sidebarBg: "bg-[#1a1625]",
      borderColor: "border-purple-900/30",
      headerBg: "bg-purple-900/10",
      logoGradient: "from-purple-400 to-pink-400",
      activeItem: "bg-purple-600 text-white shadow-lg shadow-purple-500/20",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      roleLabel: "Teacher"
    },
    ADMIN: {
      sidebarBg: "bg-slate-950",
      borderColor: "border-emerald-900/30",
      headerBg: "bg-emerald-900/10",
      logoGradient: "from-emerald-400 to-cyan-400",
      activeItem: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      roleLabel: "Administrator"
    }
  };

  // Fallback to STUDENT theme if role is undefined or not found
  const themeConfig = themeMap[user?.role || 'STUDENT'];

  return (
    <>
      {/* Mobile Overlay */}
      {/* Background shade for mobile menu when open */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar Container */}
      <aside
        className={clsx(
          "fixed left-0 top-0 h-screen w-64 text-white flex flex-col transition-transform duration-300 z-50 shadow-2xl border-r",
          themeConfig.sidebarBg,
          themeConfig.borderColor,
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >

        {/* Header Section */}
        {/* Contains Logo and Role Label */}
        <div className={clsx("p-6 border-b flex justify-between items-center backdrop-blur-sm", themeConfig.borderColor, themeConfig.headerBg)}>
          <div>
            <h1 className={clsx("text-2xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent", themeConfig.logoGradient)}>
              ingenIA-Q
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              {themeConfig.roleLabel}
            </p>
          </div>

          {/* Close Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info Card (Clickable to Profile) */}
        {/* Displays user avatar and name, links to profile page */}
        <div className="px-6 py-6">
          <Link
            to={profilePath}
            onClick={onClose}
            className={clsx(
              "rounded-xl p-4 border flex items-center gap-3 transition-all duration-200 group relative overflow-hidden",
              "hover:bg-white/10 hover:shadow-lg hover:border-white/20 cursor-pointer",
              themeConfig.headerBg,
              themeConfig.borderColor
            )}
          >
            {/* User Avatar Initials */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-inner shrink-0
              ${user?.role === 'ADMIN' ? 'bg-emerald-600' : user?.role === 'TEACHER' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>

            {/* User Details */}
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-white/90 transition-colors">
                {user?.fullName}
              </p>
              <div className="flex items-center justify-between">
                <span className={clsx(
                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded border mt-1 inline-block truncate",
                  themeConfig.badge
                )}>
                  {themeConfig.roleLabel}
                </span>

                {/* Settings Icon (Visible on Hover) */}
                <Settings size={14} className="text-white/30 group-hover:text-white transition-colors mt-1" />
              </div>
            </div>
          </Link>

          <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
            Click card to view profile
          </p>
        </div>

        {/* Dynamic Navigation Menu */}
        {/* Renders the list of links based on user role */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menus.map((item) => {
            const Icon = item.icon;

            // Logic to determine if a menu item is active, including sub-routes handling
            let isActive = location.pathname === item.path;
            if (item.path === '/teacher/courses' && location.pathname.startsWith('/teacher/course/')) isActive = true;
            if (item.path === '/dashboard/subjects' && location.pathname.startsWith('/dashboard/course/')) isActive = true;
            if (item.path === '/admin/academic' && location.pathname.startsWith('/admin/academic')) isActive = true;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                  isActive
                    ? themeConfig.activeItem
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                  // Special highlight styling (e.g., for AI Tutor)
                  !isActive && item.highlight && "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 hover:shadow-indigo-900/10"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"></div>
                )}
                <Icon size={20} className={clsx(isActive ? "text-white" : item.highlight ? "text-indigo-400" : "text-slate-500 group-hover:text-white")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout Section */}
        {/* Fixed at the bottom of sidebar */}
        <div className={clsx("p-4 border-t", themeConfig.borderColor)}>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};