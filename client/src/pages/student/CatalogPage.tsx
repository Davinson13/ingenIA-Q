import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { BookOpen, Filter, Layers, User, LogOut } from 'lucide-react';
import api from '../../api/axios';

// --- INTERFACES ---

interface Career { 
    id: number; 
    name: string; 
    totalSemesters: number; 
}

interface Course {
    id: number; // Parallel ID
    subjectId: number;
    name: string;
    code: string; // Parallel Code (e.g., "A")
    teacher: string;
    semester: number;
    capacity: number;
    enrolledCount: number;
    isFull: boolean;
    isEnrolled: boolean;
}

interface CareersResponse {
    careers: Career[];
}

/**
 * CatalogPage Component
 * Allows students to browse available courses by career and semester,
 * and enroll or unenroll from them.
 */
export const CatalogPage = () => {
    // --- State: Filters ---
    const [careers, setCareers] = useState<Career[]>([]);
    const [selectedCareer, setSelectedCareer] = useState<number | ''>('');
    const [selectedSemester, setSelectedSemester] = useState<number | ''>('');

    // --- State: Data ---
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("Select a career and semester to view courses.");

    // 1. Initial Load: Fetch Careers
    useEffect(() => {
        api.get<CareersResponse>('/student/catalog/filters').then(res => setCareers(res.data.careers));
    }, []);

    // 2. Search Courses Logic
    const searchCourses = async () => {
        if (!selectedCareer || !selectedSemester) return;
        
        setLoading(true);
        setMsg("");
        
        try {
            const res = await api.get<Course[]>(`/student/catalog/courses?careerId=${selectedCareer}&semester=${selectedSemester}`);
            setCourses(res.data);
            if (res.data.length === 0) setMsg("No open courses found for this semester.");
        } catch (error: unknown) {
            console.error("Error searching courses:", error);
            setMsg("Error loading courses.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-search when both filters are selected
    useEffect(() => {
        if (selectedCareer && selectedSemester) {
            searchCourses();
        } else {
            setCourses([]);
        }
    }, [selectedCareer, selectedSemester]);

    /**
     * Handles student enrollment in a course.
     * @param parallelId - The ID of the specific course parallel.
     */
    const handleEnroll = async (parallelId: number) => {
        if (!confirm("Confirm enrollment in this course?")) return;
        
        try {
            await api.post('/student/enroll', { parallelId });
            alert("✅ Enrollment successful!");
            searchCourses(); // Reload to update capacity and status
        } catch (error: unknown) {
            // Type-safe error handling for Axios
            if (error && typeof error === 'object' && 'response' in error) {
                const err = error as AxiosError<{ error: string }>;
                alert(err.response?.data?.error || "Failed to enroll.");
            } else {
                alert("An unexpected error occurred.");
            }
        }
    };

    /**
     * Handles removing enrollment (dropping a course).
     * Attempts to delete via parallel ID first, then falls back to subject ID cleanup if needed.
     */
    const handleUnenroll = async (parallelId: number, subjectId: number) => {
        if (!confirm("Are you sure you want to drop this course?")) return;
        
        try {
            // Try deleting by specific enrollment/parallel ID
            await api.delete(`/student/enroll/${parallelId}`);
            alert("✅ You have dropped the course.");
            searchCourses(); 
        } catch (error: unknown) {
            // Fallback: Clean up via Subject ID (handles "zombie" records if parallel mismatch)
            console.warn("Primary delete failed, attempting fallback cleanup...", error);
            
            try {
                await api.delete(`/student/enroll/${subjectId}`);
                alert("✅ Registration record cleared.");
                searchCourses();
            } catch (e: unknown) {
                console.error("Fallback failed:", e);
                alert("Failed to drop course.");
            }
        }
    };

    // Generate array of semesters (1 to N) based on selected career
    const currentCareer = careers.find(c => c.id === Number(selectedCareer));
    const semesterOptions = currentCareer
        ? Array.from({ length: currentCareer.totalSemesters }, (_, i) => i + 1)
        : [];

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Course Enrollment</h1>
                    <p className="text-slate-500">Select your career and level to view available academic offers.</p>
                </div>
            </div>

            {/* FILTERS BAR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid md:grid-cols-3 gap-4 items-end">

                {/* Career Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Career</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            value={selectedCareer}
                            onChange={e => { setSelectedCareer(Number(e.target.value)); setSelectedSemester(''); }}
                        >
                            <option value="">-- Select --</option>
                            {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Semester Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semester / Level</label>
                    <div className="relative">
                        <Layers className="absolute left-3 top-3 text-slate-400" size={18} />
                        <select
                            className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50"
                            value={selectedSemester}
                            onChange={e => setSelectedSemester(Number(e.target.value))}
                            disabled={!selectedCareer}
                        >
                            <option value="">-- Select --</option>
                            {semesterOptions.map(num => <option key={num} value={num}>Semester {num}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pb-1 text-xs text-slate-400">
                    * Only courses for the active period are shown.
                </div>
            </div>

            {/* RESULTS */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Searching for courses...</div>
            ) : courses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">

                            {/* Background Decoration */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BookOpen size={100} className="text-blue-900" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg border border-blue-100">
                                        Parallel {course.code}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${course.isFull ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                        {course.enrolledCount} / {course.capacity} Seats
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">{course.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-3">
                                    <User size={14} /> {course.teacher}
                                </div>
                            </div>

                            <div className="mt-6 relative z-10">
                                {course.isEnrolled ? (
                                    // CASE: Already Enrolled -> Show Drop Button
                                    <button
                                        onClick={() => handleUnenroll(course.id, course.subjectId)}
                                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    >
                                        <LogOut size={18} /> Drop Course
                                    </button>
                                ) : (
                                    // CASE: Not Enrolled -> Show Enroll Button
                                    <button
                                        onClick={() => !course.isFull && handleEnroll(course.id)}
                                        disabled={course.isFull}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${course.isFull
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95'
                                            }`}
                                    >
                                        {course.isFull ? "Course Full" : "Enroll"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">{msg}</p>
                </div>
            )}
        </div>
    );
};