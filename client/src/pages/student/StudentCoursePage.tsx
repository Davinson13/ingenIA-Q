import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Target } from 'lucide-react';

interface Activity {
    id: number;
    name: string;
    type: string;
    maxScore: number; // 20
    weight: number;   // 7, 5, etc
    myScore: number | null;
}

interface CourseDetail {
    subjectName: string;
    parallelCode: string;
    activities: Activity[];
    finalTotal: number;
}

export const StudentCoursePage = () => {
  const { courseId } = useParams(); 
  const [data, setData] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/student/course/${courseId}`);
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [courseId]);

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando detalles...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">No se encontró información del curso.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link to="/dashboard/grades" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 font-medium">
        <ArrowLeft size={20} /> Volver a mis notas
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800">{data.subjectName}</h1>
            <p className="text-slate-500">Paralelo {data.parallelCode}</p>
        </div>
        
        <div className="grid gap-4">
          {data.activities.length === 0 ? (
              <p className="text-center text-slate-400 py-4">El docente aún no ha creado actividades.</p>
          ) : (
            data.activities.map((act) => (
                <div key={act.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4 mb-2 md:mb-0">
                    <div className={`p-3 rounded-full ${act.myScore !== null ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                        <Target size={20} />
                    </div>
                    <div>
                    <h4 className="font-bold text-slate-700">{act.name}</h4>
                    <div className="flex gap-2 text-xs">
                        <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">{act.type}</span>
                        <span className="text-slate-500">Valor real: {act.weight} pts</span>
                    </div>
                    </div>
                </div>
                
                <div className="text-right w-full md:w-auto flex justify-between md:block items-center">
                    <span className="md:hidden text-sm font-bold text-slate-500">Calificación:</span>
                    <div>
                        {act.myScore !== null ? (
                            <span className={`text-xl font-bold ${act.myScore >= 14 ? 'text-green-600' : 'text-slate-700'}`}>
                                {act.myScore}
                            </span>
                        ) : (
                            <span className="text-sm text-slate-400 italic">--</span>
                        )}
                        <span className="text-xs text-slate-400 block">/ 20</span>
                    </div>
                </div>
                </div>
            ))
          )}
        </div>

        {/* TOTAL FOOTER */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center bg-indigo-50 p-6 rounded-xl">
            <div>
                <span className="font-bold text-slate-700 block text-lg">Nota Final Acumulada</span>
                <span className="text-xs text-slate-500">Suma ponderada de todas las categorías</span>
            </div>
            <div className="text-right">
                <span className={`text-4xl font-bold ${data.finalTotal >= 14 ? 'text-green-600' : data.finalTotal >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {data.finalTotal.toFixed(2)}
                </span>
                <span className="text-sm text-slate-400 font-medium"> / 20</span>
            </div>
        </div>
      </div>
    </div>
  );
};