import { useAuthStore } from '../../store/authStore';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  Bot, 
  LogOut,
  X,
  GraduationCap, 
  ClipboardList
} from 'lucide-react';
import clsx from 'clsx';

// 1. CREAMOS UNA INTERFAZ PARA DEFINIR TUS MENÚS
// El signo de interrogación (?) en highlight significa que es OPCIONAL.
interface MenuItem {
  label: string;
  path: string;
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

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // 2. APLICAMOS EL TIPO "MenuItem[]" A TUS LISTAS
  const studentMenus: MenuItem[] = [
    { label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mi Calendario', path: '/dashboard/calendar', icon: CalendarDays },
    { label: 'Mis Materias', path: '/dashboard/subjects', icon: BookOpen },
    { label: 'Tutor IA', path: '/dashboard/ai-tutor', icon: Bot, highlight: true },
  ];

  const teacherMenus: MenuItem[] = [
    { label: 'Panel Docente', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Mis Cursos', path: '/teacher/courses', icon: BookOpen },
    { label: 'Actividades', path: '/teacher/activities', icon: ClipboardList },
    { label: 'Calificaciones', path: '/teacher/grades', icon: GraduationCap },
    { label: 'Agenda', path: '/teacher/calendar', icon: CalendarDays },
  ];

  const menus = isTeacher ? teacherMenus : studentMenus;

  const logoGradient = isTeacher 
    ? "from-indigo-400 to-purple-400" 
    : "from-blue-400 to-teal-400";
    
  const activeClass = isTeacher
    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
    : "bg-blue-600 text-white shadow-lg shadow-blue-500/20";

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
          "fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 z-50",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className={clsx("text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent", logoGradient)}>
              ingenIA-Q
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isTeacher ? 'Portal Docente' : 'Gestión Académica'}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info Usuario */}
        <div className="px-6 py-4 bg-slate-800/50">
          <p className="text-sm font-medium text-white">{user?.fullName}</p>
          <div className="flex items-center gap-2 mt-1">
             <span className={clsx(
               "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
               isTeacher ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-500/20 text-blue-300"
             )}>
                {user?.role === 'TEACHER' ? 'DOCENTE' : user?.role}
             </span>
          </div>
        </div>

        {/* Navegación Dinámica */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menus.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive 
                    ? activeClass
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                  
                  // 3. YA NO NECESITAS @ts-ignore AQUÍ
                  // TypeScript ahora sabe que highlight puede ser undefined, así que esto es válido:
                  item.highlight && !isActive && "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Botón Salir */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};