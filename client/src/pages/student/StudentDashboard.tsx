import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BookOpen, Trophy, TrendingUp, Calendar } from 'lucide-react';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Llamamos al endpoint que corregimos en student.ts
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
      
      {/* 1. SECCIÓN DE BIENVENIDA */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Hola, <span className="text-blue-400">{data.fullName} 👋</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Estudiante de <span className="font-semibold text-white">{data.careerName}</span>
          </p>
          
          <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <div className={`w-3 h-3 rounded-full ${data.stats.takingCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-sm font-medium text-slate-300">
              {data.stats.takingCount > 0 
                ? `${data.stats.takingCount} materias activas` 
                : "Sin materias activas"}
            </span>
          </div>
        </div>
        
        {/* Semestre Actual (Badge Grande) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-lg ring-4 ring-blue-500/30">
            <span className="text-4xl font-bold">{data.stats.currentSemester}°</span>
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">Semestre</span>
        </div>
      </div>

      {/* 2. TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Promedio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Trophy size={24} />
            </div>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">Global</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Promedio General</h3>
          <p className="text-3xl font-bold text-slate-800">
            {data.stats.average} <span className="text-sm text-slate-400 font-normal">/ 20</span>
          </p>
        </div>

        {/* Avance de Carrera */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">% completado</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Avance de Carrera</h3>
          
          <div className="flex items-end gap-2">
             <p className="text-3xl font-bold text-slate-800">{data.stats.progress}%</p>
             <p className="text-xs text-slate-400 mb-1.5">{data.stats.approvedCount} de {data.stats.totalSubjects} materias</p>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${data.stats.progress}%` }}></div>
          </div>
        </div>

        {/* Carga Actual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <BookOpen size={24} />
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Activo</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Carga Actual</h3>
          <p className="text-3xl font-bold text-slate-800">
            {data.stats.takingCount} <span className="text-sm text-slate-400 font-normal">materias</span>
          </p>
        </div>
      </div>

      {/* 3. SECCIÓN INFORMATIVA (Placeholder) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Calendar className="text-indigo-500" size={20}/> Próximos Eventos
        </h3>
        <div className="space-y-3">
             <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="bg-slate-100 text-slate-600 font-bold px-3 py-2 rounded text-center min-w-[60px]">
                    <span className="text-xs block uppercase">ENE</span>
                    <span className="text-xl block">15</span>
                </div>
                <div>
                    <h4 className="font-bold text-slate-700">Inicio de Semestre 2026-A</h4>
                    <p className="text-sm text-slate-500">Recuerda revisar tus horarios.</p>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};