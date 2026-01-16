import { useAuthStore } from '../../store/authStore';
import { Users, BookOpen, Clock, AlertCircle } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. BIENVENIDA DOCENTE (Tono Indigo) */}
      <div className="bg-gradient-to-r from-indigo-900 to-violet-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">
            Bienvenido, <span className="text-indigo-200">{user?.fullName}</span>
          </h1>
          <p className="text-indigo-100 mt-2 text-lg">
            Panel de Gestión Académica y Control de Cursos.
          </p>
        </div>
      </div>

      {/* 2. RESUMEN RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Cursos Activos</p>
            <h3 className="text-2xl font-bold text-slate-800">3</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Estudiantes</p>
            <h3 className="text-2xl font-bold text-slate-800">84</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Pendientes Calificar</p>
            <h3 className="text-2xl font-bold text-slate-800">12</h3>
          </div>
        </div>

        {/* ALERTA DE RENDIMIENTO (El "Plus") */}
        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
          <div className="p-4 bg-white text-red-500 rounded-xl shadow-sm">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-red-800 text-sm font-medium">Riesgo Académico</p>
            <h3 className="text-2xl font-bold text-red-700">5 <span className="text-sm font-normal">estudiantes</span></h3>
          </div>
        </div>
      </div>

      {/* 3. ACCESOS DIRECTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aquí pondremos la lista de cursos reciente y el calendario mini más adelante */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400">
            Próximamente: Lista de Cursos Recientes
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400">
            Próximamente: Actividades de Hoy
        </div>
      </div>

    </div>
  );
};