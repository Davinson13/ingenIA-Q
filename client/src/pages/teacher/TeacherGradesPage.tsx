import { useEffect, useState } from 'react';
import { Search, BookOpen, Calculator, AlertCircle, Save } from 'lucide-react';

import api from '../../api/axios';

// ----------------------------------------------------
// 1. CONFIGURATION & TYPES
// ----------------------------------------------------

// WEIGHTS (Must match backend logic for mirror calculation)
const WEIGHTS: { [key: string]: number } = {
    'INDIVIDUAL': 7,
    'GRUPAL': 5,
    'MEDIO': 2,
    'FINAL': 6
};

interface ApiCourse {
    id: number;
    subjectName: string;
    code: string;
}

// Matrix Interfaces
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

/**
 * TeacherGradesPage Component
 * Provides a spreadsheet-like interface for teachers to input grades for all students
 * across all activities in a selected course. Calculates totals in real-time.
 */
export const TeacherGradesPage = () => {
    // State
    const [courses, setCourses] = useState<CourseSimple[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [matrix, setMatrix] = useState<GradeMatrix | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // ----------------------------------------------------
    // 2. LOAD COURSES (Fixes empty menu issue)
    // ----------------------------------------------------
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get<ApiCourse[]>('/teacher/courses');

                // Map using ApiCourse interface to avoid TS errors
                const simpleCourses = res.data.map((c) => ({
                    id: c.id,
                    subjectName: c.subjectName,
                    code: c.code
                }));

                setCourses(simpleCourses);

                // Auto-select first course if available
                if (simpleCourses.length > 0) {
                    setSelectedCourseId(simpleCourses[0].id);
                }
            } catch (error) {
                console.error("Error loading courses", error);
            }
        };
        fetchCourses();
    }, []);

    // ----------------------------------------------------
    // 3. LOAD GRADE MATRIX
    // ----------------------------------------------------
    useEffect(() => {
        if (!selectedCourseId) return;

        const fetchMatrix = async () => {
            setLoading(true);
            setMatrix(null); // Clear screen while loading
            try {
                const res = await api.get<GradeMatrix>(`/teacher/grade-matrix/${selectedCourseId}`);
                setMatrix(res.data);
            } catch (error) {
                console.error("Error loading matrix:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMatrix();
    }, [selectedCourseId]);

    // ----------------------------------------------------
    // 4. MATH LOGIC (Real-time Calculation)
    // ----------------------------------------------------

    // Helper function to calculate a student's total average
    const calculateStudentTotal = (grades: { [id: number]: number }, activities: Activity[]) => {
        let totalPoints = 0;

        // Group scores by type
        const scoresByType: { [key: string]: number[] } = {
            'INDIVIDUAL': [], 'GRUPAL': [], 'MEDIO': [], 'FINAL': []
        };

        activities.forEach(act => {
            const score = grades[act.id] || 0; // If no grade, assume 0 for calculation
            if (scoresByType[act.type]) {
                scoresByType[act.type].push(score);
            }
        });

        // Calculate weighted average
        Object.keys(WEIGHTS).forEach(type => {
            const scores = scoresByType[type];
            const weight = WEIGHTS[type];

            if (scores.length > 0) {
                const sum = scores.reduce((a, b) => a + b, 0);
                const avg20 = sum / scores.length;
                const weightedPoints = (avg20 * weight) / 20;
                totalPoints += weightedPoints;
            }
        });

        return totalPoints;
    };

    // Input Change Handler (Updates State + Recalculates Total)
    const handleInputChange = (studentId: number, activityId: number, value: string) => {
        if (!matrix) return;

        // Number validation
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        if (numValue > 20) numValue = 20;
        if (numValue < 0) numValue = 0;

        const updatedStudents = matrix.students.map(s => {
            if (s.studentId === studentId) {
                // 1. Update individual grade
                const newGrades = { ...s.grades, [activityId]: numValue };

                // 2. Recalculate total immediately
                const newTotal = calculateStudentTotal(newGrades, matrix.activities);

                return { ...s, grades: newGrades, finalTotal: newTotal };
            }
            return s;
        });

        setMatrix({ ...matrix, students: updatedStudents });
    };

    // Save to Backend (OnBlur / Enter)
    const saveGrade = async (studentId: number, activityId: number, score: number) => {
        setSaving(true);
        try {
            await api.post('/teacher/grade-activity', { studentId, activityId, score });
            console.log("Grade saved OK");
        } catch (error) {
            console.error("Error saving grade:", error);
        } finally {
            setSaving(false);
        }
    };

    // ----------------------------------------------------
    // 5. RENDER (HTML)
    // ----------------------------------------------------
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">

            {/* HEADER: Title and Course Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gradebook</h1>
                    <p className="text-slate-500">Manage grades by activity and evaluate progress.</p>
                </div>

                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <BookOpen className="text-indigo-600 ml-2" size={20} />
                    <select
                        className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer min-w-[200px]"
                        value={selectedCourseId || ''}
                        onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
                    >
                        {courses.length === 0 && <option>Loading courses...</option>}

                        {courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.subjectName} - Parallel {c.code}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* GRADE TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 w-64"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-100">
                        <AlertCircle size={14} />
                        <span>Real-time automatic calculation</span>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                {loading || !matrix ? (
                    <div className="p-10 text-center text-slate-400">
                        {loading ? "Loading matrix..." : "Select a course to view grades"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                                    <th className="p-4 min-w-[200px]">Student</th>

                                    {/* DYNAMIC COLUMNS (ACTIVITIES) */}
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
                                    <tr key={student.enrollmentId} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={student.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt="avatar" />
                                                <p className="font-bold text-slate-700 text-sm">{student.fullName}</p>
                                            </div>
                                        </td>

                                        {/* GRADE INPUTS */}
                                        {matrix.activities.map(act => (
                                            <td key={act.id} className="p-2 text-center border-l border-slate-50 relative">
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
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none text-slate-300">
                                                    <Save size={12} />
                                                </div>
                                            </td>
                                        ))}

                                        {/* CALCULATED TOTAL (Real-time) */}
                                        <td className="p-4 text-center bg-slate-50 font-bold border-l border-slate-200">
                                            <span className={`transition-colors duration-300 ${student.finalTotal >= 14 ? 'text-green-600' :
                                                student.finalTotal >= 9 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {student.finalTotal.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {matrix.students.length === 0 && (
                            <div className="p-10 text-center text-slate-400">No students found in this course.</div>
                        )}
                    </div>
                )}
            </div>

            {/* LEGEND */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-500">
                <div className="bg-white p-3 rounded border border-slate-100">
                    <strong className="block text-slate-700 mb-1">Individual (7 pts)</strong>
                    Average of assignments and workshops.
                </div>
                <div className="bg-white p-3 rounded border border-slate-100">
                    <strong className="block text-slate-700 mb-1">Group (5 pts)</strong>
                    Average of projects.
                </div>
                <div className="bg-white p-3 rounded border border-slate-100">
                    <strong className="block text-slate-700 mb-1">Midterm (2 pts)</strong>
                    Partial evaluation.
                </div>
                <div className="bg-white p-3 rounded border border-slate-100">
                    <strong className="block text-slate-700 mb-1">Final (6 pts)</strong>
                    Final exam.
                </div>
            </div>
        </div>
    );
};