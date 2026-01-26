import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowRight, GraduationCap, Clock, LayoutGrid } from 'lucide-react';
// 👇 Importar utilidades de tema
import { getTheme } from '../../utils/themeUtils';

interface StudentCourse {
  courseId: number;
  subjectName: string;
  code: string;
  level: number;
  progress: number;
}

// 🎨 Paleta de gradientes para estudiantes (Tonos más frescos/azules)
const CARD_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-cyan-500 to-blue-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-600",
];

export const StudentCoursesPage = () => {
  const navigate = useNavigate();
  // 🎨 TEMA ESTUDIANTE
  const theme = getTheme('STUDENT');

  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/student/courses');
        setCourses(res.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchCourses();
  }, []);

  if (loading) return <div className="p-20 text-center text-slate-500">Cargando materias...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* 🟢 HEADER DE LA PÁGINA (Estilo Premium) */}
      <div className={`p-8 rounded-b-3xl shadow-lg relative overflow-hidden -mx-4 sm:mx-0 sm:rounded-2xl text-white bg-gradient-to-r ${theme.gradient}`}>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutGrid size={32} className="opacity-80" /> Mis Materias
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            Accede a tus cursos y revisa tu progreso académico.
          </p>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      {/* GRID DE MATERIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {courses.map((course, index) => {
          // Selecciona gradiente cíclico
          const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

          return (
            <div
              key={course.courseId}
              onClick={() => navigate(`/dashboard/course/${course.courseId}`)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* 1. CABECERA DE COLOR */}
              <div className={`h-32 bg-gradient-to-r ${gradient} p-4 relative`}>
                <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                  PARALELO {course.code}
                </span>
              </div>

              {/* 2. CONTENIDO */}
              <div className="p-6 pt-0 flex-1 flex flex-col relative">

                {/* Icono Flotante */}
                <div className="w-14 h-14 bg-white rounded-xl shadow-md flex items-center justify-center -mt-7 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap size={24} className={`text-transparent bg-clip-text bg-gradient-to-r ${gradient}`} />
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">
                  {course.subjectName}
                </h3>

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                  Semestre {course.level}
                </p>

                {/* Footer "Entrar" */}
                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400 flex items-center gap-1 group-hover:text-slate-600 transition-colors">
                    <Clock size={14} /> En curso
                  </span>
                  <span className={`flex items-center gap-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent group-hover:gap-2 transition-all`}>
                    Entrar <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="p-10 text-center text-slate-400 border-2 border-dashed rounded-xl max-w-2xl mx-auto">
          No tienes materias inscritas para este periodo.
        </div>
      )}
    </div>
  );
};