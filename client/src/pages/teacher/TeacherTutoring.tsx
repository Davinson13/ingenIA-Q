import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import { 
    Calendar, Users, Plus, CheckCircle2, MapPin, Monitor 
} from 'lucide-react';

// --- INTERFACES ---
interface TutoringSession {
    id: number;
    date: string;
    capacity: number;
    booked: number;
    notes: string;
    modality: string;
    subjectName: string;
    students: string[];
}

interface Subject { id: number; name: string; }

// 🔥 NUEVA INTERFAZ PARA CORREGIR EL 'ANY'
interface ApiCourseResponse {
    id: number; // ID del paralelo
    subject: {
        id: number;
        name: string;
    } | null; // Puede ser null si la base de datos tuviera inconsistencias
}

export const TeacherTutoring = () => {
    const theme = getTheme('TEACHER');
    
    const [tutorings, setTutorings] = useState<TutoringSession[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({ 
        date: '', 
        time: '', 
        subjectId: '0', 
        capacity: 15, 
        notes: '',
        modality: 'PRESENCIAL' 
    });
    const [creating, setCreating] = useState(false);

    // Cargar datos
    const fetchData = async () => {
        try {
            const [tutRes, subjRes] = await Promise.all([
                api.get('/teacher/tutorings'),
                api.get('/teacher/courses') 
            ]);
            
            setTutorings(tutRes.data);
            
            // Extraer materias únicas
            const uniqueSubjects = new Map<number, Subject>();
            
            // 👇 AQUÍ APLICAMOS EL TIPADO CORRECTO
            subjRes.data.forEach((c: ApiCourseResponse) => { 
                if (c.subject && !uniqueSubjects.has(c.subject.id)) {
                    uniqueSubjects.set(c.subject.id, { 
                        id: c.subject.id, 
                        name: c.subject.name 
                    });
                }
            });
            
            setSubjects(Array.from(uniqueSubjects.values()));

        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ... (El resto de funciones: handleTimeChange, handleCreate, etc. se mantienen igual)
    const handleTimeChange = (timeValue: string) => {
        const hour = parseInt(timeValue.split(':')[0]);
        if (hour >= 19) {
            setForm(prev => ({ ...prev, time: timeValue, modality: 'VIRTUAL' }));
        } else {
            setForm(prev => ({ ...prev, time: timeValue }));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date();
        const selectedDateTime = new Date(`${form.date}T${form.time}`);
        
        if (selectedDateTime < now) {
            alert("⚠️ No puedes programar tutorías en el pasado.");
            return;
        }

        const hour = parseInt(form.time.split(':')[0]);
        if (hour < 7 || hour > 22) {
            alert("⚠️ El horario permitido es de 07:00 AM a 10:00 PM.");
            return;
        }

        if (hour >= 19 && form.modality !== 'VIRTUAL') {
            alert("⚠️ Las tutorías nocturnas (19:00 - 22:00) deben ser VIRTUALES.");
            setForm(prev => ({ ...prev, modality: 'VIRTUAL' }));
            return;
        }

        setCreating(true);
        try {
            await api.post('/teacher/tutoring', form);
            alert("✅ Tutoría creada con éxito");
            setForm({ date: '', time: '', subjectId: '0', capacity: 15, notes: '', modality: 'PRESENCIAL' });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("❌ Error al crear tutoría");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-500">Cargando...</div>;

    const isNightTime = form.time ? parseInt(form.time.split(':')[0]) >= 19 : false;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            
            {/* HEADER */}
            <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <Users size={32}/> Gestión de Tutorías
                    </h1>
                    <p className="text-indigo-100">Programa sesiones de refuerzo (Virtuales o Presenciales).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. FORMULARIO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Plus className="text-purple-600 bg-purple-100 p-1 rounded-full" size={24}/> Nueva Sesión
                    </h3>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <input required type="date" min={new Date().toISOString().split('T')[0]} 
                                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora (7-22h)</label>
                                <input required type="time" 
                                    className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                    value={form.time} onChange={e => handleTimeChange(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modalidad</label>
                                <select 
                                    className={`w-full p-3 border border-slate-300 rounded-lg outline-none font-bold ${isNightTime ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                                    value={form.modality} 
                                    onChange={e => setForm({...form, modality: e.target.value})}
                                    disabled={isNightTime}
                                >
                                    <option value="PRESENCIAL">Presencial</option>
                                    <option value="VIRTUAL">Virtual</option>
                                </select>
                                {isNightTime && <p className="text-[10px] text-orange-500 mt-1">* Noche obligatoria virtual</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Materia</label>
                            <select className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})}>
                                <option value="0">General (Cualquier materia)</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cupos</label>
                            <input required type="number" min="1" max="50" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tema / Notas</label>
                            <textarea className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                                placeholder="Ej: Repaso para el examen parcial..."
                                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
                        </div>

                        <button type="submit" disabled={creating} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-lg flex justify-center items-center gap-2">
                            {creating ? 'Creando...' : 'Programar Tutoría'}
                        </button>
                    </form>
                </div>

                {/* 2. LISTA */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                        <Calendar className="text-purple-600"/> Próximas Sesiones
                    </h3>

                    {tutorings.length === 0 ? (
                        <div className="p-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400">
                            No tienes tutorías programadas.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tutorings.map(tut => (
                                <div key={tut.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-purple-50 text-purple-700 p-3 rounded-xl text-center min-w-[70px]">
                                                <span className="block text-xs font-bold uppercase">{new Date(tut.date).toLocaleDateString('es-ES', {month: 'short'})}</span>
                                                <span className="block text-2xl font-black">{new Date(tut.date).getDate()}</span>
                                                <span className="block text-xs font-bold">{new Date(tut.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            
                                            <div>
                                                <div className="flex gap-2 mb-2">
                                                    <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded ${tut.modality === 'VIRTUAL' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {tut.modality === 'VIRTUAL' ? <span className="flex items-center gap-1"><Monitor size={10}/> VIRTUAL</span> : <span className="flex items-center gap-1"><MapPin size={10}/> PRESENCIAL</span>}
                                                    </span>
                                                    <span className="inline-block text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                        {tut.subjectName}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg">{tut.notes || "Sin tema específico"}</h4>
                                                
                                                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                        <Users size={14}/> {tut.booked} / {tut.capacity} Inscritos
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {tut.booked > 0 && (
                                            <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Estudiantes:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {tut.students.map((name, idx) => (
                                                        <span key={idx} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 flex items-center gap-1">
                                                            <CheckCircle2 size={10} className="text-green-500"/> {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};