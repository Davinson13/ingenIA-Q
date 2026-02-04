import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    ArrowLeft, Users, FileText, Plus, CheckCircle2,
    ChevronDown, ChevronUp, Clock, XCircle, Save,
    GraduationCap, AlertTriangle, XOctagon, Calendar, BookOpen, Trash2
} from 'lucide-react';
import { AxiosError } from 'axios';

// --- UTILIDAD: FORMATO DE FECHA UTC ---
const formatDateUTC = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

// --- INTERFACES ---
type TabType = 'ACTIVITIES' | 'STUDENTS' | 'GRADES';

interface Activity {
    id: number;
    title: string;
    description: string;
    type: string;
    date: string;
}

interface StudentAttendance {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar?: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | null;
}

interface GradeBreakdown {
    INDIVIDUAL: number;
    GRUPAL: number;
    MEDIO: number;
    FINAL: number;
}

interface StudentGradeRow {
    studentId: number;
    fullName: string;
    avatar: string;
    finalTotal: number;
    attendancePct: number;
    breakdown: GradeBreakdown;
}

interface ApiGradeStudent {
    studentId: number;
    fullName: string;
    avatar: string;
    finalTotal: number;
    attendancePct: number;
    breakdown: GradeBreakdown;
}

interface ApiAttendanceRecord {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar?: string;
    status?: string;
}

