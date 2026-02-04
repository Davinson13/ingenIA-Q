import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BookOpen, CheckCircle, Filter, Layers, User, LogOut } from 'lucide-react';

interface Career { id: number; name: string; totalSemesters: number; }
interface Course {
    id: number; // ID del Paralelo
    subjectId: number;
    name: string;
    code: string; // Paralelo A/B
    teacher: string;
    semester: number;
    capacity: number;
    enrolledCount: number;
    isFull: boolean;
    isEnrolled: boolean;
}

export const CatalogPage = () => {
    // Estados de Filtros
    const [careers, setCareers] = useState<Career[]>([]);
    const [selectedCareer, setSelectedCareer] = useState<number | ''>('');
    const [selectedSemester, setSelectedSemester] = useState<number | ''>('');

    // Estados de Datos
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("Selecciona una carrera y semestre para ver cursos.");

    // 1. Cargar Carreras al inicio
    useEffect(() => {
        api.get('/student/catalog/filters').then(res => setCareers(res.data.careers));
    }, []);

    // 2. Buscar Cursos cuando cambian los filtros
    const searchCourses = async () => {
        if (!selectedCareer || !selectedSemester) return;
        setLoading(true);
        setMsg("");
        try {
            const res = await api.get(`/student/catalog/courses?careerId=${selectedCareer}&semester=${selectedSemester}`);
            setCourses(res.data);
            if (res.data.length === 0) setMsg("No hay cursos abiertos para este semestre.");
        } catch (error) {
            console.error(error);
            setMsg("Error cargando cursos.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-búsqueda al seleccionar ambos
    useEffect(() => {
        if (selectedCareer && selectedSemester) {
            searchCourses();
        } else {
            setCourses([]);
        }
    }, [selectedCareer, selectedSemester]);

    const handleEnroll = async (parallelId: number) => {
        if (!confirm("¿Confirmar inscripción a este curso?")) return;
        try {
            await api.post('/student/enroll', { parallelId }); // Enviamos ID del Paralelo
            alert("¡Inscrito correctamente!");
            searchCourses(); // Recargar para actualizar cupos
        } catch (error: any) {
            alert(error.response?.data?.error || "Error al inscribirse");
        }
    };
    // Agrega esto antes del return
    const handleUnenroll = async (parallelId: number, subjectId: number) => {
        if (!confirm("¿Seguro que quieres anular esta inscripción?")) return;
        try {
            // Intentamos borrar usando el parallelId primero
            await api.delete(`/student/enroll/${parallelId}`);
            alert("✅ Te has dado de baja.");
            searchCourses(); // Recargar lista
        } catch (error) {
            // Si falla, intentamos con el subjectId (para curar zombis)
            try {
                await api.delete(`/student/enroll/${subjectId}`);
                alert("✅ Registro antiguo eliminado.");
                searchCourses();
            } catch (e) {
                alert("Error al darse de baja.");
            }
        }
    };

    // Generar array de semestres (1 al N) basado en la carrera seleccionada
    const currentCareer = careers.find(c => c.id === Number(selectedCareer));
    const semesterOptions = currentCareer
        ? Array.from({ length: currentCareer.totalSemesters }, (_, i) => i + 1)
        : [];

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Inscripción de Materias</h1>
                    <p className="text-slate-500">Selecciona tu carrera y nivel para ver la oferta académica.</p>
                </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid md:grid-cols-3 gap-4 items-end">

                {/* Selector Carrera */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Carrera</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            value={selectedCareer}
                            onChange={e => { setSelectedCareer(Number(e.target.value)); setSelectedSemester(''); }}
                        >
                            <option value="">-- Seleccionar --</option>
                            {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Selector Semestre */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semestre / Nivel</label>
                    <div className="relative">
                        <Layers className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50"
                            value={selectedSemester}
                            onChange={e => setSelectedSemester(Number(e.target.value))}
                            disabled={!selectedCareer}
                        >
                            <option value="">-- Seleccionar --</option>
                            {semesterOptions.map(num => <option key={num} value={num}>Semestre {num}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pb-1 text-xs text-slate-400">
                    * Solo se muestran cursos del periodo activo.
                </div>
            </div>

            {/* RESULTADOS */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Buscando oferta académica...</div>
            ) : courses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">

                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BookOpen size={100} className="text-blue-900" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg border border-blue-100">
                                        Paralelo {course.code}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${course.isFull ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                        {course.enrolledCount} / {course.capacity} Cupos
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">{course.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-3">
                                    <User size={14} /> {course.teacher}
                                </div>
                            </div>

                            <div className="mt-6 relative z-10">
                                {course.isEnrolled ? (
                                    // 🔥 Si ya está inscrito, mostramos botón ROJO para salir (y arreglar zombis)
                                    <button
                                        onClick={() => handleUnenroll(course.id, course.subjectId)} // Necesitas crear esta función, ver abajo
                                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    >
                                        <LogOut size={18} /> Darse de Baja
                                    </button>
                                ) : (
                                    // Si no, botón normal de inscribirse
                                    <button
                                        onClick={() => !course.isFull && handleEnroll(course.id)}
                                        disabled={course.isFull}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${course.isFull
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95'
                                            }`}
                                    >
                                        {course.isFull ? "Curso Lleno" : "Inscribirse"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">{msg}</p>
                </div>
            )}
        </div>
    );
};