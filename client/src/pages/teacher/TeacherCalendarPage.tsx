import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar as CalendarIcon, Plus, Trash2, BookOpen, Clock } from 'lucide-react';

interface ApiCourse {
  id: number;
  subjectName: string;
  code: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
}

export const TeacherCalendarPage = () => {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // ESTE ES EL TRUCO: Una variable simple que usaremos para recargar
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estado para el Formulario
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'INDIVIDUAL'
  });

  // 1. Cargar cursos al inicio
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/teacher/courses');
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourseId(res.data[0].id);
      } catch (error) { console.error("Error cargando cursos:", error); }
    };
    fetchCourses();
  }, []);

  // 2. CARGAR EVENTOS (Simplificado al máximo)
  useEffect(() => {
    if (!selectedCourseId) return;

    // Definimos la función DENTRO del efecto para evitar bucles
    const getEvents = async () => {
        try {
          const res = await api.get(`/teacher/calendar?courseId=${selectedCourseId}`);
          setEvents(res.data);
        } catch (error) { 
            console.error("Error cargando eventos:", error); 
        }
    };

    getEvents();
  }, [selectedCourseId, refreshTrigger]); // Se ejecuta si cambia el curso O el trigger

  // 3. Crear Evento
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      const isoDate = new Date(`${newEvent.date}T${newEvent.time}`).toISOString();

      await api.post('/teacher/calendar', {
        title: newEvent.title,
        description: newEvent.description,
        date: isoDate,
        type: newEvent.type,
        parallelId: selectedCourseId
      });

      setShowModal(false);
      setNewEvent({ title: '', description: '', date: '', time: '', type: 'INDIVIDUAL' }); 
      
      // AQUÍ LA MAGIA: Simplemente cambiamos el número para forzar la recarga
      setRefreshTrigger(prev => prev + 1); 

    } catch (error) {
      console.error("Error al crear el evento:", error);
      alert("Hubo un error al crear la actividad.");
    }
  };

  // 4. Borrar Evento
  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres borrar este evento?")) return;
    try {
      await api.delete(`/teacher/calendar/${id}`);
      // Recargamos la lista
      setRefreshTrigger(prev => prev + 1);
    } catch (error) { console.error(error); }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
        case 'INDIVIDUAL': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'GRUPAL': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'MEDIO': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'FINAL': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" /> Agenda Académica
          </h1>
          <p className="text-slate-500">Planifica las actividades y evaluaciones.</p>
        </div>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <BookOpen className="text-indigo-600 ml-2" size={20} />
            <select 
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer min-w-[200px]"
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
            >
                {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.subjectName} ({c.code})</option>
                ))}
            </select>
        </div>
      </div>

      {/* BOTÓN AGREGAR */}
      <button 
        onClick={() => setShowModal(true)}
        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex justify-center items-center gap-2"
      >
        <Plus /> Agregar Nueva Actividad
      </button>

      {/* LISTA DE EVENTOS */}
      <div className="grid gap-4">
        {events.length === 0 ? (
             <div className="text-center py-10 text-slate-400">No hay actividades programadas.</div>
        ) : (
             events.map(ev => (
                <div key={ev.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group">
                    <div className="flex gap-4">
                        {/* Fecha */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center min-w-[80px]">
                            <span className="block text-xs uppercase font-bold text-slate-500">
                                {new Date(ev.date).toLocaleDateString('es-ES', { month: 'short' })}
                            </span>
                            <span className="block text-2xl font-bold text-slate-800">
                                {new Date(ev.date).getDate()}
                            </span>
                        </div>

                        {/* Detalles */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(ev.type)}`}>
                                    {ev.type}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={12}/> {new Date(ev.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{ev.title}</h3>
                            <p className="text-sm text-slate-500">{ev.description || "Sin descripción"}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleDelete(ev.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
             ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Nueva Actividad</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
                </div>
                
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg" 
                            value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Ej: Examen Unidad 1" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                            <input required type="date" className="w-full p-2 border border-slate-300 rounded-lg" 
                                value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
                            <input required type="time" className="w-full p-2 border border-slate-300 rounded-lg" 
                                value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                        <select className="w-full p-2 border border-slate-300 rounded-lg"
                            value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                        >
                            <option value="INDIVIDUAL">Gestión Individual</option>
                            <option value="GRUPAL">Gestión Grupal</option>
                            <option value="MEDIO">Examen Medio Semestre</option>
                            <option value="FINAL">Examen Final</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                        <textarea className="w-full p-2 border border-slate-300 rounded-lg" rows={3}
                            value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Detalles de la actividad..." />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        Agendar Actividad
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};