// Fecha local YYYY-MM-DD
const getTodayLocalString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const TeacherCourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = getTheme('TEACHER');

    const [activeTab, setActiveTab] = useState<TabType>('ACTIVITIES');
    const [courseHeader, setCourseHeader] = useState({ name: 'Cargando curso...', code: '...' });

    // Datos
    const [activities, setActivities] = useState<Activity[]>([]);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [gradeMatrix, setGradeMatrix] = useState<StudentGradeRow[]>([]);

    // Stats
    const [stats, setStats] = useState({ approved: 0, suspended: 0, failed: 0, avg: 0 });

    // Formularios
    const [showAddForm, setShowAddForm] = useState(false);
    const [newActivity, setNewActivity] = useState({ title: '', description: '', date: '', time: '', type: 'INDIVIDUAL' });

    const [attendanceDate, setAttendanceDate] = useState<string>(getTodayLocalString());
    const [saving, setSaving] = useState(false);

    // --- 1. CARGA INICIAL (HEADER) ---
    useEffect(() => {
        if (!id) return;
        const loadCourseInfo = async () => {
            try {
                const res = await api.get(`/teacher/grades/${id}`);
                setCourseHeader({
                    name: res.data.courseName,
                    code: res.data.parallelCode
                });
            } catch (error) {
                console.error("Error cargando info del curso", error);
                setCourseHeader({ name: "Error al cargar", code: "-" });
            }
        };
        loadCourseInfo();
    }, [id]);

    // --- 2. FUNCIÓN FETCH GRADES ---
    const fetchGrades = useCallback(async () => {
        if (!id) return;
        try {
            const res = await api.get(`/teacher/grade-matrix/${id}`);
            const studentsData = res.data.students || [];

            const processedStudents: StudentGradeRow[] = studentsData.map((s: ApiGradeStudent) => ({
                studentId: s.studentId,
                fullName: s.fullName,
                avatar: s.avatar,
                finalTotal: s.finalTotal || 0,
                attendancePct: s.attendancePct || 100,
                breakdown: s.breakdown || { INDIVIDUAL: 0, GRUPAL: 0, MEDIO: 0, FINAL: 0 }
            }));

            setGradeMatrix(processedStudents);

            // CÁLCULO DE ESTADÍSTICAS
            const totalStudents = processedStudents.length;
            if (totalStudents > 0) {
                let approved = 0;
                let suspended = 0;
                let failed = 0;

                processedStudents.forEach(s => {
                    if (s.attendancePct < 60) {
                        failed++;
                    } else if (s.finalTotal >= 14) {
                        approved++;
                    } else if (s.finalTotal >= 9) {
                        suspended++;
                    } else {
                        failed++;
                    }
                });

                const avg = res.data.courseAverage || 0;
                setStats({ approved, suspended, failed, avg });
            }
        } catch (error) { console.error("Error cargando notas", error); }
    }, [id]);

    // 🔥 FUNCIÓN PARA EXPULSAR ALUMNO
    const handleKickStudent = async (studentId: number) => {
        if (!confirm("¿Estás seguro de eliminar a este estudiante del curso?")) return;

        try {
            // endpoint: delete /teacher/student con body
            await api.delete('/teacher/student', {
                data: {
                    subjectId: parseInt(id!),
                    studentId
                }
            });

            alert("Estudiante eliminado.");
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Error al eliminar estudiante");
        }
    };

    // --- 3. EFECTO DE CARGA DE DATOS PRINCIPALES ---
    useEffect(() => {
        if (!id) return;

        if (activeTab === 'ACTIVITIES') {
            api.get(`/teacher/events?courseId=${id}`)
                .then(res => setActivities(Array.isArray(res.data) ? res.data : []))
                .catch(err => console.error("Error cargando actividades", err));
        }

        if (activeTab === 'STUDENTS') {
            api.get(`/teacher/attendance?courseId=${id}&date=${attendanceDate}`)
                .then(res => {
                    const safeData = res.data.map((r: ApiAttendanceRecord) => ({
                        ...r,
                        status: (r.status || 'PRESENT') as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'
                    }));
                    setStudents(safeData);
                })
                .catch(err => console.error("Error cargando asistencia", err));
        }

        if (activeTab === 'GRADES') {
            fetchGrades();
        }

    }, [id, activeTab, attendanceDate, fetchGrades]);

    // --- HANDLERS ---

    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newActivity,
                date: newActivity.date,
                time: newActivity.time,
                parallelId: id
            };

            await api.post('/teacher/events', payload);

            const res = await api.get(`/teacher/events?courseId=${id}`);
            setActivities(res.data);

            setShowAddForm(false);
            setNewActivity({ title: '', description: '', date: '', time: '', type: 'INDIVIDUAL' });
            alert("✅ Actividad creada con éxito");
        } catch (error) {
            console.error(error);
            const err = error as AxiosError;
            if (err.response && err.response.status === 400) {
                alert("❌ Error: " + (err.response.data as string));
            } else {
                alert("❌ Error al crear actividad");
            }
        }
    };

    const handleDeleteActivity = async (activityId: number) => {
        if (!confirm("¿Borrar actividad? Se eliminarán las notas asociadas.")) return;
        try {
            await api.delete(`/teacher/events/${activityId}`);
            setActivities(prev => prev.filter(a => a.id !== activityId));
        } catch (error) { console.error(error); }
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({ enrollmentId: s.enrollmentId, status: s.status }));
            await api.post('/teacher/attendance', { date: attendanceDate, records });
            alert("✅ Asistencia guardada correctamente");
        } catch (error) {
            console.error(error);
            const err = error as { response?: { status: number; data: string } };
            if (err.response && err.response.status === 400) {
                alert("⚠️ Error: " + err.response.data);
            } else {
                alert("❌ Error guardando asistencia");
            }
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200';
            case 'LATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
            case 'EXCUSED': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            {/* HEADER DINÁMICO */}
            <div className={`text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden mb-8 -mx-4 sm:mx-0 sm:rounded-2xl bg-gradient-to-r ${theme.gradient}`}>
                <button onClick={() => navigate('/teacher/courses')} className="flex items-center text-white/80 hover:text-white transition-colors mb-4 z-10 relative">
                    <ArrowLeft size={18} className="mr-2" /> Volver a mis cursos
                </button>

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold">{courseHeader.name}</h1>
                    <p className="text-white/80 mt-1 flex items-center gap-2">
                        <BookOpen size={16} /> Paralelo {courseHeader.code}
                    </p>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
            </div>

            {/* PESTAÑAS */}
            <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    {[
                        { id: 'ACTIVITIES', label: 'Actividades', icon: FileText },
                        { id: 'STUDENTS', label: 'Asistencia', icon: Users },
                        { id: 'GRADES', label: 'Calificaciones', icon: GraduationCap }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id
                                ? `${theme.primary} text-white shadow-md`
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 1. SECCIÓN: ACTIVIDADES */}
            {activeTab === 'ACTIVITIES' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    {/* BOTÓN CREAR */}
                    <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="w-full flex justify-between items-center p-5 bg-white hover:bg-slate-50 transition-colors text-left group"
                        >
                            <span className="font-bold text-slate-800 flex items-center gap-3 text-lg">
                                <div className={`${theme.secondary} ${theme.text} p-2 rounded-lg transition-colors`}>
                                    <Plus size={20} />
                                </div>
                                Crear Nueva Actividad
                            </span>
                            {showAddForm ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </button>

                        {showAddForm && (
                            <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                                <form onSubmit={handleCreateActivity} className="grid gap-4 md:grid-cols-2">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                                        <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: Taller de Matrices" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Instrucciones</label>
                                        <textarea
                                            required
                                            name="description"
                                            value={newActivity.description}
                                            onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                            placeholder="Describe qué deben hacer los estudiantes..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Límite</label>
                                        <input required type="date" className="w-full p-3 border border-slate-300 rounded-lg" value={newActivity.date} onChange={e => setNewActivity({ ...newActivity, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora Límite</label>
                                        <input required type="time" className="w-full p-3 border border-slate-300 rounded-lg" value={newActivity.time} onChange={e => setNewActivity({ ...newActivity, time: e.target.value })} />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Actividad</label>
                                        <select className="w-full p-3 border border-slate-300 rounded-lg bg-white" value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}>
                                            <option value="INDIVIDUAL">Gestión Individual</option>
                                            <option value="GRUPAL">Gestión Grupal</option>
                                            <option value="MEDIO">Examen Medio Semestre</option>
                                            <option value="FINAL">Examen Final</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 pt-2">
                                        <button type="submit" className={`w-full py-3 ${theme.primary} ${theme.primaryHover} text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95`}>Guardar Actividad</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {activities.length === 0 && <div className="text-center text-slate-400 py-10">No hay actividades creadas.</div>}

                        {activities.map(act => (
                            <div key={act.id} className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-${theme.primary.split('-')[1]}-300 transition-all group`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold uppercase ${theme.secondary} ${theme.text} px-2 py-1 rounded border ${theme.border}`}>{act.type}</span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                <Clock size={12} /> {formatDateUTC(act.date)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 transition-colors">{act.title}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                                    </div>

                                    <div className="flex gap-2 self-end md:self-center">
                                        <button
                                            onClick={() => navigate(`/teacher/course/${id}/activity/${act.id}/grade`)}
                                            className={`px-5 py-2 ${theme.primary} text-white text-sm font-bold rounded-lg ${theme.primaryHover} transition-colors flex items-center gap-2 shadow-sm`}
                                        >
                                            <CheckCircle2 size={16} /> Calificar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteActivity(act.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar actividad"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. SECCIÓN: ASISTENCIA (Y ELIMINAR ESTUDIANTE) */}
            {activeTab === 'STUDENTS' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2"><Calendar className={theme.text} /><span className="font-bold text-slate-700">Asistencia del día:</span></div>
                        <input type="date" className="border border-slate-300 rounded-lg p-2 font-medium text-slate-700 outline-none focus:border-indigo-500" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {students.map(student => {
                                const isPastDate = attendanceDate < getTodayLocalString();

                                return (
                                    <div key={student.enrollmentId} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs">{student.fullName.substring(0, 2)}</div>
                                            <div>
                                                <h3 className="font-bold text-slate-700">{student.fullName}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(student.status)}`}>
                                                    {student.status === 'PRESENT' ? 'Presente' :
                                                        student.status === 'LATE' ? 'Atraso' :
                                                            student.status === 'EXCUSED' ? 'Justificado' : 'Falta'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            {/* BOTONES DE ASISTENCIA */}
                                            <button
                                                disabled={isPastDate}
                                                onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'PRESENT' } : s))}
                                                className={`p-2 rounded-lg transition-all ${isPastDate ? 'opacity-30 cursor-not-allowed bg-slate-100' : student.status === 'PRESENT' ? 'bg-green-500 text-white shadow-md' : 'bg-slate-100 hover:bg-green-100 text-slate-400'}`}
                                                title={isPastDate ? "No permitido" : "Presente"}
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>

                                            <button
                                                disabled={isPastDate}
                                                onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'LATE' } : s))}
                                                className={`p-2 rounded-lg transition-all ${isPastDate ? 'opacity-30 cursor-not-allowed bg-slate-100' : student.status === 'LATE' ? 'bg-yellow-500 text-white shadow-md' : 'bg-slate-100 hover:bg-yellow-100 text-slate-400'}`}
                                                title={isPastDate ? "No permitido" : "Atraso"}
                                            >
                                                <Clock size={20} />
                                            </button>

                                            <button
                                                disabled={isPastDate}
                                                onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'ABSENT' } : s))}
                                                className={`p-2 rounded-lg transition-all ${isPastDate ? 'opacity-30 cursor-not-allowed bg-slate-100' : student.status === 'ABSENT' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 hover:bg-red-100 text-slate-400'}`}
                                                title={isPastDate ? "No permitido" : "Falta"}
                                            >
                                                <XCircle size={20} />
                                            </button>

                                            <button
                                                onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'EXCUSED' } : s))}
                                                className={`p-2 rounded-lg transition-all ${student.status === 'EXCUSED' ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 hover:bg-blue-100 text-blue-400'}`}
                                                title="Justificar Falta"
                                            >
                                                <FileText size={20} />
                                            </button>

                                            {/* 🔥 BOTÓN DE ELIMINAR ESTUDIANTE */}
                                            <div className="w-px h-8 bg-slate-200 mx-2"></div>
                                            <button
                                                onClick={() => handleKickStudent(student.studentId)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                                title="Eliminar Estudiante del Curso"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="fixed bottom-8 right-8 animate-in zoom-in">
                        <button onClick={handleSaveAttendance} disabled={saving} className={`flex items-center gap-2 ${theme.primary} text-white px-6 py-4 rounded-full shadow-2xl ${theme.primaryHover} disabled:opacity-50 transform hover:scale-105 transition-transform`}>
                            <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. CALIFICACIONES */}
            {activeTab === 'GRADES' && (
                <div className="space-y-6 max-w-6xl mx-auto">

                    {/* TARJETAS DE RESUMEN (STATS) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase">Promedio Curso</span>
                            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.avg.toFixed(2)}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                            <span className="text-xs font-bold text-green-600 uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Aprobados</span>
                            <div className="text-2xl font-bold text-green-700 mt-1">{stats.approved}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
                            <span className="text-xs font-bold text-yellow-600 uppercase flex items-center gap-1"><AlertTriangle size={12} /> Suspensos</span>
                            <div className="text-2xl font-bold text-yellow-700 mt-1">{stats.suspended}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                            <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-1"><XOctagon size={12} /> Reprobados</span>
                            <div className="text-2xl font-bold text-red-700 mt-1">{stats.failed}</div>
                        </div>
                    </div>

                    {/* TABLA DETALLADA */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4 w-64 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Estudiante</th>
                                    <th className="p-4 text-center text-slate-400">Asistencia</th>

                                    {/* COLUMNAS DE PONDERACIÓN */}
                                    <th className="p-4 text-center bg-indigo-50/50 text-indigo-900">
                                        <div className="flex flex-col"><span>Indiv.</span><span className="text-[9px] opacity-60">Max 7</span></div>
                                    </th>
                                    <th className="p-4 text-center bg-indigo-50/50 text-indigo-900">
                                        <div className="flex flex-col"><span>Grupal</span><span className="text-[9px] opacity-60">Max 5</span></div>
                                    </th>
                                    <th className="p-4 text-center bg-indigo-50/50 text-indigo-900">
                                        <div className="flex flex-col"><span>Medio</span><span className="text-[9px] opacity-60">Max 2</span></div>
                                    </th>
                                    <th className="p-4 text-center bg-indigo-50/50 text-indigo-900">
                                        <div className="flex flex-col"><span>Final</span><span className="text-[9px] opacity-60">Max 6</span></div>
                                    </th>

                                    <th className="p-4 text-center font-black text-slate-700 border-l border-slate-200">TOTAL</th>
                                    <th className="p-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gradeMatrix.map(row => {
                                    const isFailedByAttendance = row.attendancePct < 60;

                                    return (
                                        <tr key={row.studentId} className="hover:bg-slate-50 transition-colors">
                                            {/* NOMBRE + AVATAR */}
                                            <td className="p-4 flex items-center gap-3 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <img src={row.avatar} className="w-9 h-9 rounded-full bg-slate-200 object-cover" alt="av" />
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{row.fullName}</p>
                                                    <p className="text-[10px] text-slate-400">ID: {row.studentId}</p>
                                                </div>
                                            </td>

                                            {/* ASISTENCIA */}
                                            <td className="p-4 text-center">
                                                <span className={`font-bold text-sm ${isFailedByAttendance ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-slate-600'}`}>
                                                    {row.attendancePct}%
                                                </span>
                                            </td>

                                            {/* NOTAS DESGLOSADAS */}
                                            <td className="p-4 text-center text-slate-600 font-medium bg-slate-50/30">{row.breakdown.INDIVIDUAL.toFixed(2)}</td>
                                            <td className="p-4 text-center text-slate-600 font-medium bg-slate-50/30">{row.breakdown.GRUPAL.toFixed(2)}</td>
                                            <td className="p-4 text-center text-slate-600 font-medium bg-slate-50/30">{row.breakdown.MEDIO.toFixed(2)}</td>
                                            <td className="p-4 text-center text-slate-600 font-medium bg-slate-50/30">{row.breakdown.FINAL.toFixed(2)}</td>

                                            {/* NOTA FINAL */}
                                            <td className="p-4 text-center border-l border-slate-200">
                                                <span className={`text-lg font-black ${isFailedByAttendance ? 'text-red-400 line-through decoration-2' :
                                                    row.finalTotal >= 14 ? 'text-green-600' :
                                                        row.finalTotal >= 9 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {row.finalTotal.toFixed(2)}
                                                </span>
                                            </td>

                                            {/* ESTADO FINAL */}
                                            <td className="p-4 text-center">
                                                {isFailedByAttendance ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-200 flex flex-col items-center">
                                                        <span>REPROBADO</span>
                                                        <span className="text-[8px] opacity-75">POR FALTAS</span>
                                                    </span>
                                                ) : (
                                                    <>
                                                        {row.finalTotal >= 14 && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">APROBADO</span>}
                                                        {row.finalTotal >= 9 && row.finalTotal < 14 && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">SUSPENSO</span>}
                                                        {row.finalTotal < 9 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">REPROBADO</span>}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {gradeMatrix.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-400">
                                            No hay estudiantes ni calificaciones registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};