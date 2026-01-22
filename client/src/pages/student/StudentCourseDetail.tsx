import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    ArrowLeft, Calendar, Clock, TrendingUp, FileText,
    CircleCheck, CircleX, CircleAlert,
    ExternalLink, Send
} from 'lucide-react';

// Interfaz para la ACTIVIDAD REAL (Tarea)
interface StudentActivity {
    id: number;
    name: string;
    type: string; // INDIVIDUAL, GRUPAL
    description?: string;
    limitDate?: string; // Fecha límite
    myScore: number | null;
    submissionLink?: string | null;
}

// Interfaz para el RESUMEN DE NOTAS (Categoría)
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
}

interface ApiError { response?: { data?: string; }; }

type TabOption = 'ACTIVITIES' | 'GRADES' | 'ATTENDANCE';

const TABS: { id: TabOption; label: string; icon: React.ElementType }[] = [
    { id: 'ACTIVITIES', label: 'Actividades', icon: Calendar },
    { id: 'GRADES', label: 'Calificaciones', icon: TrendingUp },
    { id: 'ATTENDANCE', label: 'Asistencia', icon: Clock }
];

const formatDateUTC = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

export const StudentCourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabOption>('ACTIVITIES');
    const [data, setData] = useState<CourseData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
    const [linkInput, setLinkInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const res = await api.get(`/student/course/${id}`);
            setData(res.data);
        } catch (err: unknown) {
            console.error(err);
            const apiError = err as ApiError;
            const msg = apiError.response?.data || "Error de conexión";
            setError(typeof msg === 'string' ? msg : "Error desconocido");
        }
    };

    useEffect(() => { fetchData(); }, [id]);

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
            alert("Error al entregar tarea");
        } finally {
            setSubmitting(false);
        }
    };

    const openSubmitModal = (actId: number, currentLink?: string | null) => {
        setSelectedActivity(actId);
        setLinkInput(currentLink || "");
        setShowModal(true);
    };

    // 1️⃣ USO DE CircleX: Pantalla de Error
    if (error) return (
        <div className="p-20 text-center">
            <div className="inline-block p-4 bg-red-100 text-red-600 rounded-xl mb-4">
                <CircleX size={48} />
            </div>
            <p className="text-red-500">{error}</p>
        </div>
    );

    if (!data) return <div className="p-10 text-center">Cargando...</div>;

    const activitiesList = data.activities || [];
    const scoreSummaryList = data.scoreSummary || [];
    const attendanceList = data.attendance || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <button onClick={() => navigate('/dashboard/subjects')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={20} className="mr-1" /> Mis Materias
            </button>

            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10"><h1 className="text-3xl font-bold">{data.subjectName}</h1><p className="text-slate-400">Paralelo {data.parallelCode}</p></div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4"></div>
            </div>

            <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-xl">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 flex items-center gap-2 border-b-2 font-bold text-sm transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* 1. LISTA DE TAREAS REALES */}
            {activeTab === 'ACTIVITIES' && (
                <div className="grid gap-4">
                    {activitiesList.length === 0 && <div className="text-center text-slate-400 py-10">No hay actividades asignadas.</div>}

                    {activitiesList.map(act => (
                        <div key={act.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 text-indigo-600 font-bold p-3 rounded-lg text-center min-w-[50px]"><FileText size={24} /></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">{act.type}</span>
                                        {act.submissionLink ? (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><CircleCheck size={10} /> ENTREGADO</span>
                                        ) : (
                                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><Clock size={10} /> PENDIENTE</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-800">{act.name}</h3>
                                    {act.limitDate && (
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={12} /> Límite: {new Date(act.limitDate).toLocaleDateString()} {new Date(act.limitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                    {act.myScore !== null && <p className="text-xs text-green-600 font-bold">Nota: {act.myScore}/20</p>}
                                </div>
                            </div>

                            <div>
                                {act.submissionLink ? (
                                    <div className="flex gap-2">
                                        <a href={act.submissionLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"><ExternalLink size={16} /> Link Enviado</a>
                                        {act.myScore === null && (
                                            <button onClick={() => openSubmitModal(act.id, act.submissionLink)} className="px-3 py-2 text-slate-400 hover:text-indigo-600 text-xs font-bold border border-slate-200 rounded-lg">Editar</button>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={() => openSubmitModal(act.id)} className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md">
                                        <Send size={16} /> Entregar Tarea
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. RESUMEN DE NOTAS */}
            {activeTab === 'GRADES' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="font-bold text-slate-700">Resumen de Calificaciones</h3></div>
                        <table className="w-full text-left">
                            <thead className="bg-white text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                                <tr><th className="p-4">Categoría</th><th className="p-4 text-center">Peso</th><th className="p-4 text-center">Promedio (20)</th><th className="p-4 text-center">Puntos Ganados</th><th className="p-4 text-center">Estado</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {scoreSummaryList.length === 0 ? (
                                    <tr><td colSpan={5} className="p-4 text-center text-slate-400">Sin datos de resumen.</td></tr>
                                ) : scoreSummaryList.map((cat, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-sm font-bold text-slate-700">{cat.label}</td>
                                        <td className="p-4 text-center text-xs text-slate-500">{cat.weight} pts</td>
                                        <td className="p-4 text-center font-bold text-slate-700">{cat.average}</td>
                                        <td className="p-4 text-center font-bold text-indigo-600">{cat.weightedScore}</td>
                                        <td className="p-4 text-center">
                                            {/* Logica visual simple basada en promedio sobre 20 */}
                                            {cat.average >= 14 ? (
                                                <span className="text-green-600 flex justify-center"><CircleCheck size={16} /></span>
                                            ) : cat.average >= 9 ? (
                                                <span className="text-yellow-600 flex justify-center"><CircleAlert size={16} /></span>
                                            ) : (
                                                // 2️⃣ USO DE CircleX: Estado Reprobado
                                                <span className="text-red-600 flex justify-center"><CircleX size={16} /></span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-between items-center bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <div><span className="font-bold text-slate-700 block text-lg">Nota Final Acumulada</span></div>
                        <div className="text-right"><span className={`text-4xl font-bold ${data.finalTotal >= 14 ? 'text-green-600' : 'text-slate-700'}`}>{data.finalTotal.toFixed(2)}</span><span className="text-sm text-slate-400 font-medium"> / 20</span></div>
                    </div>
                </div>
            )}

            {/* 3. ASISTENCIA */}
            {activeTab === 'ATTENDANCE' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {attendanceList.map(att => (
                            <div key={att.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                <div className="flex items-center gap-3"><Calendar size={18} className="text-slate-400" /><span className="font-bold text-slate-700">{formatDateUTC(att.date)}</span></div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${att.status === 'PRESENT' ? 'bg-green-100 text-green-700' : att.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{att.status === 'PRESENT' ? 'ASISTIÓ' : att.status === 'LATE' ? 'ATRASO' : 'FALTA'}</span>
                            </div>
                        ))}
                        {attendanceList.length === 0 && <div className="p-8 text-center text-slate-400">No hay registros.</div>}
                    </div>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Entregar Tarea</h3>
                        <form onSubmit={handleSubmit}>
                            <input type="url" required placeholder="https://..." className="w-full p-3 border border-slate-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-indigo-500" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex justify-center items-center gap-2">{submitting ? 'Enviando...' : <><Send size={18} /> Enviar</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};