import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    ArrowLeft, Users, FileText, Plus, CheckCircle2,
    ChevronDown, ChevronUp, Clock, XCircle, Save,
    GraduationCap, AlertTriangle, XOctagon, Calendar
} from 'lucide-react';

// --- INTERFACES ---
type TabType = 'ACTIVITIES' | 'STUDENTS' | 'GRADES';

interface Activity {
    id: number;
    title: string;
    description?: string;
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

interface StudentGradeRow {
    studentId: number;
    fullName: string;
    avatar: string;
    finalTotal: number;
}

// Interfaces auxiliares para respuestas de API (Evita el uso de any)
interface ApiMatrixStudent {
    studentId: number;
    fullName: string;
    avatar: string;
    finalTotal: number;
}

interface ApiAttendanceResponse {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar?: string;
    status?: string;
}

// 🔧 FIX: Función para obtener la fecha local "Hoy" (YYYY-MM-DD)
// Evita que new Date().toISOString() te devuelva mañana si es de noche en Ecuador
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

    const [activeTab, setActiveTab] = useState<TabType>('ACTIVITIES');
    const [courseName, setCourseName] = useState("Cargando...");

    // Datos
    const [activities, setActivities] = useState<Activity[]>([]);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [gradeMatrix, setGradeMatrix] = useState<StudentGradeRow[]>([]);

    // Stats
    const [stats, setStats] = useState({ approved: 0, suspended: 0, failed: 0, avg: 0 });

    // Formularios
    const [showAddForm, setShowAddForm] = useState(false);
    const [newActivity, setNewActivity] = useState({ title: '', description: '', date: '', time: '', type: 'INDIVIDUAL' });
    
    // 🔧 FIX: Inicializamos con la fecha local correcta
    const [attendanceDate, setAttendanceDate] = useState<string>(getTodayLocalString());
    
    const [saving, setSaving] = useState(false);

    // --- CARGA INICIAL ---
    useEffect(() => { setCourseName(`Curso (ID: ${id})`); }, [id]);

    // --- FUNCIÓN PARA CARGAR NOTAS ---
    const fetchGrades = useCallback(async () => {
        try {
            const res = await api.get(`/teacher/grade-matrix/${id}`);
            const matrixData = res.data;

            // Mapeo seguro tipado (SIN ANY)
            const processedStudents: StudentGradeRow[] = matrixData.students.map((s: ApiMatrixStudent) => ({
                studentId: s.studentId,
                fullName: s.fullName,
                avatar: s.avatar,
                finalTotal: s.finalTotal || 0,
            }));

            setGradeMatrix(processedStudents);

            // Calcular Estadísticas
            const totalStudents = processedStudents.length;
            if (totalStudents > 0) {
                const approved = processedStudents.filter((s) => s.finalTotal >= 13.5).length;
                const suspended = processedStudents.filter((s) => s.finalTotal >= 9.17 && s.finalTotal < 13.5).length;
                const failed = processedStudents.filter((s) => s.finalTotal < 9.17).length;
                const sumTotal = processedStudents.reduce((acc, s) => acc + s.finalTotal, 0);

                setStats({ approved, suspended, failed, avg: sumTotal / totalStudents });
            }
        } catch (error) { console.error("Error cargando notas", error); }
    }, [id]);

    // --- EFECTO DE CARGA DE DATOS ---
    useEffect(() => {
        if (activeTab === 'ACTIVITIES') {
            api.get(`/teacher/calendar?courseId=${id}`).then(res => setActivities(res.data));
        }

        if (activeTab === 'STUDENTS') {
            api.get(`/teacher/attendance?courseId=${id}&date=${attendanceDate}`).then(res => {
                // Mapeo seguro tipado (SIN ANY)
                const safeData = res.data.map((r: ApiAttendanceResponse) => ({
                    ...r,
                    status: (r.status || 'PRESENT') as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'
                }));
                setStudents(safeData);
            });
        }

        if (activeTab === 'GRADES') {
            fetchGrades();
        }
    }, [id, activeTab, attendanceDate, fetchGrades]);

    // --- HANDLERS ---
    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isoDate = new Date(`${newActivity.date}T${newActivity.time}`).toISOString();
            await api.post('/teacher/calendar', { ...newActivity, date: isoDate, parallelId: id });

