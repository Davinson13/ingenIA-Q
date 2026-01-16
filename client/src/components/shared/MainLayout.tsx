import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react'; // Importamos el icono de hamburguesa

export const MainLayout = () => {
  const { isAuthenticated, token } = useAuthStore();
  
  // Estado para controlar si el sidebar está abierto o cerrado en móvil
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Protección de ruta
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Contenido Principal */}
      <main className="flex-1 transition-all duration-300 md:ml-64">
        
        {/* Barra Superior Móvil (Solo visible en pantallas pequeñas) */}
        <div className="md:hidden bg-white border-b p-4 flex items-center sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100"
          >
            <Menu size={28} /> {/* Las 3 rayitas */}
          </button>
          <span className="ml-4 font-bold text-slate-700">ingenIA-Q</span>
        </div>

        {/* Área de Outlet (Donde cambian las páginas) */}
        <div className="p-4 md:p-8 overflow-y-auto h-[calc(100vh-65px)] md:h-screen">
          <div className="max-w-7xl mx-auto">
              <Outlet />
          </div>
        </div>

      </main>
    </div>
  );
};