import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, Users, Calendar, Award } from 'lucide-react';

// Interfaces
interface ActivityInfo {
    id: number;
    title: string;
    type: string;
    maxScore: number;
    date: string;
}

interface StudentGrade {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar: string;
    score: number;
}

// Interfaz para la respuesta cruda de la API de asistencia
interface ApiAttendanceResponse {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar: string;
    status: string;
}

export const TeacherActivityGradePage = () => {
    const { courseId, activityId } = useParams();
    const navigate = useNavigate();

    const [students, setStudents] = useState<StudentGrade[]>([]);
    const [activity, setActivity] = useState<ActivityInfo | null>(null);
    const [saving, setSaving] = useState(false);

    // Cargar datos
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Obtener Info de la Actividad
                const resAct = await api.get(`/teacher/calendar?courseId=${courseId}`);
                const foundAct = resAct.data.find((a: ActivityInfo) => a.id === parseInt(activityId!));
                setActivity(foundAct ? { ...foundAct, maxScore: 20 } : null);

                // 2. Obtener Estudiantes (Simulado desde asistencia)
                const resStud = await api.get(`/teacher/attendance?courseId=${courseId}&date=${new Date().toISOString()}`);

                // Mapeo seguro tipado sin usar ANY
                const mapped = resStud.data.map((s: ApiAttendanceResponse) => ({
                    enrollmentId: s.enrollmentId,
                    studentId: s.studentId,
                    fullName: s.fullName,
                    avatar: s.avatar,
                    score: 0 // Aquí deberías cargar la nota real si existiera
                }));
                setStudents(mapped);

            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        fetchData();
    }, [courseId, activityId]);

    const handleScoreChange = (enrollmentId: number, value: string) => {
        let num = parseFloat(value);
        if (isNaN(num)) num = 0;
        if (num > 20) num = 20;
        if (num < 0) num = 0;

        setStudents(prev => prev.map(s => s.enrollmentId === enrollmentId ? { ...s, score: num } : s));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const promises = students.map(s =>
                api.post('/teacher/grade-activity', {
                    studentId: s.studentId,
                    activityId: parseInt(activityId!),
                    score: s.score
                })
            );
            await Promise.all(promises);
            alert("✅ Calificaciones guardadas correctamente");
            navigate(-1);
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar calificaciones");
        } finally {
            setSaving(false);
        }
    };

    if (!activity) return <div className="p-10 text-center">Cargando actividad...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

            <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={20} className="mr-1" /> Volver al Curso
            </button>

            {/* HEADER */}
            <div className="bg-white border-l-4 border-indigo-600 rounded-xl shadow-sm p-6 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{activity.type}</span>
                        <span className="text-slate-400 text-sm flex items-center gap-1"><Calendar size={14} /> {new Date(activity.date).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">{activity.title}</h1>
                    <p className="text-slate-500 text-sm mt-1">Calificando sobre <strong className="text-indigo-600">20.00</strong> puntos</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-3xl font-bold text-slate-200"><Award size={48} /></div>
                </div>
            </div>

            {/* LISTA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18} /> Listado de Estudiantes</h3>
                    <span className="text-xs text-slate-400">{students.length} estudiantes</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {students.map(student => (
                        <div key={student.enrollmentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <img src={student.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt="avatar" />
                                <span className="font-bold text-slate-700">{student.fullName}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={`w-24 text-center font-bold text-lg p-2 rounded-lg border focus:ring-4 outline-none transition-all ${student.score >= 14 ? 'border-green-200 bg-green-50 text-green-700 focus:ring-green-100' :
                                                student.score >= 9.17 ? 'border-yellow-200 bg-yellow-50 text-yellow-700 focus:ring-yellow-100' :
                                                    'border-red-200 bg-red-50 text-red-700 focus:ring-red-100'
                                            }`}
                                        value={student.score}
                                        onChange={(e) => handleScoreChange(student.enrollmentId, e.target.value)}
                                    />
                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs opacity-30 pointer-events-none">/20</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTÓN FLOTANTE */}
            <div className="fixed bottom-8 right-8">
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Guardando...' : 'Guardar Calificaciones'}
                </button>
            </div>
        </div>
    );
};