import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalIcon,
  BookOpen, GraduationCap, Users, Star, Clock
  // Trash2 eliminado
} from 'lucide-react';

// --- TIPOS ---
interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'CLASE' | 'ACADEMICO' | 'TUTORIA' | 'EXTRA';
  color: string;
}

export const TeacherCalendar = () => {
  const theme = getTheme('TEACHER');

  // Estado Fecha (Mes actual)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '' });

  // Estado Tooltip
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: AgendaEvent | null }>({
    visible: false, x: 0, y: 0, event: null
  });

  // --- CARGAR DATOS (CORREGIDO CON USECALLBACK) ---
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const res = await api.get(`/teacher/calendar?month=${month}&year=${year}`);
      setEvents(res.data);
    } catch (error) {
      console.error("Error cargando agenda", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]); // Dependencia: si cambia la fecha, se recrea la función

  // CORREGIDO: Ahora fetchEvents es estable y seguro ponerlo aquí
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- MANEJO DE MESES ---
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // --- MANEJO DE EVENTO EXTRA ---
  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teacher/calendar/personal', form);
      alert("✅ Actividad extracurricular creada");
      setShowModal(false);
      setForm({ title: '', description: '', date: '', time: '' });
      fetchEvents();
    } catch (error) {
      console.error(error); // CORREGIDO: Usamos la variable para evitar warning
      alert("❌ Error al crear actividad");
    }
  };

  // --- RENDERIZADO DEL CALENDARIO ---
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Relleno inicial (días vacíos antes del 1ro)
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);
    }

    // Días reales
    for (let day = 1; day <= daysInMonth; day++) {
      // Filtrar eventos de este día
      const dayEvents = events.filter(e => {
        const eDate = new Date(e.date);
        // Usamos getUTCDate para evitar desfase visual si la hora es UTC
        // Ojo: Asegúrate que backend envía ISO string correcto
        return eDate.getDate() === day && eDate.getMonth() === month;
      });

      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`h-32 border border-slate-100 p-2 overflow-y-auto relative hover:bg-slate-50 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
          <span className={`text-sm font-bold block mb-1 ${isToday ? 'text-indigo-600 bg-indigo-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
            {day}
          </span>

          <div className="space-y-1">
            {dayEvents.map((evt, idx) => (
              <div
                key={idx}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top, event: evt });
                }}
                onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                className={`text-[10px] px-2 py-1 rounded cursor-pointer truncate font-medium flex items-center gap-1 border
                                    ${evt.type === 'CLASE' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                    ${evt.type === 'ACADEMICO' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                                    ${evt.type === 'TUTORIA' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                    ${evt.type === 'EXTRA' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                `}
              >
                {/* Icono según tipo */}
                {evt.type === 'CLASE' && <BookOpen size={10} />}
                {evt.type === 'ACADEMICO' && <GraduationCap size={10} />}
                {evt.type === 'TUTORIA' && <Users size={10} />}
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* HEADER Y CONTROLES */}
      <div className={`text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden mb-8 -mx-4 sm:mx-0 sm:rounded-2xl bg-gradient-to-r ${theme.gradient}`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <CalIcon size={32} /> Mi Agenda
            </h1>
            <p className="text-indigo-100 opacity-90">Gestión de Clases, Tutorías y Actividades.</p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"><ChevronLeft /></button>
            <h2 className="text-2xl font-bold w-48 text-center capitalize">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"><ChevronRight /></button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Extracurricular
          </button>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex flex-wrap gap-4 justify-center text-xs font-bold text-slate-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Clases</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Tareas/Exámenes</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Tutorías</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Extracurriculares</span>
      </div>

      {/* GRILLA DEL CALENDARIO */}
      {loading ? (
        <div className="p-20 text-center text-slate-400">Cargando agenda...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Encabezados Días */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
            ))}
          </div>
          {/* Celdas */}
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>
      )}

      {/* TOOLTIP FLOTANTE */}
      {tooltip.visible && tooltip.event && (
        <div
          className="fixed z-50 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none w-48"
          style={{ top: tooltip.y - 10, left: tooltip.x, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-bold text-sm mb-1">{tooltip.event.title}</div>
          <div className="opacity-80 mb-2">{tooltip.event.description}</div>
          <div className="flex items-center gap-1 font-mono text-xs bg-white/10 p-1 rounded w-fit">
            <Clock size={10} />
            {new Date(tooltip.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
        </div>
      )}

      {/* MODAL AGREGAR EXTRACURRICULAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Agregar Actividad Extracurricular</h3>
            <form onSubmit={handleCreateExtra} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                <input required type="text" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Reunión Consejo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                <textarea className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalles..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                  <input required type="date" min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                  <input required type="time"
                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};