import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    BookOpen, Users, Clock, Plus,
    GraduationCap, Layers, ChevronRight, School
} from 'lucide-react';

// --- INTERFACES ---
interface Parallel {
    id: number;
    code: string;
    capacity: number;
    teacherId: number;
}

interface Subject {
    id: number;
    name: string;
    semesterLevel: number;
    parallels: Parallel[];
}

interface Career {
    id: number;
    name: string;
    subjects: Subject[];
}

interface UserTeacher {
    id: number;
    fullName: string;
    role: string;
}

export const AdminAcademicPage = () => {
    const theme = getTheme('ADMIN');

    // Estados de Datos
    const [careers, setCareers] = useState<Career[]>([]);
    const [teachers, setTeachers] = useState<UserTeacher[]>([]);

    // Estados de Selección (El flujo)
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null); // 👈 NUEVO
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // Estados de Modal
    const [showParallelModal, setShowParallelModal] = useState(false);
    const [parallelForm, setParallelForm] = useState({ code: 'A', capacity: 30, teacherId: '' });

    useEffect(() => {
        api.get('/admin/academic/structure').then(res => setCareers(res.data));
        api.get('/admin/users').then(res => {
            const teacherList = res.data.filter((u: UserTeacher) => u.role === 'TEACHER');
            setTeachers(teacherList);
        });
    }, []);

    // --- LÓGICA DE FILTRADO ---

    // 1. Obtener semestres únicos de la carrera seleccionada
    const semesters = selectedCareer
        ? Array.from(new Set(selectedCareer.subjects.map(s => s.semesterLevel))).sort((a, b) => a - b)
        : [];

    // 2. Filtrar materias por carrera Y semestre
    const filteredSubjects = selectedCareer && selectedSemester
        ? selectedCareer.subjects.filter(s => s.semesterLevel === selectedSemester)
        : [];

    // --- HANDLERS ---

    const handleSelectCareer = (c: Career) => {
        setSelectedCareer(c);
        setSelectedSemester(null); // Reiniciar cascada
        setSelectedSubject(null);
    };

    const handleSelectSemester = (sem: number) => {
        setSelectedSemester(sem);
        setSelectedSubject(null); // Reiniciar cascada
    };

    const handleCreateParallel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject) return;

        try {
            await api.post('/admin/academic/parallel', { ...parallelForm, subjectId: selectedSubject.id });
            alert("✅ Paralelo creado exitosamente");
            window.location.reload();
        } catch {
            alert("❌ Error al crear paralelo. Verifica que exista un periodo activo.");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-4">

            {/* HEADER */}
            <div className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black mb-1">Estructura Académica</h1>
                        <p className="text-emerald-100 opacity-90 text-sm">
                            Gestiona la oferta educativa: Carreras, Mallas, Materias y Paralelos.
                        </p>
                    </div>
                    <School className="opacity-20 absolute right-4 top-1/2 -translate-y-1/2" size={100} />
                </div>
            </div>

            {/* GRID PRINCIPAL (4 COLUMNAS AHORA) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* COL 1: CARRERAS (3 cols) */}
                <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <GraduationCap size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">1. Carreras</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {careers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleSelectCareer(c)}
                                className={`w-full text-left p-4 rounded-xl text-sm font-bold transition-all border flex justify-between items-center group
                                    ${selectedCareer?.id === c.id
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:border-slate-200'
                                    }`}
                            >
                                <span className="truncate">{c.name}</span>
                                {selectedCareer?.id === c.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* COL 2: SEMESTRES (2 cols) - 🔥 NUEVA COLUMNA */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <Layers size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">2. Nivel</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {selectedCareer ? semesters.map(sem => (
                            <button
                                key={sem}
                                onClick={() => handleSelectSemester(sem)}
                                className={`w-full text-center p-3 rounded-xl text-sm font-bold transition-all border
                                    ${selectedSemester === sem
                                        ? 'bg-emerald-600 text-white shadow-md border-emerald-600'
                                        : 'bg-white border-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                    }`}
                            >
                                {sem}º Semestre
                            </button>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                                <GraduationCap size={32} className="mb-2 opacity-50" />
                                <p className="text-xs">Elige una carrera primero</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 3: MATERIAS (3 cols) */}
                <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <BookOpen size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">3. Materias</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {selectedSemester ? filteredSubjects.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSubject(s)}
                                className={`w-full text-left p-3 rounded-xl text-sm transition-all border flex items-center gap-3
                                    ${selectedSubject?.id === s.id
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold shadow-sm'
                                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 border-slate-100'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full shrink-0 ${selectedSubject?.id === s.id ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <span className="truncate">{s.name}</span>
                            </button>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center">
                                <Layers size={32} className="mb-2 opacity-50" />
                                <p className="text-xs">Elige un nivel</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COL 4: DETALLE PARALELOS (4 cols) */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm relative">
                    {selectedSubject ? (
                        <>
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                <div>
                                    <h2 className="font-black text-slate-800 leading-tight">{selectedSubject.name}</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Gestión de Paralelos</p>
                                </div>
                                <button
                                    onClick={() => setShowParallelModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow-md transition-all"
                                    title="Crear Nuevo Paralelo"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 space-y-4 flex-1 bg-slate-50/30">
                                {selectedSubject.parallels.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl m-4">
                                        <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                            <Users size={24} />
                                        </div>
                                        <p className="text-slate-500 font-medium text-sm">No hay paralelos activos.</p>
                                        <p className="text-slate-400 text-xs mt-1">Crea el primero para este periodo.</p>
                                    </div>
                                )}

                                {selectedSubject.parallels.map((p) => (
                                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                    Paralelo {p.code}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                <Users size={12} /> {p.capacity} Cupos
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                                                    D
                                                </div>
                                                <span className="truncate font-medium">
                                                    {teachers.find(t => t.id === p.teacherId)?.fullName || <span className="text-red-400 italic">Sin asignar</span>}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-400 pl-8">
                                                <Clock size={12} />
                                                <span className="italic">Horario no configurado</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50/50">
                            <BookOpen size={48} className="mb-3 opacity-20" />
                            <p className="font-bold text-slate-400">Selecciona una materia</p>
                            <p className="text-xs max-w-[200px] mt-2">Para ver y gestionar los paralelos, primero elige la materia en el panel izquierdo.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CREAR PARALELO */}
            {showParallelModal && selectedSubject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
                        <h3 className="font-bold text-xl mb-1 text-slate-800">Nuevo Paralelo</h3>
                        <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">{selectedSubject.name}</p>

                        <form onSubmit={handleCreateParallel} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                                <input type="text" className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center uppercase" placeholder="A" maxLength={1} value={parallelForm.code} onChange={e => setParallelForm({ ...parallelForm, code: e.target.value.toUpperCase() })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cupo Máximo</label>
                                <input type="number" className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-center" value={parallelForm.capacity} onChange={e => setParallelForm({ ...parallelForm, capacity: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Docente Encargado</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={parallelForm.teacherId} onChange={e => setParallelForm({ ...parallelForm, teacherId: e.target.value })} required>
                                    <option value="">Seleccionar Docente...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowParallelModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-colors">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};