            const res = await api.get(`/teacher/calendar?courseId=${id}`);
            setActivities(res.data);
            setShowAddForm(false);
            setNewActivity({ title: '', description: '', date: '', time: '', type: 'INDIVIDUAL' });
            alert("✅ Actividad creada");
        } catch (error) {
            console.error(error);
            alert("❌ Error al crear actividad");
        }
    };

    const handleDeleteActivity = async (activityId: number) => {
        if (!confirm("¿Borrar actividad?")) return;
        try {
            await api.delete(`/teacher/calendar/${activityId}`);
            setActivities(prev => prev.filter(a => a.id !== activityId));
        } catch (error) { console.error(error); }
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({
                enrollmentId: s.enrollmentId,
                status: s.status
            }));
            await api.post('/teacher/attendance', { date: attendanceDate, records });
            alert("✅ Asistencia guardada");
        } catch (error) {
            console.error(error);
            alert("❌ Error guardando asistencia");
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200';
            case 'LATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            <button onClick={() => navigate('/teacher/courses')} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={20} className="mr-1" /> Volver a mis cursos
            </button>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">{courseName}</h1>
                <p className="opacity-80 text-sm">Gestión Académica Integral</p>
            </div>

            {/* PESTAÑAS */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
                {[
                    { id: 'ACTIVITIES', label: 'Actividades', icon: FileText },
                    { id: 'STUDENTS', label: 'Asistencia', icon: Users },
                    { id: 'GRADES', label: 'Calificaciones', icon: GraduationCap }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* 1. ACTIVIDADES */}
            {activeTab === 'ACTIVITIES' && (
                <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button onClick={() => setShowAddForm(!showAddForm)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                            <span className="font-bold text-indigo-700 flex items-center gap-2"><Plus className="bg-indigo-100 rounded p-0.5" /> Crear Nueva Actividad</span>
                            {showAddForm ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </button>
                        {showAddForm && (
                            <div className="p-6 bg-white border-t border-slate-100">
                                <form onSubmit={handleCreateActivity} className="grid gap-4 md:grid-cols-2">
                                    <div className="col-span-2"><input required type="text" className="w-full p-2 border rounded-lg" placeholder="Título" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} /></div>
                                    <div><input required type="date" className="w-full p-2 border rounded-lg" value={newActivity.date} onChange={e => setNewActivity({ ...newActivity, date: e.target.value })} /></div>
                                    <div><input required type="time" className="w-full p-2 border rounded-lg" value={newActivity.time} onChange={e => setNewActivity({ ...newActivity, time: e.target.value })} /></div>
                                    <div><select className="w-full p-2 border rounded-lg" value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}><option value="INDIVIDUAL">Individual</option><option value="GRUPAL">Grupal</option><option value="MEDIO">Medio Semestre</option><option value="FINAL">Final</option></select></div>
                                    <div className="col-span-2"><button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg">Guardar</button></div>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {activities.map(act => (
                            <div key={act.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex gap-4 items-center w-full">
                                    <div className="bg-indigo-50 text-indigo-700 font-bold p-3 rounded-lg text-center min-w-[70px]">
                                        <span className="block text-xs uppercase">NOTA</span>
                                        <span className="text-xl">/20</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{act.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{act.type}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/teacher/course/${id}/activity/${act.id}/grade`)}
                                        className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                                    >
                                        <CheckCircle2 size={18} /> Calificar
                                    </button>
                                    <button onClick={() => handleDeleteActivity(act.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><XCircle size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. ASISTENCIA */}
            {activeTab === 'STUDENTS' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2"><Calendar className="text-slate-500" /><span className="font-bold text-slate-700">Asistencia del día:</span></div>
                        <input type="date" className="border border-slate-300 rounded-lg p-2 font-medium text-slate-700 outline-none" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {students.map(student => (
                                <div key={student.enrollmentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">{student.fullName.substring(0, 2).toUpperCase()}</div>
                                        <div>
                                            <h3 className="font-bold text-slate-700">{student.fullName}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(student.status)}`}>{student.status === 'PRESENT' ? 'Presente' : student.status === 'LATE' ? 'Atraso' : 'Falta'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'PRESENT' } : s))} className={`p-2 rounded-lg ${student.status === 'PRESENT' ? 'bg-green-500 text-white' : 'bg-slate-100'}`}><CheckCircle2 size={20} /></button>
                                        <button onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'LATE' } : s))} className={`p-2 rounded-lg ${student.status === 'LATE' ? 'bg-yellow-500 text-white' : 'bg-slate-100'}`}><Clock size={20} /></button>
                                        <button onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'ABSENT' } : s))} className={`p-2 rounded-lg ${student.status === 'ABSENT' ? 'bg-red-500 text-white' : 'bg-slate-100'}`}><XCircle size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="fixed bottom-8 right-8">
                        <button onClick={handleSaveAttendance} disabled={saving} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-slate-800 disabled:opacity-50">
                            <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    </div>
                </div>
            )}

            {/* 3. CALIFICACIONES DEL CURSO */}
            {activeTab === 'GRADES' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase">Promedio General</span>
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

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                                <tr><th className="p-4">Estudiante</th><th className="p-4 text-center">Nota Final</th><th className="p-4 text-center">Estado</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gradeMatrix.map(row => (
                                    <tr key={row.studentId} className="hover:bg-slate-50">
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={row.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt="av" />
                                            <span className="font-bold text-slate-700 text-sm">{row.fullName}</span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-lg">{row.finalTotal.toFixed(2)}</td>
                                        <td className="p-4 text-center">
                                            {row.finalTotal >= 13.5 && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">APROBADO</span>}
                                            {row.finalTotal >= 9.17 && row.finalTotal < 13.5 && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">SUSPENSO</span>}
                                            {row.finalTotal < 9.17 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">REPROBADO</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};