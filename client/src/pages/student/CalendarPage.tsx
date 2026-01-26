import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalIcon,
  BookOpen, GraduationCap, Users, Star, Clock, Globe
  // Briefcase eliminado
} from 'lucide-react';

interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  color: string;
}

export const CalendarPage = () => {
  const theme = getTheme('STUDENT');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Formularios
  const [extraForm, setExtraForm] = useState({ title: '', description: '', date: '', time: '' });
  const [courseForm, setCourseForm] = useState({
    name: '', startTime: '', endTime: '', startDate: '', endDate: '',
    days: [] as number[]
  });

  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: AgendaEvent | null }>({
    visible: false, x: 0, y: 0, event: null
  });

  // Cargar Agenda
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/student/calendar?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`);
      setEvents(res.data);
    } catch (error) {
      console.error("Error cargando agenda", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Handlers (CORREGIDOS)
  // --- MANEJO DE EVENTO EXTRA (Personal) ---
  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚨 VALIDACIÓN: No fechas pasadas
    const selectedDate = new Date(`${extraForm.date}T${extraForm.time}`);
    const now = new Date();

    if (selectedDate < now) {
      alert("⚠️ No puedes agregar actividades en el pasado. Revisa la fecha y hora.");
      return;
    }

    try {
      await api.post('/student/calendar/personal', extraForm);
      alert("✅ Actividad creada con éxito");
      setShowExtraModal(false);
      setExtraForm({ title: '', description: '', date: '', time: '' }); // Limpiar form
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert("❌ Error al crear actividad");
    }
  };

  // --- MANEJO DE CURSO EXTERNO ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚨 VALIDACIÓN 1: Fecha de Inicio
    const start = new Date(courseForm.startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      alert("⚠️ El curso no puede iniciar en una fecha pasada.");
      return;
    }

    // 🚨 VALIDACIÓN 2: Fechas Coherentes
    if (courseForm.endDate < courseForm.startDate) {
      alert("⚠️ La fecha de fin no puede ser antes de la fecha de inicio.");
      return;
    }

    // 🚨 VALIDACIÓN 3: Horas Coherentes
    if (courseForm.startTime >= courseForm.endTime) {
      alert("⚠️ La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    try {
      await api.post('/student/calendar/external', courseForm);
      alert("✅ Curso complementario agregado");
      setShowCourseModal(false);
      setCourseForm({ name: '', startTime: '', endTime: '', startDate: '', endDate: '', days: [] }); // Limpiar
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert("❌ Error al crear curso");
    }
  };

  const toggleDay = (day: number) => {
    setCourseForm(prev => {
      const newDays = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days: newDays };
    });
  };

  // Render Calendario
  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === day && d.getMonth() === month;
      });
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`h-32 border border-slate-100 p-2 overflow-y-auto relative hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
          <span className={`text-sm font-bold block mb-1 ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{day}</span>
          <div className="space-y-1">
            {dayEvents.map((evt, idx) => (
              <div key={idx}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top, event: evt });
                }}
                onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                className={`text-[10px] px-2 py-1 rounded cursor-pointer truncate font-bold flex items-center gap-1 border
                                    ${evt.type === 'CLASE' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                    ${evt.type === 'DEBER' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                                    ${evt.type === 'EXAMEN' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                    ${evt.type === 'TUTORIA' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                    ${evt.type === 'COMPLEMENTARIO' ? 'bg-teal-100 text-teal-700 border-teal-200' : ''}
                                    ${evt.type === 'EXTRA' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                `}
              >
                {/* ÍCONOS SEGÚN TIPO */}
                {evt.type === 'CLASE' && <BookOpen size={10} />}
                {evt.type === 'EXAMEN' && <GraduationCap size={10} />}
                {evt.type === 'TUTORIA' && <Users size={10} />} {/* Aquí se usa Users */}
                {evt.type === 'COMPLEMENTARIO' && <Globe size={10} />}
                {evt.type === 'EXTRA' && <Star size={10} />}
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className={`text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden mb-8 -mx-4 sm:mx-0 sm:rounded-2xl bg-gradient-to-r ${theme.gradient}`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3"><CalIcon size={32} /> Calendario Académico</h1>
            <p className="text-blue-100 opacity-90">Organiza tus clases, deberes y vida personal.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ChevronLeft /></button>
            <h2 className="text-2xl font-bold w-48 text-center capitalize">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ChevronRight /></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowExtraModal(true)} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/30 flex items-center gap-2"><Star size={18} /> Extra</button>
            <button onClick={() => setShowCourseModal(true)} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2"><Plus size={18} /> Curso Ext.</button>
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex flex-wrap gap-4 justify-center text-xs font-bold text-slate-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Clases</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Deberes</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Exámenes</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Tutorías</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-teal-500"></span> Cursos Ext.</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Personal</span>
      </div>

      {/* CALENDARIO */}
      {loading ? <div className="p-20 text-center">Cargando...</div> :
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">{renderDays()}</div>
        </div>
      }

      {/* TOOLTIP */}
      {tooltip.visible && tooltip.event && (
        <div className="fixed z-50 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl w-48 pointer-events-none" style={{ top: tooltip.y - 10, left: tooltip.x, transform: 'translate(-50%, -100%)' }}>
          <div className="font-bold text-sm mb-1">{tooltip.event.title}</div>
          <div className="opacity-80 mb-2">{tooltip.event.description}</div>
          <div className="flex items-center gap-1 font-mono text-xs bg-white/10 p-1 rounded w-fit"><Clock size={10} /> {new Date(tooltip.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )}

      {/* MODAL EXTRA (Personal) */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Actividad Personal</h3>
            <form onSubmit={handleCreateExtra} className="space-y-3">
              <input required type="text" placeholder="Título (Ej: Gimnasio)" className="w-full p-3 border rounded-lg" value={extraForm.title} onChange={e => setExtraForm({ ...extraForm, title: e.target.value })} />
              <input required type="date" className="w-full p-3 border rounded-lg" value={extraForm.date} onChange={e => setExtraForm({ ...extraForm, date: e.target.value })} />
              <input required type="time" className="w-full p-3 border rounded-lg" value={extraForm.time} onChange={e => setExtraForm({ ...extraForm, time: e.target.value })} />
              <div className="flex gap-2"><button type="button" onClick={() => setShowExtraModal(false)} className="flex-1 py-3 text-slate-500 bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CURSO COMPLEMENTARIO */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Nuevo Curso Complementario</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <input required type="text" placeholder="Nombre (Ej: Inglés Avanzado)" className="w-full p-3 border rounded-lg" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} />
              <div className="flex gap-2">
                <input required type="time" className="w-1/2 p-3 border rounded-lg" value={courseForm.startTime} onChange={e => setCourseForm({ ...courseForm, startTime: e.target.value })} />
                <input required type="time" className="w-1/2 p-3 border rounded-lg" value={courseForm.endTime} onChange={e => setCourseForm({ ...courseForm, endTime: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2"><label className="text-xs font-bold">Inicia</label><input required type="date" className="w-full p-2 border rounded-lg" value={courseForm.startDate} onChange={e => setCourseForm({ ...courseForm, startDate: e.target.value })} /></div>
                <div className="w-1/2"><label className="text-xs font-bold">Termina</label><input required type="date" className="w-full p-2 border rounded-lg" value={courseForm.endDate} onChange={e => setCourseForm({ ...courseForm, endDate: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Días de la semana</label>
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5, 6, 0].map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)} className={`w-8 h-8 rounded-full text-xs font-bold ${courseForm.days.includes(d) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {['D', 'L', 'M', 'X', 'J', 'V', 'S'][d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 text-slate-500 bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-3 bg-teal-600 text-white rounded-lg">Agregar Curso</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};