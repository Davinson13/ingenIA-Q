import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
//import clsx from 'clsx';

interface ClassEvent {
  id: number;
  subjectName: string;
  dayOfWeek: number; // 1=Lunes, 5=Viernes
  startTime: string;
  endTime: string;
  classroom: string;
}

export const CalendarPage = () => {
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/schedule')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const hours = ['07:00', '09:00', '11:00', '14:00', '16:00', '18:00'];

  // Función para encontrar si hay clase en un día y hora específicos
  const findEvent = (dayIndex: number, time: string) => {
    // dayIndex + 1 porque en backend lunes es 1
    return events.find(e => e.dayOfWeek === dayIndex + 1 && e.startTime === time);
  };

  if (loading) return <div className="p-10 text-center">Cargando horario...</div>;

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mi Horario de Clases</h1>
          <p className="text-slate-500 mt-1">Periodo 2026-A</p>
        </div>
        <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
          <CalendarIcon size={24} />
        </div>
      </header>

      {/* HORARIO RESPONSIVO TIPO GRID */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left text-sm font-bold text-slate-500 w-24">Hora</th>
                {days.map(day => (
                  <th key={day} className="p-4 text-left text-sm font-bold text-slate-700">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hours.map(hour => (
                <tr key={hour} className="group hover:bg-slate-50/50">
                  {/* Columna de Hora */}
                  <td className="p-4 text-sm font-medium text-slate-400 border-r border-slate-100">
                    {hour}
                  </td>

                  {/* Columnas de Días */}
                  {days.map((_, index) => {
                    const event = findEvent(index, hour);
                    return (
                      <td key={index} className="p-2 h-24 align-top border-r border-slate-100 last:border-0">
                        {event ? (
                          <div className="bg-blue-100 border-l-4 border-blue-500 p-3 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                            <p className="font-bold text-blue-800 text-sm leading-tight mb-1">
                              {event.subjectName}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                              <Clock size={12} />
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin size={12} />
                              <span>{event.classroom}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-md border-2 border-dashed border-transparent hover:border-slate-200 transition-colors"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};