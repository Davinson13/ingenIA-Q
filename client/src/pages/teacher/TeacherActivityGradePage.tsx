import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    ArrowLeft, Save, ExternalLink, Calendar, RefreshCw, AlertTriangle, CheckCircle, MessageSquare
} from 'lucide-react';

interface ActivityInfo {
    id: number;
    title: string;
    description?: string; // 👈 Descripción de la tarea
    date: string;
}

interface StudentRow {
    studentId: number;
    fullName: string;
    avatar: string;
    score: string | number;
    submissionLink: string | null;
    submittedAt: string | null; // 👈 Fecha real de entrega
    feedback: string;           // 👈 Comentario del docente
    hasGrade?: boolean;
}

export const TeacherActivityGradePage = () => {
    const { courseId, activityId } = useParams();
    const navigate = useNavigate();

    const [activityInfo, setActivityInfo] = useState<ActivityInfo | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const res = await api.get(`/teacher/activity/${activityId}`);
            setActivityInfo(res.data.activity);

            const mappedStudents = res.data.students.map((s: StudentRow) => ({
                ...s,
                score: s.score === null || s.score === undefined ? '' : s.score,
                feedback: s.feedback || '' // Aseguramos que no sea null
            }));

            setStudents(mappedStudents);
        } catch (error) {
            console.error(error);
            alert("Error cargando datos.");
        } finally {
            setLoading(false);
        }
    }, [activityId]);

    useEffect(() => { loadData(); }, [loadData]);

    // Maneja cambios en la NOTA
    const handleGradeChange = (studentId: number, val: string) => {
        setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, score: val } : s));
    };

    // Maneja cambios en el FEEDBACK
    const handleFeedbackChange = (studentId: number, val: string) => {
        setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, feedback: val } : s));
    };

    const saveSingleGrade = async (studentId: number) => {
        const student = students.find(s => s.studentId === studentId);
        if (!student) return;

        const cleanScore = String(student.score).replace(',', '.');

        if (cleanScore !== '' && (parseFloat(cleanScore) < 0 || parseFloat(cleanScore) > 20)) {
            alert("La nota debe estar entre 0 y 20");
            return;
        }

        try {
            await api.post(`/teacher/activity/${activityId}/grade`, {
                studentId,
                score: cleanScore,
                feedback: student.feedback // 👈 Enviamos el comentario
            });

            alert(`✅ Calificación guardada para ${student.fullName}`);
            loadData();
        } catch (error) {
            console.error(error);
            alert("❌ Error al guardar");
        }
    };

    // 🕒 CALCULADORA DE ATRASO
    const getLateDetails = (date: string, submittedAt: string | null) => {
        if (!submittedAt) return null;

        const limit = new Date(date).getTime();
        const submitted = new Date(submittedAt).getTime();
        const diff = submitted - limit;

        if (diff <= 0) {
            return <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={12} /> A tiempo</span>;
        }

        // Si es tarde, calculamos cuánto
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        let text = "Atrasado por ";
        if (days > 0) text += `${days}d `;
        if (hours > 0) text += `${hours}h `;
        if (days === 0 && hours === 0) text += `${minutes}min`;

        return (
            <span className="text-xs font-bold text-red-600 flex items-center gap-1" title={new Date(submittedAt).toLocaleString()}>
                <AlertTriangle size={12} /> {text}
            </span>
        );
    };

    if (loading) return <div className="p-10 text-center">Cargando...</div>;
    if (!activityInfo) return <div className="p-10 text-center text-red-500">Actividad no encontrada</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <button onClick={() => navigate(`/teacher/course/${courseId}`)} className="flex items-center text-slate-500 hover:text-indigo-600">
                <ArrowLeft size={20} className="mr-1" /> Volver al curso
            </button>

            {/* HEADER DE LA ACTIVIDAD */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{activityInfo.title}</h1>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> Límite: {new Date(activityInfo.date).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
                {/* 🟢 DESCRIPCIÓN DE LA TAREA */}
                {activityInfo.description && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Descripción de la Tarea:</h3>
                        <p className="text-slate-700 text-sm">{activityInfo.description}</p>
                    </div>
                )}
            </div>

            {/* TABLA DE CALIFICACIONES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-1/4">Estudiante</th>
                            <th className="p-4 w-1/5">Entrega & Estado</th>
                            <th className="p-4 w-1/4">Retroalimentación</th>
                            <th className="p-4 w-24 text-center">Nota</th>
                            <th className="p-4 w-32 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {students.map(student => (
                            <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                                {/* 1. DATOS ESTUDIANTE */}
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={student.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt="av" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">{student.fullName}</span>
                                            {student.hasGrade && <span className="text-[10px] text-green-600 font-bold">Calificado</span>}
                                        </div>
                                    </div>
                                </td>

                                {/* 2. ENTREGA Y SEMÁFORO DE TIEMPO */}
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        {student.submissionLink ? (
                                            <a
                                                href={student.submissionLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-indigo-600 hover:underline font-bold text-xs bg-indigo-50 w-fit px-2 py-1 rounded"
                                            >
                                                <ExternalLink size={12} /> Ver Entrega
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Sin entrega</span>
                                        )}

                                        {/* CÁLCULO DE ATRASO */}
                                        {getLateDetails(activityInfo.date, student.submittedAt)}
                                    </div>
                                </td>

                                {/* 3. INPUT DE FEEDBACK (Retroalimentación) */}
                                <td className="p-4 align-top">
                                    <div className="relative">
                                        <MessageSquare size={14} className="absolute top-3 left-3 text-slate-400" />
                                        <textarea
                                            className="w-full p-2 pl-9 border border-slate-200 rounded-lg text-xs focus:border-indigo-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                                            rows={2}
                                            placeholder="Escribe un comentario..."
                                            value={student.feedback}
                                            onChange={(e) => handleFeedbackChange(student.studentId, e.target.value)}
                                        />
                                    </div>
                                </td>

                                {/* 4. INPUT DE NOTA */}
                                <td className="p-4 align-top">
                                    <input
                                        type="number"
                                        step="0.01"
                                        max={20} min={0}
                                        className="w-full p-2 border border-slate-300 rounded text-center font-bold outline-none focus:border-indigo-500 transition-all text-lg"
                                        value={student.score}
                                        onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                                        placeholder="-"
                                    />
                                </td>

                                {/* 5. BOTÓN DE ACCIÓN */}
                                <td className="p-4 align-top text-center">
                                    <button
                                        onClick={() => saveSingleGrade(student.studentId)}
                                        className={`p-2 rounded-lg transition-colors text-white flex items-center justify-center gap-2 w-full text-xs font-bold shadow-sm ${student.hasGrade
                                                ? 'bg-orange-500 hover:bg-orange-600'
                                                : 'bg-slate-900 hover:bg-slate-800'
                                            }`}
                                    >
                                        {student.hasGrade ? (
                                            <><RefreshCw size={14} /> Actualizar</>
                                        ) : (
                                            <><Save size={14} /> Guardar</>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay estudiantes en este curso.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};