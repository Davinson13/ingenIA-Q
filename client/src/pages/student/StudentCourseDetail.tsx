import React, { useEffect, useState } from 'react'; // 👈 1. Importamos React para usar sus tipos
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  ArrowLeft, Calendar, Clock, TrendingUp, FileText, 
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

// --- INTERFACES ---
interface GradeActivity {
  id: number;
  name: string;
  type: string;
  maxScore: number;
  weight: number;
  myScore: number | null;
}
interface AgendaEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  type: string;
}
interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
}
interface CourseData {
  subjectName: string;
  parallelCode: string;
  grades: GradeActivity[];
  finalTotal: number;
  agenda: AgendaEvent[];
  attendance: AttendanceRecord[];
}

interface ApiError {
    response?: {
        data?: string;
    };
}

type TabOption = 'AGENDA' | 'GRADES' | 'ATTENDANCE';

// 2. USAMOS 'React.ElementType' AQUÍ (Esto nunca falla)
const TABS: { id: TabOption; label: string; icon: React.ElementType }[] = [
    { id: 'AGENDA', label: 'Agenda', icon: Calendar },
    { id: 'GRADES', label: 'Calificaciones', icon: TrendingUp },
    { id: 'ATTENDANCE', label: 'Asistencia', icon: Clock }
];

export const StudentCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabOption>('AGENDA');
  const [data, setData] = useState<CourseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await api.get(`/student/course/${id}`);
            setData(res.data);
        } catch (err: unknown) { 
            console.error(err);
            const apiError = err as ApiError; 
            const msg = apiError.response?.data || "Error de conexión o servidor";
            setError(typeof msg === 'string' ? msg : "Error desconocido");
        }
    };
    fetchData();
  }, [id]);

  // VISTA DE ERROR
  if (error) return (
      <div className="p-20 text-center">
          <div className="inline-block p-4 bg-red-100 text-red-600 rounded-xl mb-4">
              <XCircle size={48} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Ups, algo salió mal</h2>
          <p className="text-slate-500 mb-6">Detalle: {error}</p>
          <button onClick={() => navigate('/dashboard/subjects')} className="text-indigo-600 font-bold hover:underline">
              Volver a Mis Materias
          </button>
      </div>
  );

  // VISTA DE CARGA
  if (!data) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-400">Cargando aula virtual...</p>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <button onClick={() => navigate('/dashboard/subjects')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={20} className="mr-1" /> Mis Materias
      </button>

      {/* HEADER */}
      <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold">{data.subjectName}</h1>
            <p className="text-slate-400">Paralelo {data.parallelCode}</p>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4"></div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-xl">
        {TABS.map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 font-bold text-sm transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <tab.icon size={18}/> {tab.label}
            </button>
        ))}
      </div>

      {/* CONTENIDO PESTAÑAS */}
      
      {/* 1. AGENDA */}
      {activeTab === 'AGENDA' && (
          <div className="grid gap-4">
              {data.agenda.length === 0 && <div className="text-center text-slate-400 py-10">No hay eventos próximos.</div>}
              {data.agenda.map(ev => (
                  <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="bg-slate-50 text-slate-600 font-bold p-3 rounded-lg text-center min-w-[70px]">
                          <span className="block text-[10px] uppercase">{new Date(ev.date).toLocaleDateString('es-ES', {month:'short'})}</span>
                          <span className="text-xl">{new Date(ev.date).getDate()}</span>
                      </div>
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{ev.type}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={12}/>{new Date(ev.date).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                              </span>
                          </div>
                          <h3 className="font-bold text-slate-800">{ev.title}</h3>
                          <p className="text-sm text-slate-500">{ev.description}</p>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* 2. CALIFICACIONES */}
      {activeTab === 'GRADES' && (
          <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="grid gap-4">
                    {data.grades.map(act => (
                        <div key={act.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${act.myScore !== null ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700">{act.name}</h4>
                                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">{act.type}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {act.myScore !== null ? (
                                    <span className={`text-xl font-bold ${act.myScore >= 14 ? 'text-green-600' : 'text-slate-700'}`}>{act.myScore}</span>
                                ) : <span className="text-slate-400 italic">--</span>}
                                <span className="text-xs text-slate-400 block">/ 20</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center bg-indigo-50 p-6 rounded-xl">
                    <div>
                        <span className="font-bold text-slate-700 block text-lg">Nota Final</span>
                        <span className="text-xs text-slate-500">Promedio ponderado</span>
                    </div>
                    <div className="text-right">
                        <span className={`text-4xl font-bold ${data.finalTotal >= 14 ? 'text-green-600' : data.finalTotal >= 9.17 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {data.finalTotal.toFixed(2)}
                        </span>
                        <span className="text-sm text-slate-400 font-medium"> / 20</span>
                    </div>
                </div>
              </div>

              {/* TABLA DETALLADA CON SEMÁFOROS */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                          <tr><th className="p-4">Actividad</th><th className="p-4 text-center">Estado</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {data.grades.map(grade => (
                              <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 text-sm font-bold text-slate-700">{grade.name}</td>
                                  <td className="p-4 text-center">
                                      {grade.myScore === null ? <span className="text-slate-400 text-xs">Pendiente</span> :
                                       grade.myScore >= 14 ? 
                                         <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                                            <CheckCircle2 size={14}/> APROBADO
                                         </span> : 
                                       grade.myScore >= 9.17 ? 
                                         <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                                            <AlertCircle size={14}/> SUSPENSO
                                         </span> : 
                                         <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                                            <XCircle size={14}/> REPROBADO
                                         </span>
                                      }
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* 3. ASISTENCIA */}
      {activeTab === 'ATTENDANCE' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                  {data.attendance.map(att => (
                      <div key={att.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                              <Calendar size={18} className="text-slate-400"/>
                              <span className="font-bold text-slate-700">{new Date(att.date).toLocaleDateString()}</span>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${att.status==='PRESENT'?'bg-green-100 text-green-700':att.status==='LATE'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                              {att.status === 'PRESENT' ? 'ASISTIÓ' : att.status === 'LATE' ? 'ATRASO' : 'FALTA'}
                          </span>
                      </div>
                  ))}
                  {data.attendance.length === 0 && <div className="p-8 text-center text-slate-400">No hay registros.</div>}
              </div>
          </div>
      )}

    </div>
  );
};