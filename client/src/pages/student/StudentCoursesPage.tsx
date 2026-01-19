import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, ArrowRight, GraduationCap, Clock } from 'lucide-react';

interface StudentCourse {
  courseId: number;
  subjectName: string;
  code: string;
  level: number;
  progress: number;
}

export const StudentCoursesPage = () => {
  const navigate = useNavigate();
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

  const getGradient = (index: number) => {
    const gradients = [
      "from-violet-600 to-indigo-600",
      "from-pink-500 to-rose-500",
      "from-cyan-500 to-blue-500",
      "from-emerald-500 to-teal-500"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> Mis Materias
        </h1>
        <p className="text-slate-500">Accede a tus cursos y revisa tu progreso.</p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400">Cargando materias...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <div
              key={course.courseId}
              onClick={() => navigate(`/dashboard/course/${course.courseId}`)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className={`h-24 bg-gradient-to-r ${getGradient(index)} p-6 relative`}>
                <div className="absolute -bottom-6 left-6 bg-white p-3 rounded-xl shadow-md text-slate-700">
                  <GraduationCap size={24} />
                </div>
                <span className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                  Paralelo {course.code}
                </span>
              </div>

              <div className="pt-10 p-6">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-1">
                  {course.subjectName}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                  Semestre {course.level}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm">
                  <span className="text-slate-400 flex items-center gap-1 text-xs">
                    <Clock size={14} /> En curso
                  </span>
                  <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Entrar <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="p-10 text-center text-slate-400 border-2 border-dashed rounded-xl">
          No tienes materias inscritas.
        </div>
      )}
    </div>
  );
};