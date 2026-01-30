import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock,
    ChevronRight, ArrowLeft,
    AlertTriangle, CheckCircle2
} from 'lucide-react';

// Interfaces simplificadas para el frontend
interface Schedule {
    dayOfWeek: number; // 1=Lunes, 5=Viernes
    startTime: string;
    endTime: string;
}

interface Parallel {
    id: number;
    code: string;
    teacher: { fullName: string } | null;
    schedules: Schedule[];
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
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 a 20:00

export const GuestSchedulePage = () => {
    const navigate = useNavigate();

    // Estados de Datos
    const [careers, setCareers] = useState<Career[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [activePeriod, setActivePeriod] = useState("");

    // Estados de Selección
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

    // ESTADO DEL SIMULADOR (Las materias que el usuario "agrega")
    const [mySchedule, setMySchedule] = useState<Parallel[]>([]);

    useEffect(() => {
        api.get('/guest/careers').then(res => setCareers(res.data));
    }, []);

    useEffect(() => {
        if (selectedCareer) {
            api.get(`/guest/offer/${selectedCareer.id}`).then(res => {
                setSubjects(res.data.subjects);
                setActivePeriod(res.data.period);
            });
        }
    }, [selectedCareer]);

    // Lógica para agregar/quitar materias
    const toggleParallel = (subject: Subject, parallel: Parallel) => {
        // Verificar si ya tengo esta materia (cualquier paralelo)
        const existingIndex = mySchedule.findIndex(p =>
            subjects.find(s => s.parallels.some(par => par.id === p.id))?.id === subject.id
        );

        if (existingIndex >= 0) {
            // Si ya existe y es el mismo, lo quitamos
            if (mySchedule[existingIndex].id === parallel.id) {
                setMySchedule(prev => prev.filter(p => p.id !== parallel.id));
            } else {
                // Si es otro paralelo de la misma materia, lo reemplazamos
                const newSchedule = [...mySchedule];
                newSchedule[existingIndex] = parallel;
                setMySchedule(newSchedule);
            }
        } else {
            // Si no existe, lo agregamos
            setMySchedule([...mySchedule, parallel]);
        }
    };

    // Verificar choques de horario
    const checkConflict = (day: number, hour: number) => {
        const busy = mySchedule.filter(p =>
            p.schedules.some(s => {
                const start = parseInt(s.startTime.split(':')[0]);
                const end = parseInt(s.endTime.split(':')[0]);
                return s.dayOfWeek === day && hour >= start && hour < end;
            })
        );
        return busy;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* HEADER SIMPLIFICADO */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/login')}>
                        <ArrowLeft className="text-slate-400 hover:text-slate-600" />
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ingenIA-Q <span className="font-medium text-slate-400 text-sm ml-1">Simulador</span>
                        </span>
                    </div>
                    {selectedCareer && (
                        <div className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                            {activePeriod}
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">

                {/* SIDEBAR DE SELECCIÓN */}
                <aside className="w-96 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-lg z-20">

                    {/* 1. SELECTOR DE CARRERA */}
                    {!selectedCareer ? (
                        <div className="p-6 overflow-y-auto h-full">
                            <h2 className="text-xl font-black mb-4 text-slate-800">Elige tu Carrera</h2>
                            <div className="space-y-2">
                                {careers.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCareer(c)}
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 group-hover:text-blue-700">{c.name}</span>
                                            <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Carrera</p>
                                    <h3 className="font-bold text-blue-700 leading-tight">{selectedCareer.name}</h3>
                                </div>
                                <button onClick={() => { setSelectedCareer(null); setMySchedule([]); }} className="text-xs underline text-slate-400 hover:text-slate-600">Cambiar</button>
                            </div>

                            {/* 2. SELECTOR DE SEMESTRE */}
                            <div className="p-2 border-b border-slate-100 flex gap-2 overflow-x-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sem => (
                                    <button
                                        key={sem}
                                        onClick={() => setSelectedSemester(sem)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors
                                            ${selectedSemester === sem ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Sem {sem}
                                    </button>
                                ))}
                            </div>

                            {/* 3. LISTA DE MATERIAS Y PARALELOS */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {subjects.filter(s => !selectedSemester || s.semesterLevel === selectedSemester).map(subject => {
                                    // Verificar si ya está seleccionada
                                    const selectedParallel = mySchedule.find(p => subject.parallels.some(par => par.id === p.id));

                                    return (
                                        <div key={subject.id} className={`border rounded-xl overflow-hidden transition-all ${selectedParallel ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200'}`}>
                                            <div className="p-3 bg-white border-b border-slate-100">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-sm text-slate-800">{subject.name}</h4>
                                                    {selectedParallel && <CheckCircle2 size={16} className="text-blue-500" />}
                                                </div>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold">Semestre {subject.semesterLevel}</span>
                                            </div>
                                            <div className="bg-slate-50 p-2 space-y-2">
                                                {subject.parallels.map(p => {
                                                    const isSelected = selectedParallel?.id === p.id;
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => toggleParallel(subject, p)}
                                                            className={`w-full text-left p-2 rounded-lg text-xs border transition-all relative
                                                                ${isSelected
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                                                        >
                                                            <div className="flex justify-between mb-1">
                                                                <span className="font-bold">Paralelo {p.code}</span>
                                                                <span className="opacity-80">{p.teacher?.fullName || 'Sin docente'}</span>
                                                            </div>
                                                            {/* Mini Horario Textual */}
                                                            <div className="space-y-0.5 opacity-90">
                                                                {p.schedules.map(s => (
                                                                    <div key={s.dayOfWeek} className="flex gap-1 items-center">
                                                                        <Clock size={10} />
                                                                        <span>{DAYS[s.dayOfWeek - 1].substring(0, 3)} {s.startTime}-{s.endTime}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {subject.parallels.length === 0 && <p className="text-xs text-center text-slate-400 italic py-2">No hay paralelos</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>

                {/* VISUALIZADOR DE HORARIO (GRID) */}
                <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                <Calendar className="text-blue-600" /> Tu Horario Tentativo
                            </h2>
                            <div className="text-sm font-bold text-slate-500">
                                {mySchedule.length} materias seleccionadas
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* HEADER DIAS */}
                                <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                                    <div className="p-3 text-center text-xs font-bold text-slate-400 uppercase border-r border-slate-200">Hora</div>
                                    {DAYS.map(d => (
                                        <div key={d} className="p-3 text-center text-sm font-bold text-slate-700 border-r border-slate-200 last:border-0">{d}</div>
                                    ))}
                                </div>

                                {/* GRID HORAS */}
                                {HOURS.map(hour => (
                                    <div key={hour} className="grid grid-cols-6 border-b border-slate-100 last:border-0 h-24 relative">
                                        {/* Columna Hora */}
                                        <div className="p-2 text-center text-xs font-bold text-slate-400 border-r border-slate-200 flex flex-col justify-center bg-slate-50/30">
                                            <span>{hour}:00</span>
                                            <span className="text-[10px] opacity-50">{hour + 1}:00</span>
                                        </div>

                                        {/* Columnas Días */}
                                        {[1, 2, 3, 4, 5].map(day => {
                                            const conflicts = checkConflict(day, hour);
                                            const isConflict = conflicts.length > 1;

                                            return (
                                                <div key={day} className="border-r border-slate-100 last:border-0 relative p-1 transition-colors hover:bg-slate-50">
                                                    {conflicts.map((p, idx) => {
                                                        // Encontrar el nombre de la materia (reverse lookup ineficiente pero funcional para demo)
                                                        const subjectName = subjects.find(s => s.parallels.some(par => par.id === p.id))?.name;

                                                        return (
                                                            <div
                                                                key={p.id}
                                                                className={`absolute inset-1 rounded-lg p-2 text-xs flex flex-col justify-center shadow-sm border
                                                                    ${isConflict
                                                                        ? 'bg-red-100 border-red-200 text-red-800 z-20 opacity-90'
                                                                        : 'bg-blue-100 border-blue-200 text-blue-800 z-10'}`}
                                                                style={{
                                                                    top: idx * 4 + 'px',
                                                                    left: idx * 4 + 'px',
                                                                    right: idx * 4 + 'px' // Efecto cascada si hay choque
                                                                }}
                                                            >
                                                                {isConflict && <div className="flex items-center gap-1 text-[10px] font-black text-red-600 mb-1"><AlertTriangle size={10} /> CHOQUE</div>}
                                                                <span className="font-bold leading-tight line-clamp-2">{subjectName}</span>
                                                                <span className="text-[10px] opacity-80">Paralelo {p.code}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};