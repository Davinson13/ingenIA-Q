import { useEffect, useState, useCallback } from 'react'; // 👈 Agregamos useCallback
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Save, ExternalLink, Calendar, RefreshCw } from 'lucide-react'; // 👈 Eliminado CheckCircle

interface ActivityInfo {
    id: number;
    title: string;
    description?: string;
    limitDate: string;
}

interface StudentRow {
    studentId: number;
    fullName: string;
    avatar: string;
    score: string | number;
    submissionLink: string | null;
    hasGrade?: boolean;
}

export const TeacherActivityGradePage = () => {
    const { courseId, activityId } = useParams();
    const navigate = useNavigate();

    const [activityInfo, setActivityInfo] = useState<ActivityInfo | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);

    // 🟢 SOLUCIÓN ERROR DEPENDENCY: Usamos useCallback para memorizar la función
    const loadData = useCallback(async () => {
        try {
            const res = await api.get(`/teacher/activity/${activityId}/grades`);
            setActivityInfo(res.data.activity);

            const mappedStudents = res.data.students.map((s: StudentRow) => ({
                ...s,
                score: s.score === null || s.score === undefined ? '' : s.score
            }));

            setStudents(mappedStudents);
        } catch (error) {
            console.error(error);
            alert("Error cargando datos del servidor.");
        } finally {
            setLoading(false);
        }
    }, [activityId]); // Dependencia: solo se recrea si cambia el ID de la actividad

    // Ahora useEffect está feliz porque loadData es estable gracias a useCallback
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGradeChange = (studentId: number, val: string) => {
        setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, score: val } : s));
    };

    const saveSingleGrade = async (studentId: number) => {
        const student = students.find(s => s.studentId === studentId);
        if (!student) return;

        // 🟢 SOLUCIÓN ERROR CONST: Usamos const porque no se reasigna
        const cleanScore = String(student.score).replace(',', '.');

        if (cleanScore !== '' && (parseFloat(cleanScore) < 0 || parseFloat(cleanScore) > 20)) {
            alert("La nota debe estar entre 0 y 20");
            return;
        }

        try {
            await api.post(`/teacher/activity/${activityId}/grade`, {
                studentId,
                score: cleanScore,
                feedback: ""
            });

            alert(`✅ Nota de ${student.fullName} guardada correctamente: ${cleanScore}`);
            loadData();
        } catch (error) {
            console.error(error);
            alert("❌ Error al guardar nota");
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;
    if (!activityInfo) return <div className="p-10 text-center text-red-500">Actividad no encontrada</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <button onClick={() => navigate(`/teacher/course/${courseId}`)} className="flex items-center text-slate-500 hover:text-indigo-600">
                <ArrowLeft size={20} className="mr-1" /> Volver al curso
            </button>

            {/* HEADER */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-800">{activityInfo.title}</h1>
                <div className="flex gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                        <Calendar size={14} /> Fecha Límite: {new Date(activityInfo.limitDate).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* TABLA DE CALIFICACIONES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4">Estudiante</th>
                            <th className="p-4">Entrega (Link)</th>
                            <th className="p-4 w-32">Nota /20</th>
                            <th className="p-4 w-40 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {students.map(student => (
                            <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <img src={student.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt="av" />
                                    <span className="font-medium text-slate-700">{student.fullName}</span>
                                </td>
                                <td className="p-4">
                                    {student.submissionLink ? (
                                        <a
                                            href={student.submissionLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-indigo-600 hover:underline font-bold bg-indigo-50 px-3 py-1.5 rounded-lg w-fit text-sm"
                                        >
                                            <ExternalLink size={14} /> Ver Tarea
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 text-sm italic">Sin entrega</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        max={20} min={0}
                                        className="w-full p-2 border border-slate-300 rounded text-center font-bold outline-none focus:border-indigo-500 transition-all"
                                        value={student.score}
                                        onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                                        placeholder="0.00"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => saveSingleGrade(student.studentId)}
                                        className={`p-2 rounded transition-colors text-white flex items-center justify-center gap-2 w-full text-sm font-bold shadow-sm ${student.hasGrade
                                                ? 'bg-orange-500 hover:bg-orange-600'
                                                : 'bg-slate-900 hover:bg-slate-800'
                                            }`}
                                    >
                                        {student.hasGrade ? (
                                            <><RefreshCw size={16} /> Actualizar</>
                                        ) : (
                                            <><Save size={16} /> Guardar</>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No hay estudiantes en este curso.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};