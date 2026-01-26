import { useEffect, useState } from 'react'; // 👈 Se eliminó "React"
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { getTheme } from '../../utils/themeUtils';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, TrendingUp, AlertCircle,
  Calendar, CheckCircle2, MoreVertical
} from 'lucide-react';

interface DashboardData {
  stats: {
    average: number;
    pendingCount: number;
    activeCourses: number;
  };
  pendingTasks: {
    id: number;
    title: string;
    subject: string;
    date: string;
    type: string;
    daysLeft: number;
    parallelId: number;
  }[];
  todayClasses: {
    id: number;
    subject: string;
    time: string;
    classroom: string;
  }[];
  courses: {
    id: number;
    name: string;
    code: string;
    teacher: string;
    progress: number;
    average: number;
  }[];
}

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const theme = getTheme('STUDENT');
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(res => setData(res.data))
      // 🔥 SOLUCIÓN: Usamos 'unknown' en lugar de 'any'
      .catch((err: unknown) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center text-slate-500">Cargando tu escritorio...</div>;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* 1. BIENVENIDA Y STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`col-span-1 lg:col-span-2 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">¡Hola, {user?.fullName.split(' ')[0]}! 👋</h1>
            <p className="text-blue-100 text-lg opacity-90 mb-6">
              Tienes <strong className="text-white">{data.stats.pendingCount} tareas pendientes</strong> para esta semana.
            </p>
            <div className="flex gap-3">
              <Link to="/dashboard/calendar" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-sm transition-all text-sm flex items-center gap-2">
                <Calendar size={16} /> Ver Agenda
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <BookOpen size={200} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} className="text-blue-600" />
          </div>
          <span className="text-4xl font-black text-slate-800 mb-1">{data.stats.average}</span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Promedio General</span>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen size={80} className="text-purple-600" />
          </div>
          <span className="text-4xl font-black text-slate-800 mb-1">{data.stats.activeCourses}</span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cursos Activos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 2. COLUMNA IZQUIERDA */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="text-blue-600" /> Clases de Hoy
            </h3>
            {data.todayClasses.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No tienes clases hoy. ¡Día libre! 🎉</p>
            ) : (
              <div className="space-y-3">
                {data.todayClasses.map((cls, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="bg-white px-2 py-1 rounded border text-xs font-bold text-slate-600 whitespace-nowrap">
                      {cls.time}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{cls.subject}</p>
                      <p className="text-xs text-slate-500 mt-1">Aula: {cls.classroom}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🔥 MODIFICADO: Tareas Pendientes con Click */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="text-orange-500" /> Próximas Entregas
            </h3>
            {data.pendingTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto text-green-400 mb-2" size={32} />
                <p className="text-sm text-slate-400">¡Estás al día con todo!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.pendingTasks.map(task => (
                  <div
                    key={task.id}
                    // 👇 AQUÍ LA MAGIA: Navegamos pasando el ID de la actividad en el 'state'
                    onClick={() => navigate(`/dashboard/course/${task.parallelId}`, { state: { activityId: task.id } })}
                    className="group flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.subject} • {task.type}</p>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${task.daysLeft <= 1 ? 'bg-red-100 text-red-600' :
                      task.daysLeft <= 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                      {task.daysLeft === 0 ? 'Hoy' : `${task.daysLeft}d`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. COLUMNA DERECHA */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
              <BookOpen className="text-blue-600" /> Mis Cursos
            </h3>
            <Link to="/dashboard/subjects" className="text-xs font-bold text-blue-600 hover:underline">Ver todos</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.courses.map(course => (
              <Link to={`/dashboard/course/${course.id}`} key={course.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden">

                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {course.code.substring(0, 2)}
                  </div>
                  <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={16} /></button>
                </div>

                <h4 className="font-bold text-slate-800 text-lg mb-1 truncate">{course.name}</h4>
                <p className="text-xs text-slate-500 mb-4">{course.teacher}</p>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>Progreso: {course.progress}%</span>
                  {course.average > 0 && <span className="text-green-600">Nota: {course.average}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};