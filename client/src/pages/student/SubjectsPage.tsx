import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BookOpen, CheckCircle2, CircleDashed, PlayCircle } from 'lucide-react';
import clsx from 'clsx';

// Interfaces actualizadas
interface Subject {
  id: number;
  name: string;
  semesterLevel: number;
  status: 'PENDING' | 'TAKING' | 'APPROVED' | 'FAILED';
  grade: number | null;
}

interface CareerPlan {
  careerName: string;
  totalSemesters: number;
  plan: Record<string, Subject[]>; 
}

export const SubjectsPage = () => {
  const [data, setData] = useState<CareerPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.get('/career/my-plan');
        setData(res.data);
      } catch (error) {
        console.error("Error cargando malla", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  // Estilos según el estado de la materia (Semáforo)
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          border: 'border-l-4 border-l-green-500 border-slate-200',
          bg: 'bg-white',
          icon: <CheckCircle2 size={18} className="text-green-600" />,
          text: 'text-slate-600',
          badge: 'text-green-700 font-bold'
        };
      case 'TAKING':
        return {
          border: 'border-l-4 border-l-blue-600 border-blue-200 bg-blue-50', // Destacado
          bg: 'bg-blue-50',
          icon: <PlayCircle size={18} className="text-blue-600 animate-pulse" />, // Animación sutil
          text: 'text-blue-900 font-medium',
          badge: 'text-blue-700 font-bold'
        };
      default: // PENDING
        return {
          border: 'border-slate-200 border-l-4 border-l-slate-300',
          bg: 'bg-white opacity-80', // Un poco apagado
          icon: <CircleDashed size={18} className="text-slate-400" />,
          text: 'text-slate-500',
          badge: ''
        };
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-800">Historial Académico</h1>
        <div className="flex items-center gap-2 mt-2">
          <BookOpen className="text-blue-600" size={20} />
          <p className="text-lg font-medium text-slate-500">{data?.careerName}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(data?.plan || {}).map(([semester, subjects]) => (
          <div key={semester} className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            
            {/* Cabecera Simple */}
            <div className="p-3 bg-white border-b text-center">
              <span className="font-bold text-slate-700">Semestre {semester}</span>
            </div>

            <div className="p-3 space-y-3 flex-1">
              {subjects.map((sub) => {
                const style = getStatusStyles(sub.status);
                
                return (
                  <div 
                    key={sub.id} 
                    className={clsx(
                      "p-3 rounded-lg border shadow-sm flex flex-col gap-2 transition-all hover:shadow-md",
                      style.border,
                      style.bg
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx("text-sm leading-snug flex-1", style.text)}>
                        {sub.name}
                      </p>
                      <div className="mt-0.5">{style.icon}</div>
                    </div>

                    {/* Footer de la tarjeta: Nota o Estado */}
                    <div className="flex justify-end items-center mt-1">
                      {sub.status === 'APPROVED' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">
                          Nota: {sub.grade}
                        </span>
                      )}
                      {sub.status === 'TAKING' && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                          Cursando
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};