import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Users, BookOpen, Search, ChevronDown, ChevronUp, Mail } from 'lucide-react';

interface Student {
  id: number;
  fullName: string;
  email: string;
  avatar: string;
}

interface Course {
  id: number;
  subjectName: string;
  code: string;
  period: string;
  studentCount: number;
  students: Student[];
}

export const TeacherCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/teacher/courses');
        setCourses(res.data);
      } catch (error) {
        console.error("Error cargando cursos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedCourse(expandedCourse === id ? null : id);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando tus cursos...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Mis Cursos</h1>
          <p className="text-slate-500">Gestión de asignaturas y listado de estudiantes</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-200">
           <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
           <p className="text-slate-500">No tienes cursos asignados para este periodo.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              
              {/* CABECERA DEL CURSO */}
              <div 
                onClick={() => toggleExpand(course.id)}
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {course.code}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{course.subjectName}</h3>
                    <p className="text-sm text-slate-500">Periodo {course.period}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-sm">
                    <Users size={16} />
                    <span className="font-semibold">{course.studentCount}</span> Estudiantes
                  </div>
                  {expandedCourse === course.id ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                </div>
              </div>

              {/* LISTA DE ESTUDIANTES (Desplegable) */}
              {expandedCourse === course.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2">
                  
                  {/* Buscador simple */}
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar estudiante..." 
                      className="w-full pl-10 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                          <th className="py-3 px-4">Estudiante</th>
                          <th className="py-3 px-4">Correo</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {course.students.map((student) => (
                          <tr key={student.id} className="hover:bg-white transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3">
                              <img src={student.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                              <span className="font-medium text-slate-700">{student.fullName}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-sm">{student.email}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                Activo
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Enviar Mensaje">
                                <Mail size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {course.students.length === 0 && (
                      <p className="text-center text-slate-400 py-6">No hay estudiantes inscritos aún.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};