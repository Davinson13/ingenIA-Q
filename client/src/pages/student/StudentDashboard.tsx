import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BookOpen, Trophy, TrendingUp, Calendar } from 'lucide-react';
// 👇 Importamos el sistema de temas
import { getTheme } from '../../utils/themeUtils';

interface StudentStats {
  average: number;
  approvedCount: number;
  totalSubjects: number;
  progress: number;
  takingCount: number;
  currentSemester: number;
}

interface DashboardData {
  fullName: string;
  careerName: string;
  stats: StudentStats;
}

export const StudentDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // 🎨 TEMA ESTUDIANTE (Azul/Indigo)
  const theme = getTheme('STUDENT');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/student/stats');
        setData(res.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando tu información...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">No se pudo cargar la información.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* 1. SECCIÓN DE BIENVENIDA CON TEMA */}
      <div className={`rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Hola, <span className="text-white/90">{data.fullName.split(' ')[0]} 👋</span>
          </h1>
          <p className="text-white/80 text-lg">
            Estudiante de <span className="font-bold text-white">{data.careerName}</span>
          </p>

          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <div className={`w-3 h-3 rounded-full ${data.stats.takingCount > 0 ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`}></div>
            <span className="text-sm font-bold text-white">
              {data.stats.takingCount > 0
                ? `${data.stats.takingCount} materias activas`
                : "Sin materias activas"}
            </span>
          </div>
        </div>

        {/* Semestre Actual (Badge Grande) */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white/20">
          <span className="text-5xl font-black">{data.stats.currentSemester}°</span>
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Semestre</span>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* 2. TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Promedio (Mantener Gold/Yellow para destacar logro) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <Trophy size={24} />
            </div>
            <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Global</span>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Promedio General</h3>
          <p className="text-4xl font-black text-slate-800">
            {data.stats.average} <span className="text-sm text-slate-400 font-bold">/ 20</span>
          </p>
        </div>

        {/* Avance de Carrera (Usando Tema) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 ${theme.secondary} ${theme.text} rounded-xl`}>
              <TrendingUp size={24} />
            </div>
            <span className={`${theme.secondary} ${theme.text} text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${theme.border}`}>% completado</span>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">Avance de Carrera</h3>

          <div className="flex items-end gap-2 mb-2">
            <p className="text-4xl font-black text-slate-800">{data.stats.progress}%</p>
            <p className="text-xs text-slate-400 mb-1.5 font-bold">{data.stats.approvedCount} de {data.stats.totalSubjects} materias</p>
          </div>

          {/* Barra de progreso con color del tema */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div className={`h-full ${theme.primary} transition-all duration-1000`} style={{ width: `${data.stats.progress}%` }}></div>
          </div>
        </div>

        {/* Carga Actual (Green para estado activo) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Activo</span>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase mb-1">Carga Actual</h3>
          <p className="text-4xl font-black text-slate-800">
            {data.stats.takingCount} <span className="text-sm text-slate-400 font-bold">materias</span>
          </p>
        </div>
      </div>

      {/* 3. SECCIÓN INFORMATIVA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg">
          <Calendar className={theme.text} size={20} /> Próximos Eventos
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group cursor-pointer">
            <div className={`bg-slate-100 text-slate-600 group-hover:${theme.primary} group-hover:text-white font-bold px-4 py-2 rounded-lg text-center min-w-[70px] transition-colors`}>
              <span className="text-xs block uppercase tracking-wider">ENE</span>
              <span className="text-2xl block">23</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Inicio de Exámenes Finales</h4>
              <p className="text-sm text-slate-500">Prepárate con tiempo para tus evaluaciones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};