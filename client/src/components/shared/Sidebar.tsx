import { useAuthStore } from '../../store/authStore';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  Bot, 
  LogOut,
  X // <--- Importamos el icono X
} from 'lucide-react';
import clsx from 'clsx';

// Definimos qué propiedades recibe este componente
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const menus = [
    { label: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mi Calendario', path: '/dashboard/calendar', icon: CalendarDays },
    { label: 'Mis Materias', path: '/dashboard/subjects', icon: BookOpen },
    { label: 'Tutor IA', path: '/dashboard/ai-tutor', icon: Bot, highlight: true },
  ];

  return (
    <>
      {/* 1. EL FONDO OSCURO (Overlay) - Solo visible en móviles cuando el menú está abierto */}
      <div 
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose} // Si das clic fuera del menú, se cierra
      />

      {/* 2. EL SIDEBAR REAL */}
      <aside 
        className={clsx(
          "fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 z-50",
          // Lógica: Si está abierto (o es pantalla grande), se muestra. Si no, se esconde a la izquierda.
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        
        {/* Encabezado con Botón de Cierre */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              ingenIA-Q
            </h1>
            <p className="text-xs text-slate-400 mt-1">Gestión Académica</p>
          </div>

          {/* Botón X - Solo visible en móviles (md:hidden) */}
          <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Información del Usuario */}
        <div className="px-6 py-4 bg-slate-800/50">
          <p className="text-sm font-medium text-white">{user?.fullName}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{user?.role}</p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menus.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose} // Al dar clic en un link, cerramos el menú en móvil
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
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