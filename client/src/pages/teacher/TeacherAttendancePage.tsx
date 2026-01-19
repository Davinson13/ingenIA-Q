import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar, UserCheck, CheckCircle2, XCircle, Clock, Save, Search } from 'lucide-react';

interface ApiCourse {
    id: number;
    subjectName: string;
    code: string;
}

interface StudentAttendance {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | null;
}

export const TeacherAttendancePage = () => {
    const [courses, setCourses] = useState<ApiCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Hoy YYYY-MM-DD
    const [students, setStudents] = useState<StudentAttendance[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 1. Cargar cursos
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/teacher/courses');
                setCourses(res.data);
                if (res.data.length > 0) setSelectedCourseId(res.data[0].id);
            } catch (error) { console.error(error); }
        };
        fetchCourses();
    }, []);

    // 2. Cargar lista de estudiantes al cambiar curso o fecha
    useEffect(() => {
        if (!selectedCourseId) return;

        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/teacher/attendance?courseId=${selectedCourseId}&date=${selectedDate}`);

                // Si vienen nulos (nunca se tomó lista), ponemos PRESENT por defecto para agilizar
                const preparedData = res.data.map((s: StudentAttendance) => ({
                    ...s,
                    status: s.status || 'PRESENT'
                }));

                setStudents(preparedData);
            } catch (error) {
                console.error("Error cargando asistencia", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [selectedCourseId, selectedDate]);

    // 3. Guardar todo
    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({
                enrollmentId: s.enrollmentId,
                status: s.status
            }));

            await api.post('/teacher/attendance', {
                date: selectedDate,
                records
            });
            alert("✅ Asistencia guardada correctamente");
        } catch (error) {
            console.error(error);
            alert("❌ Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    // Helpers visuales
    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200';
            case 'LATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck className="text-blue-600" /> Control de Asistencia
                    </h1>
                    <p className="text-slate-500">Registra la asistencia diaria de tus clases.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Selector de Curso */}
                    <select
                        className="bg-white p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCourseId || ''}
                        onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
                    >
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.subjectName} ({c.code})</option>
                        ))}
                    </select>

                    {/* Selector de Fecha */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            className="pl-10 p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* LISTA DE ESTUDIANTES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Barra de Totales */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Search size={16} />
                        <span>{students.length} Estudiantes listados</span>
                    </div>

                    <div className="flex gap-4 text-xs font-bold">
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> {students.filter(s => s.status === 'PRESENT').length} Presentes</span>
                        <span className="text-yellow-600 flex items-center gap-1"><Clock size={14} /> {students.filter(s => s.status === 'LATE').length} Atrasos</span>
                        <span className="text-red-600 flex items-center gap-1"><XCircle size={14} /> {students.filter(s => s.status === 'ABSENT').length} Faltas</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-400">Cargando lista...</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {students.map(student => (
                            <div key={student.enrollmentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">

                                {/* Info Estudiante */}
                                <div className="flex items-center gap-4">
                                    <img src={student.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-slate-200" />
                                    <div>
                                        <h3 className="font-bold text-slate-700">{student.fullName}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(student.status)}`}>
                                            {student.status === 'PRESENT' ? 'Presente' : student.status === 'LATE' ? 'Atraso' : 'Falta'}
                                        </span>
                                    </div>
                                </div>

                                {/* Botonera de Control */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'PRESENT' } : s))}
                                        className={`p-2 rounded-lg transition-all ${student.status === 'PRESENT' ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600'}`}
                                        title="Presente"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>

                                    <button
                                        onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'LATE' } : s))}
                                        className={`p-2 rounded-lg transition-all ${student.status === 'LATE' ? 'bg-yellow-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400 hover:bg-yellow-100 hover:text-yellow-600'}`}
                                        title="Atraso"
                                    >
                                        <Clock size={20} />
                                    </button>

                                    <button
                                        onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'ABSENT' } : s))}
                                        className={`p-2 rounded-lg transition-all ${student.status === 'ABSENT' ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'}`}
                                        title="Falta"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {students.length === 0 && <div className="p-8 text-center text-slate-400">No hay estudiantes en este curso.</div>}
                    </div>
                )}
            </div>

            {/* BOTÓN FLOTANTE DE GUARDAR */}
            <div className="fixed bottom-8 right-8">
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    <Save size={20} />
                    {saving ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
            </div>

        </div>
    );
};