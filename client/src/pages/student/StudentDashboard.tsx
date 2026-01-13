import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Award, BookOpen, TrendingUp, Calendar } from 'lucide-react';

interface DashboardStats {
  fullName: string;
  careerName: string;
  stats: {
    average: number;
    approvedCount: number;
    totalSubjects: number;
    progress: number;
    takingCount: number;
    currentSemester: number;
  };
}

export const StudentDashboard = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/student/stats');
        setData(res.data);
      } catch (error) {
        console.error("Error cargando stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando tu oficina virtual...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. SECCIÓN DE BIENVENIDA */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">
            Hola, <span className="text-blue-400">{data?.fullName.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-300 mt-2 text-lg">
            Estudiante de <span className="font-semibold text-white">{data?.careerName}</span>
          </p>
          
          <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            <div className={`h-2.5 w-2.5 rounded-full ${data?.stats.takingCount && data.stats.takingCount > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              {data?.stats.takingCount && data.stats.takingCount > 0 
                ? `Cursando Semestre ${data?.stats.currentSemester}` 
                : 'Sin materias activas'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. GRID DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta de Promedio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Award className="text-amber-600" size={24} />
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Global</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Promedio General</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{data?.stats.average} <span className="text-sm text-slate-400 font-normal">/ 10</span></h3>
          </div>
        </div>

        {/* Tarjeta de Progreso */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{data?.stats.progress}% completado</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Avance de Carrera</p>
            {/* Barra de progreso */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 mb-1">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${data?.stats.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 text-right">{data?.stats.approvedCount} de {data?.stats.totalSubjects} materias</p>
          </div>
        </div>

        {/* Tarjeta de Carga Actual */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
             <div className="p-3 bg-emerald-50 rounded-xl">
              <BookOpen className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Activo</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Carga Actual</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{data?.stats.takingCount} <span className="text-sm text-slate-400 font-normal">materias</span></h3>
          </div>
        </div>

      </div>

      {/* 3. WIDGET DE CALENDARIO (Visual por ahora) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
          <h2 className="text-lg font-bold text-slate-800">Próximos Eventos</h2>
        </div>
        
        <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center justify-center bg-slate-100 w-12 h-12 rounded-lg text-slate-600">
                    <span className="text-xs font-bold uppercase">ENE</span>
                    <span className="text-lg font-bold">15</span>
                </div>
                <div>
                    <h4 className="font-bold text-slate-700">Inicio de Semestre 2026-A</h4>
                    <p className="text-sm text-slate-500">Periodo Académico Ordinario</p>
                </div>
            </div>
             {/* Más eventos irán aquí dinámicamente luego */}
        </div>
      </div>
    </div>
  );
};