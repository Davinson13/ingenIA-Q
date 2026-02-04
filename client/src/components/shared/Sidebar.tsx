import { useAuthStore } from '../../store/authStore';
import { Link, useLocation } from 'react-router-dom';
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
import clsx from 'clsx';
import React from 'react';

// 1. DEFINIR TIPO PARA LOS ESTILOS DEL TEMA
interface ThemeConfig {
  sidebarBg: string;
  borderColor: string;
  headerBg: string;
  logoGradient: string;
  activeItem: string;
  badge: string;
  roleLabel: string;
}

// 2. CORREGIR INTERFAZ MENUITEM
interface MenuItem {
  label: string;
  path: string;
  // 👇 'ElementType' es el tipo correcto para un componente que se pasa como prop (ej: <Icon />)
  icon: React.ElementType;
  highlight?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  // --- DEFINICIÓN DE MENÚS (SIN "MI CUENTA") ---

  const studentMenus: MenuItem[] = [
    { label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mi Calendario', path: '/dashboard/calendar', icon: CalendarDays },
    { label: 'Mis Materias', path: '/dashboard/subjects', icon: BookOpen },
    { label: 'Buscar Tutorías', path: '/dashboard/tutorings', icon: Search },
    { label: 'Tutor IA', path: '/dashboard/ai-tutor', icon: Bot, highlight: true },
    { label: 'Catálogo Cursos', path: '/dashboard/catalog', icon: Library },
    { icon: FileClock, label: 'Historial', path: '/dashboard/history' },
    { icon: Map, label: 'Malla Curricular', path: '/dashboard/mesh' },
  ];

  const teacherMenus: MenuItem[] = [
    { label: 'Panel Docente', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Mis Cursos', path: '/teacher/courses', icon: BookOpen },
    { label: 'Mi Agenda', path: '/teacher/calendar', icon: CalendarDays },
    { label: 'Tutorías', path: '/teacher/tutorings', icon: Users },
  ];

  const adminMenus: MenuItem[] = [
    { label: 'Panel Admin', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Periodos', path: '/admin/periods', icon: CalendarDays },
    { label: 'Gestión Académica', path: '/admin/academic', icon: BookOpen },
    { label: 'Usuarios', path: '/admin/users', icon: Users },
  ];

  // SELECCIÓN DE MENÚ SEGÚN ROL
  let menus = studentMenus;
  let profilePath = '/dashboard/profile'; // Ruta por defecto (Estudiante)

  if (user?.role === 'TEACHER') {
    menus = teacherMenus;
    profilePath = '/teacher/profile';
  }
  if (user?.role === 'ADMIN') {
    menus = adminMenus;
    profilePath = '/admin/profile';
  }

  // --- CONFIGURACIÓN DE TEMAS (COLORES) ---
  // 3. CONFIGURACIÓN DE TEMAS (TIPADO ESTRICTO)
  // Usamos Record<Clave, Valor> para decirle que las claves son los roles y el valor es ThemeConfig
  const themeMap: Record<string, ThemeConfig> = {
    STUDENT: {
      sidebarBg: "bg-slate-900",
      borderColor: "border-slate-800",
      headerBg: "bg-slate-800/50",
      logoGradient: "from-blue-400 to-teal-400",
      activeItem: "bg-blue-600 text-white shadow-lg shadow-blue-500/20",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      roleLabel: "Estudiante"
    },
    TEACHER: {
      sidebarBg: "bg-[#1a1625]",
      borderColor: "border-purple-900/30",
      headerBg: "bg-purple-900/10",
      logoGradient: "from-purple-400 to-pink-400",
      activeItem: "bg-purple-600 text-white shadow-lg shadow-purple-500/20",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      roleLabel: "Docente"
    },
    ADMIN: {
      sidebarBg: "bg-slate-950",
      borderColor: "border-emerald-900/30",
      headerBg: "bg-emerald-900/10",
      logoGradient: "from-emerald-400 to-cyan-400",
      activeItem: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      roleLabel: "Administrador"
    }
  };
  const themeConfig = themeMap[user?.role || 'STUDENT'];

  return (
    <>
      {/* Overlay Móvil */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 h-screen w-64 text-white flex flex-col transition-transform duration-300 z-50 shadow-2xl border-r",
          themeConfig.sidebarBg,
          themeConfig.borderColor,
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >

        {/* Encabezado */}
        <div className={clsx("p-6 border-b flex justify-between items-center backdrop-blur-sm", themeConfig.borderColor, themeConfig.headerBg)}>
          <div>
            <h1 className={clsx("text-2xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent", themeConfig.logoGradient)}>
              ingenIA-Q
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              {themeConfig.roleLabel}
            </p>
          </div>

          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info Usuario (AHORA ES UN BOTÓN CLICKEABLE) */}
        <div className="px-6 py-6">
          <Link
            to={profilePath} // 👈 Lleva al perfil
            onClick={onClose}
            className={clsx(
              "rounded-xl p-4 border flex items-center gap-3 transition-all duration-200 group relative overflow-hidden",
              // Efecto hover para que parezca botón
              "hover:bg-white/10 hover:shadow-lg hover:border-white/20 cursor-pointer",
              themeConfig.headerBg,
              themeConfig.borderColor
            )}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-inner shrink-0
              ${user?.role === 'ADMIN' ? 'bg-emerald-600' : user?.role === 'TEACHER' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>

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

                {/* Icono de engranaje que aparece sutilmente */}
                <Settings size={14} className="text-white/30 group-hover:text-white transition-colors mt-1" />
              </div>
            </div>
          </Link>

          <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
            Clic en tu tarjeta para ver perfil
          </p>
        </div>

        {/* Navegación Dinámica */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menus.map((item) => {
            const Icon = item.icon;
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

        {/* Botón Salir */}
        <div className={clsx("p-4 border-t", themeConfig.borderColor)}>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all text-sm font-bold border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};