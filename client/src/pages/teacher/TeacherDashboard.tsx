import { useAuthStore } from '../../store/authStore'; // Asegúrate de que el path sea correcto según tu estructura
import { getTheme } from '../../utils/themeUtils'; // 👈 Importar el sistema de temas
import { Users, BookOpen, Clock, AlertCircle } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user } = useAuthStore();

  // 🎨 TEMA DOCENTE (Púrpura/Violeta)
  const theme = getTheme('TEACHER');

  // (Datos de ejemplo - Placeholder)
  const stats = {
    activeCourses: 3,
    totalStudents: 84,
    pendingGrades: 12,
    atRisk: 5
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* 1. BIENVENIDA DOCENTE CON TEMA */}
      <div className={`rounded-2xl p-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold">
            Bienvenido, <span className="text-white/90">{user?.fullName}</span>
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            Panel de Gestión Académica y Control de Cursos.
          </p>
        </div>
      </div>

      {/* 2. RESUMEN RÁPIDO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Cursos Activos (Usa color secundario del tema) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className={`p-4 rounded-xl ${theme.secondary} ${theme.text}`}>
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Cursos Activos</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.activeCourses}</h3>
          </div>
        </div>

        {/* Total Estudiantes (Usa color secundario del tema) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className={`p-4 rounded-xl ${theme.secondary} ${theme.text}`}>
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Total Estudiantes</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.totalStudents}</h3>
          </div>
        </div>

        {/* Pendientes (Mantenemos Ámbar para indicar atención, o podemos usar el tema) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Pendientes Calificar</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.pendingGrades}</h3>
          </div>
        </div>

        {/* Riesgo Académico (Siempre Rojo) */}
        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-white text-red-500 rounded-xl shadow-sm border border-red-50">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-red-800 text-sm font-bold uppercase tracking-wide">Riesgo Académico</p>
            <h3 className="text-3xl font-black text-red-700 flex items-baseline gap-1">
              {stats.atRisk} <span className="text-sm font-medium text-red-600/80">estudiantes</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 3. ACCESOS DIRECTOS (Placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400 font-medium">
          Próximamente: Lista de Cursos Recientes
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex items-center justify-center text-slate-400 font-medium">
          Próximamente: Actividades de Hoy
        </div>
      </div>

    </div>
  );
};