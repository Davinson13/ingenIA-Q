import { useEffect, useState, useCallback } from 'react'; // 👈 Eliminado "React" para evitar el warning
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    ArrowLeft, Calendar, Clock, TrendingUp, FileText,
    CircleCheck, CircleX, CircleAlert,
    ExternalLink, Send, BookOpen, MessageSquare, Percent
} from 'lucide-react';

// --- UTILIDAD: FORMATO DE FECHA UTC ---
const formatDateUTC = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const dayName = days[date.getUTCDay()];
    const day = date.getUTCDate();
    const monthName = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    return `${dayName}, ${day} de ${monthName} de ${year}`;
};

// --- INTERFACES ---
interface StudentActivity {
    id: number;
    name: string;
    type: string;
    description?: string;
    limitDate?: string;
    myScore: number | null;
    submissionLink?: string | null;
    submittedAt: string | null;
    feedback?: string | null;
}

interface ScoreCategory {
    category: string;
    label: string;
    weight: number;
    average: number;
    weightedScore: number;
}

interface AgendaEvent { id: number; title: string; description?: string; date: string; type: string; }
interface AttendanceRecord { id: number; date: string; status: string; }

interface CourseData {
    subjectName: string;
    parallelCode: string;
    activities?: StudentActivity[];
    scoreSummary?: ScoreCategory[];
    finalTotal: number;
    agenda?: AgendaEvent[];
    attendance?: AttendanceRecord[];
    attendancePct: number;
}

// 🔥 NUEVA INTERFAZ PARA EL ESTADO DE NAVEGACIÓN
interface LocationState {
    activityId?: number;
}

// --- CONSTANTES ---
type TabOption = 'ACTIVITIES' | 'GRADES' | 'ATTENDANCE';

const TABS: { id: TabOption; label: string; icon: React.ElementType }[] = [
    { id: 'ACTIVITIES', label: 'Actividades', icon: FileText },
    { id: 'GRADES', label: 'Calificaciones', icon: TrendingUp },
    { id: 'ATTENDANCE', label: 'Asistencia', icon: Calendar }
];

