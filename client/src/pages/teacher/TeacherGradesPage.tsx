import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Save, Search, BookOpen, Calculator, AlertCircle } from 'lucide-react';

// 1. INTERFAZ PARA CORREGIR EL ERROR DE "ANY"
interface ApiCourse {
  id: number;
  subjectName: string;
  code: string;
}

// Interfaces de la Matriz
interface Activity {
  id: number;
  name: string;
  type: string;
  maxScore: number;
}

interface StudentGradeRow {
  enrollmentId: number;
  studentId: number;
  fullName: string;
  email: string;
  avatar: string;
  grades: { [activityId: number]: number };
  finalTotal: number;
}

interface GradeMatrix {
  activities: Activity[];
  students: StudentGradeRow[];
}

interface CourseSimple {
  id: number;
  subjectName: string;
  code: string;
}

export const TeacherGradesPage = () => {
  const [courses, setCourses] = useState<CourseSimple[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<GradeMatrix | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar Cursos
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/teacher/courses');
        
        // CORRECCIÓN: Usamos la interfaz ApiCourse aquí
        const simpleCourses = res.data.map((c: ApiCourse) => ({
             id: c.id, 
             subjectName: c.subjectName, 
             code: c.code 
        }));
        
        setCourses(simpleCourses);
        if (simpleCourses.length > 0) {
          setSelectedCourseId(simpleCourses[0].id);
        }
      } catch (error) {
        console.error("Error cargando cursos", error);
      }
    };
    fetchCourses();
  }, []);

  // Cargar Matriz cuando cambia el curso
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchMatrix = async () => {
      setLoading(true);
      setMatrix(null); // Limpiar anterior
      try {
        const res = await api.get(`/teacher/grade-matrix/${selectedCourseId}`);
        setMatrix(res.data);
      } catch (error) {
        console.error("Error cargando matriz:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, [selectedCourseId]);

  // Manejar inputs
  const handleInputChange = (studentId: number, activityId: number, value: string) => {
    if (!matrix) return;
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    if (numValue > 20) numValue = 20; 

    const updatedStudents = matrix.students.map(s => {
        if (s.studentId === studentId) {
            const newGrades = { ...s.grades, [activityId]: numValue };
            return { ...s, grades: newGrades }; 
        }
        return s;
    });
    setMatrix({ ...matrix, students: updatedStudents });
  };

  // Guardar nota
  const saveGrade = async (studentId: number, activityId: number, score: number) => {
    setSaving(true);
    try {
      await api.post('/teacher/grade-activity', { studentId, activityId, score });
      console.log("Nota guardada");
    } catch (error) {
      console.error("Error guardando nota:", error);
      alert("Error al guardar nota");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Libro de Calificaciones</h1>
          <p className="text-slate-500">Gestiona las notas por actividad y evalúa el progreso.</p>
        </div>
        
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <BookOpen className="text-indigo-600 ml-2" size={20} />
            <select 
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer min-w-[200px]"
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
            >
                {courses.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.subjectName} - Paralelo {c.code}
                    </option>
                ))}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Barra Superior */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar estudiante..." 
                  className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 w-64"
                />
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-100">
                <AlertCircle size={14} />
                <span>Notas automáticas al salir (Blur) o Enter</span>
            </div>
        </div>

        {loading || !matrix ? (
            <div className="p-10 text-center text-slate-400">
               {loading ? "Cargando matriz..." : "Selecciona un curso para ver las notas"}
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                            <th className="p-4 min-w-[200px]">Estudiante</th>
                            {matrix.activities.map(act => (
                                <th key={act.id} className="p-4 text-center min-w-[120px]">
                                    <div className="flex flex-col items-center">
                                        <span>{act.name}</span>
                                        <span className="text-[10px] bg-slate-200 px-1.5 rounded mt-1 text-slate-600">{act.type}</span>
                                    </div>
                                </th>
                            ))}
                            <th className="p-4 text-center min-w-[100px] bg-slate-100 font-bold text-slate-700">
                                <div className="flex items-center justify-center gap-1">
                                    <Calculator size={14} /> Total
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {matrix.students.map((student) => (
                            <tr key={student.enrollmentId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={student.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt="avatar" />
                                        <p className="font-bold text-slate-700 text-sm">{student.fullName}</p>
                                    </div>
                                </td>

                                {matrix.activities.map(act => (
                                    <td key={act.id} className="p-2 text-center border-l border-slate-50 relative group">
                                        <input 
                                            type="number" 
                                            disabled={saving}
                                            className="w-16 text-center text-sm font-medium p-1.5 rounded border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all disabled:opacity-50"
                                            value={student.grades[act.id] || ''}
                                            onChange={(e) => handleInputChange(student.studentId, act.id, e.target.value)}
                                            onBlur={(e) => saveGrade(student.studentId, act.id, parseFloat(e.target.value) || 0)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    saveGrade(student.studentId, act.id, parseFloat((e.target as HTMLInputElement).value) || 0);
                                                    (e.target as HTMLInputElement).blur();
                                                }
                                            }}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 pointer-events-none">
                                            <Save size={12} />
                                        </div>
                                    </td>
                                ))}

                                <td className="p-4 text-center bg-slate-50 font-bold border-l border-slate-200">
                                    <span className={`${
                                        student.finalTotal >= 14 ? 'text-green-600' : 
                                        student.finalTotal >= 10 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {student.finalTotal.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};