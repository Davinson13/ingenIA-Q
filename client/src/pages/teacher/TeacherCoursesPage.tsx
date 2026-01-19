import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Para navegar al detalle
import api from '../../api/axios';
import { BookOpen, Users, ArrowRight, GraduationCap } from 'lucide-react';

interface CourseCard {
  id: number;
  subjectName: string;
  code: string;
  // level: string; // Si tu backend lo envía, agrégalo
}

export const TeacherCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/teacher/courses');
        setCourses(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="text-indigo-600" /> Mis Cursos
        </h1>
        <p className="text-slate-500">Selecciona una materia para gestionar actividades, estudiantes y notas.</p>
      </div>

      {/* GRID DE TARJETAS */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Cargando cursos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              onClick={() => navigate(`/teacher/course/${course.id}`)} // <--- ESTO ES CLAVE: Navega al detalle
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">
                  Paralelo {course.code}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                {course.subjectName}
              </h3>
              
              <p className="text-slate-400 text-sm mb-6">
                Gestión académica del periodo actual.
              </p>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                   <Users size={16} />
                   <span>Ingresar al curso</span> 
                </div>
                <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                   <ArrowRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {courses.length === 0 && !loading && (
          <div className="text-center py-20 text-slate-400">
              No tienes cursos asignados todavía.
          </div>
      )}
    </div>
  );
};