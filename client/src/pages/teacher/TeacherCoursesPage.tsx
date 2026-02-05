import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, LayoutGrid } from 'lucide-react';

import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';

// --- INTERFACES ---

// 1. Interface for frontend state (processed data)
interface CourseCard {
    id: number;
    subjectName: string;
    code: string;
    studentCount?: number;
    parallel?: string;
}

// 2. Interface for raw API response (Replaces 'any')
interface ApiCourseData {
    id: number;
    courseId?: number; // Handling potential backend field name variations
    subjectName?: string;
    name?: string;
    code?: string;
    studentCount?: number;
    parallel?: string;
}

// Card Gradient Palette
const CARD_GRADIENTS = [
    "from-violet-500 to-purple-600",
    "from-fuchsia-500 to-pink-500",
    "from-indigo-500 to-blue-600",
    "from-rose-500 to-orange-500",
    "from-emerald-500 to-teal-500",
];

/**
 * TeacherCoursesPage Component
 * Displays a grid of all courses assigned to the teacher.
 */
export const TeacherCoursesPage = () => {
    const navigate = useNavigate();
    const theme = getTheme('TEACHER'); // 🟣 Purple Theme

    const [courses, setCourses] = useState<CourseCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get<ApiCourseData[]>('/teacher/courses');

                // 🟢 SOLUTION: Using ApiCourseData interface instead of 'any'
                const mappedData = res.data.map((c) => ({
                    id: c.id || c.courseId || 0,
                    subjectName: c.subjectName || c.name || "Unnamed Subject",
                    code: c.code || "A",
                    studentCount: c.studentCount || 0,
                    parallel: c.parallel || "A"
                }));

                setCourses(mappedData);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="p-20 text-center text-slate-500">Loading courses...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* HEADER */}
            <div className={`p-8 rounded-b-3xl shadow-lg relative overflow-hidden -mx-4 sm:mx-0 sm:rounded-2xl text-white bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <LayoutGrid size={32} className="opacity-80" /> My Courses
                    </h1>
                    <p className="text-white/80 mt-2 text-lg">
                        Select a subject to manage activities, students, and grades.
                    </p>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            </div>

            {/* COURSES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {courses.map((course, index) => {
                    const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

                    return (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/teacher/course/${course.id}`)}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group border border-slate-100 overflow-hidden flex flex-col"
                        >
                            {/* Color Header */}
                            <div className={`h-32 bg-gradient-to-r ${gradient} p-4 relative`}>
                                <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                                    PARALLEL {course.code}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-6 pt-0 flex-1 flex flex-col relative">
                                <div className="w-14 h-14 bg-white rounded-xl shadow-md flex items-center justify-center -mt-7 mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen size={24} className={`text-transparent bg-clip-text bg-gradient-to-r ${gradient}`} />
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-purple-700 transition-colors">
                                    {course.subjectName}
                                </h3>

                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                                    <Users size={16} />
                                    <span>{course.studentCount} Enrolled Students</span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-400 group-hover:text-slate-600 transition-colors">Academic Management</span>
                                    <span className={`flex items-center gap-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent group-hover:gap-2 transition-all`}>
                                        Enter <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-500" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {courses.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    You have no courses assigned yet.
                </div>
            )}
        </div>
    );
};