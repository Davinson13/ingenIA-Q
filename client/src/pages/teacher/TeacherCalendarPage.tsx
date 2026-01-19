import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, 
  Clock, MapPin, BookOpen, User 
} from 'lucide-react';

// --- INTERFACES ---
interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  date: string; 
  type: string; 
  parallel?: { name: string };
}

interface ApiCourse {
  id: number;
  subjectName: string;
  code: string;
}

export const TeacherCalendarPage = () => {
  // Estados
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date: '', time: '', type: 'TUTORIA', courseId: ''
  });

  // --- 1. CARGA INICIAL (CORREGIDO: Funciones DENTRO del efecto) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar Cursos
        const resCourses = await api.get('/teacher/courses');
        setCourses(resCourses.data);
        // Pre-seleccionar el primer curso para el formulario
        if(resCourses.data.length > 0) {
            setNewEvent(prev => ({...prev, courseId: resCourses.data[0].id.toString()}));
        }

        // Cargar Eventos
        const resEvents = await api.get('/teacher/calendar'); 
        setEvents(resEvents.data);
      } catch (e) { console.error("Error cargando datos:", e); }
    };

    fetchData();
  }, []); // Array vacío = Solo se ejecuta al montar el componente. ¡Cero errores!

  // Función auxiliar para recargar eventos después de guardar
  const reloadEvents = async () => {
      try {
        const res = await api.get('/teacher/calendar'); 
        setEvents(res.data);
      } catch (e) { console.error(e); }
  };

  // --- 2. LÓGICA DE CALENDARIO ---
  
  // Obtener el Lunes
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  }, [currentDate]);

  // Generar semana (CORREGIDO: Dependencia startOfWeek)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) { 
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(d);
    }
    return days;
  }, [startOfWeek]); 

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); 

  const getEventsForSlot = (day: Date, hour: number) => {
    return events.filter(ev => {
        const evDate = new Date(ev.date);
        return (
            evDate.getDate() === day.getDate() &&
            evDate.getMonth() === day.getMonth() &&
            evDate.getHours() === hour
        );
    });
  };

  // --- 3. CREAR EVENTO ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isoDate = new Date(`${newEvent.date}T${newEvent.time}`).toISOString();
      
      await api.post('/teacher/calendar', {
        title: newEvent.title,
        description: newEvent.description,
        date: isoDate,
        type: newEvent.type,
        parallelId: newEvent.courseId 
      });
      
      setShowModal(false);
      setNewEvent({ title: '', description: '', date: '', time: '', type: 'TUTORIA', courseId: courses[0]?.id.toString() || '' });
      
      // Recargar la lista
      reloadEvents();
      
      alert("✅ Agendado en el cronograma");
    } catch (error) { 
        console.error(error); // Usamos la variable error
        alert("Error al guardar"); 
    }
  };

  // --- HELPERS VISUALES ---
  const getEventStyle = (type: string) => {
    if(['INDIVIDUAL', 'GRUPAL', 'MEDIO', 'FINAL'].includes(type)) return "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200";
    if(type === 'TUTORIA') return "bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200";
    if(type === 'EXTRA') return "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200";
    return "bg-slate-100 border-slate-300 text-slate-700";
  };

  const getEventIcon = (type: string) => {
    if(type === 'TUTORIA') return <User size={14} />;
    if(type === 'EXTRA') return <MapPin size={14} />;
    return <BookOpen size={14} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" /> Cronograma Semanal
          </h1>
          <p className="text-slate-500">Visualiza clases, tutorías y actividades extracurriculares.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
                <span className="px-4 font-bold text-slate-700 min-w-[140px] text-center">
                    {startOfWeek.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - 
                    {new Date(startOfWeek.getTime() + 4*24*60*60*1000).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                </span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors flex items-center gap-2">
                <Plus size={20} /> Agendar Evento
            </button>
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
          <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200">
                  <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase border-r border-slate-100">Hora</div>
                  {weekDays.map((day, i) => (
                      <div key={i} className={`p-3 text-center border-r border-slate-100 ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-50/50' : ''}`}>
                          <span className="block text-xs font-bold text-slate-500 uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                          <span className={`block text-xl font-bold ${day.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-slate-800'}`}>{day.getDate()}</span>
                      </div>
                  ))}
              </div>
              <div className="divide-y divide-slate-100">
                  {hours.map(hour => (
                      <div key={hour} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr]">
                          <div className="p-4 text-center text-xs font-medium text-slate-400 border-r border-slate-100 relative"><span className="-top-2 relative bg-white px-1">{hour}:00</span></div>
                          {weekDays.map((day, i) => (
                              <div key={i} className="p-1 min-h-[80px] border-r border-slate-100 relative hover:bg-slate-50 transition-colors">
                                  {getEventsForSlot(day, hour).map(ev => (
                                      <div key={ev.id} className={`p-2 rounded-lg mb-1 border text-xs cursor-pointer relative group transition-all hover:scale-[1.02] shadow-sm ${getEventStyle(ev.type)}`}>
                                          <div className="font-bold flex justify-between items-start"><span>{ev.title}</span>{getEventIcon(ev.type)}</div>
                                          <div className="opacity-80 mt-1 flex items-center gap-1 text-[10px]"><Clock size={10}/> {new Date(ev.date).getMinutes() === 0 ? `${hour}:00` : new Date(ev.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                          {ev.parallel && <div className="text-[9px] font-bold mt-1 opacity-75">Paralelo {ev.parallel.name}</div>}
                                      </div>
                                  ))}
                              </div>
                          ))}
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Agendar Evento</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label><input required type="text" className="w-full p-2 border rounded-lg" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Ej: Tutoría" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label><select className="w-full p-2 border rounded-lg" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}><option value="TUTORIA">Tutoría</option><option value="EXTRA">Extracurricular</option></select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label><input required type="date" className="w-full p-2 border rounded-lg" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label><input required type="time" className="w-full p-2 border rounded-lg" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular Curso</label><select className="w-full p-2 border rounded-lg" value={newEvent.courseId} onChange={e => setNewEvent({...newEvent, courseId: e.target.value})}>{courses.map(c => <option key={c.id} value={c.id}>{c.subjectName} - {c.code}</option>)}</select></div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">Guardar</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};