export const StudentCourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = getTheme('STUDENT');

    const [activeTab, setActiveTab] = useState<TabOption>('ACTIVITIES');
    const [data, setData] = useState<CourseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
    const [linkInput, setLinkInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/student/course/${id}`);
            setData(res.data);
            setError(null);
        } catch (err: unknown) {
            console.error(err);
            setError("No se pudo cargar la información del curso.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivity || !linkInput) return;
        setSubmitting(true);
        try {
            await api.post('/student/submit', { activityId: selectedActivity, link: linkInput });
            alert("✅ Tarea entregada con éxito");
            setShowModal(false);
            setLinkInput("");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("❌ Error al entregar tarea");
        } finally {
            setSubmitting(false);
        }
    };

    const openSubmitModal = (actId: number, currentLink?: string | null) => {
        setSelectedActivity(actId);
        setLinkInput(currentLink || "");
        setShowModal(true);
    };

    // 🔥 EFECTO CORREGIDO (SIN ANY)
    useEffect(() => {
        // Hacemos un "cast" seguro a nuestra interfaz LocationState
        const state = location.state as LocationState;

        if (data && state && state.activityId) {
            const targetId = state.activityId;
            const targetActivity = data.activities?.find(a => a.id === targetId);

            if (targetActivity) {
                setActiveTab('ACTIVITIES');
                openSubmitModal(targetActivity.id, targetActivity.submissionLink);
                window.history.replaceState({}, document.title);
            }
        }
    }, [data, location.state]);

    const getStatusBadge = (act: StudentActivity) => {
        const now = new Date();
        const limit = act.limitDate ? new Date(act.limitDate) : null;
        const submittedDate = act.submittedAt ? new Date(act.submittedAt) : null;

        if (act.myScore !== null) return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><CircleCheck size={12} /> Calificado</span>;
        if (act.submissionLink) {
            if (limit && submittedDate && submittedDate > limit) return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><CircleAlert size={12} /> Retraso</span>;
            return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><CircleCheck size={12} /> Entregado</span>;
        }
        if (limit && now > limit) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><CircleX size={12} /> Atrasado</span>;
        return <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Pendiente</span>;
    };

    if (loading) return <div className="p-20 text-center text-slate-500">Cargando curso...</div>;
    if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;
    if (!data) return null;

    const isFailedByAttendance = data.attendancePct < 60;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* HEADER */}
            <div className={`text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden mb-8 -mx-4 sm:mx-0 sm:rounded-2xl bg-gradient-to-r ${theme.gradient}`}>
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-white/80 hover:text-white transition-colors mb-4 z-10 relative"><ArrowLeft size={18} className="mr-2" /> Volver al Dashboard</button>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold">{data.subjectName}</h1>
                    <p className="text-white/80 mt-1 flex items-center gap-2"><BookOpen size={16} /> Paralelo {data.parallelCode}</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? `${theme.primary} text-white shadow-md` : 'text-slate-500 hover:bg-slate-50'}`}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 1. ACTIVIDADES */}
            {activeTab === 'ACTIVITIES' && (
                <div className="max-w-4xl mx-auto space-y-4">
                    {(!data.activities || data.activities.length === 0) && <div className="text-center text-slate-400 py-10">No hay actividades.</div>}
                    {data.activities?.map(act => (
                        <div key={act.id} className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-${theme.primary.split('-')[1]}-200 transition-all`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] ${theme.secondary} ${theme.text} px-2 py-1 rounded uppercase font-bold tracking-wider border ${theme.border}`}>{act.type}</span>
                                        {getStatusBadge(act)}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">{act.name}</h3>
                                    {act.limitDate && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Calendar size={12} /> Límite: {new Date(act.limitDate).toLocaleString()}</p>}
                                </div>
                                <div className="text-right">
                                    {act.myScore !== null ? <div className="flex flex-col items-end"><span className={`text-3xl font-black ${theme.text}`}>{Number(act.myScore).toFixed(2)}</span><span className="text-xs text-slate-400 font-bold">/ 20</span></div> : <div className="text-sm text-slate-300 font-bold italic">-- / 20</div>}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">{act.description || "Sin descripción."}</p>
                            {act.feedback && <div className={`mb-4 ${theme.secondary} border ${theme.border} p-3 rounded-lg`}><div className="flex items-center gap-2 mb-1"><MessageSquare size={14} className={theme.text} /><span className={`text-xs font-bold ${theme.text} uppercase`}>Comentario:</span></div><p className={`text-sm ${theme.text} opacity-90 italic`}>"{act.feedback}"</p></div>}
                            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                                {act.submissionLink ? <><a href={act.submissionLink} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 ${theme.secondary} ${theme.text} text-sm font-bold rounded-lg hover:bg-opacity-80 flex items-center gap-2`}><ExternalLink size={16} /> Ver entrega</a>{act.myScore === null && <button onClick={() => openSubmitModal(act.id, act.submissionLink)} className="px-4 py-2 text-slate-500 text-sm font-bold hover:text-slate-700">Editar Link</button>}</> : <button onClick={() => openSubmitModal(act.id)} className={`px-6 py-2 ${theme.primary} text-white text-sm font-bold rounded-lg ${theme.primaryHover} flex items-center gap-2 shadow-sm`}><Send size={16} /> Entregar</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. CALIFICACIONES */}
            {activeTab === 'GRADES' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="font-bold text-slate-700 flex items-center gap-2"><TrendingUp size={18} /> Resumen Académico</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-white text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                                    <tr><th className="p-4">Categoría</th><th className="p-4 text-center">Peso</th><th className="p-4 text-center">Promedio (20)</th><th className={`p-4 text-center ${theme.text}`}>Ponderado</th><th className="p-4 text-center">Estado</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.scoreSummary?.map((cat, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-sm font-bold text-slate-700">{cat.label}</td>
                                            <td className="p-4 text-center text-xs text-slate-500">{cat.weight} pts</td>
                                            <td className="p-4 text-center font-bold text-slate-700">{cat.average}</td>
                                            <td className={`p-4 text-center font-black ${theme.text}`}>{cat.weightedScore}</td>
                                            <td className="p-4 text-center">
                                                {cat.average >= 14 ? <span className="text-green-500 flex justify-center tooltip" title="Aprobado"><CircleCheck size={18} /></span> : cat.average >= 9 ? <span className="text-yellow-500 flex justify-center tooltip" title="Riesgo"><CircleAlert size={18} /></span> : <span className="text-red-500 flex justify-center tooltip" title="Reprobado"><CircleX size={18} /></span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data.scoreSummary || data.scoreSummary.length === 0) && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Sin calificaciones.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CARD DE ASISTENCIA */}
                        <div className={`p-6 rounded-xl flex justify-between items-center shadow-lg border ${isFailedByAttendance ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                            <div>
                                <p className={`text-sm font-bold uppercase tracking-wider ${isFailedByAttendance ? 'text-red-600' : 'text-slate-500'}`}>Porcentaje Asistencia</p>
                                <p className={`text-xs mt-1 ${isFailedByAttendance ? 'text-red-400' : 'text-slate-400'}`}>Mínimo requerido: 60%</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-4xl font-black ${isFailedByAttendance ? 'text-red-600' : 'text-slate-800'}`}>
                                    {data.attendancePct}%
                                </span>
                            </div>
                        </div>

                        {/* CARD DE NOTA FINAL */}
                        <div className={`text-white p-6 rounded-xl flex justify-between items-center shadow-lg bg-gradient-to-r ${isFailedByAttendance ? 'from-red-500 to-red-700' : theme.gradient}`}>
                            <div>
                                <p className="text-white/80 text-sm font-bold uppercase tracking-wider">
                                    {isFailedByAttendance ? "ESTADO FINAL" : "Nota Final Acumulada"}
                                </p>
                                {isFailedByAttendance && <p className="text-xs text-white font-bold bg-white/20 px-2 py-1 rounded mt-1 inline-block">REPROBADO POR FALTAS</p>}
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-white">{data.finalTotal.toFixed(2)}</span>
                                <span className="text-lg text-white/60 font-medium"> / 20</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. ASISTENCIA */}
            {activeTab === 'ATTENDANCE' && (
                <div className="max-w-4xl mx-auto">
                    <div className={`mb-6 p-4 rounded-xl flex items-center justify-between border ${isFailedByAttendance ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${isFailedByAttendance ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <Percent size={24} />
                            </div>
                            <div>
                                <h3 className={`font-bold ${isFailedByAttendance ? 'text-red-700' : 'text-slate-700'}`}>Tu Asistencia Global</h3>
                                <p className="text-xs text-slate-500">Recuerda que con menos del 60% repruebas el curso.</p>
                            </div>
                        </div>
                        <div className={`text-2xl font-black ${isFailedByAttendance ? 'text-red-600' : 'text-slate-800'}`}>
                            {data.attendancePct}%
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-700">Historial de Clases</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {data.attendance?.map(att => (
                                <div key={att.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Calendar size={18} /></div>
                                        <div><p className="font-bold text-slate-700 capitalize">{formatDateUTC(att.date)}</p></div>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${att.status === 'PRESENT' ? 'bg-green-50 border-green-200 text-green-700' :
                                        att.status === 'LATE' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                            att.status === 'EXCUSED' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                'bg-red-50 border-red-200 text-red-700'
                                        }`}>
                                        {att.status === 'PRESENT' ? 'ASISTIÓ' : att.status === 'LATE' ? 'ATRASO' : att.status === 'EXCUSED' ? 'JUSTIFICADO' : 'FALTA'}
                                    </span>
                                </div>
                            ))}
                            {(!data.attendance || data.attendance.length === 0) && <div className="p-10 text-center text-slate-400">No hay registros.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Entregar</h3><button onClick={() => setShowModal(false)}><CircleX /></button></div>
                        <form onSubmit={handleSubmit}>
                            <input type="url" required placeholder="https://..." className="w-full p-3 border rounded mb-4" value={linkInput} onChange={e => setLinkInput(e.target.value)} />
                            <div className="flex gap-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancelar</button><button type="submit" disabled={submitting} className={`flex-1 py-2 ${theme.primary} text-white rounded`}>Enviar</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};