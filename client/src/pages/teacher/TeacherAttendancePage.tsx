import { useEffect, useState } from 'react';
import { Calendar, UserCheck, CheckCircle2, XCircle, Clock, Save, Search } from 'lucide-react';

import api from '../../api/axios';
import { toast } from 'sonner';


// --- INTERFACES ---

interface ApiCourse {
    id: number;
    subjectName: string;
    code: string;
}

interface StudentAttendance {
    enrollmentId: number;
    studentId: number;
    fullName: string;
    avatar: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | null;
}

// 🔧 SAFE UTILITY: Get local date as "YYYY-MM-DD" string
// Prevents 7PM -> Next Day issues due to timezone shifts
const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    // getMonth() is 0-indexed
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * TeacherAttendancePage Component
 * Allows teachers to mark attendance for students in a specific course on a specific date.
 */
export const TeacherAttendancePage = () => {
    const [courses, setCourses] = useState<ApiCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    
    // Initialize with correct local date string
    const [selectedDate, setSelectedDate] = useState<string>(getTodayLocal());
    
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 1. Fetch Teacher's Courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get<ApiCourse[]>('/teacher/courses');
                setCourses(res.data);
                if (res.data.length > 0) setSelectedCourseId(res.data[0].id);
            } catch (error) { 
                console.error("Error fetching courses:", error); 
            }
        };
        fetchCourses();
    }, []);

    // 2. Fetch Attendance for Selected Course & Date
    useEffect(() => {
        if (!selectedCourseId) return;
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                // Send clean "YYYY-MM-DD" to backend
                const res = await api.get<StudentAttendance[]>(`/teacher/attendance?courseId=${selectedCourseId}&date=${selectedDate}`);
                const preparedData = res.data.map((s) => ({
                    ...s,
                    status: s.status || 'PRESENT' // Default to Present
                }));
                setStudents(preparedData);
            } catch (error) { 
                console.error("Error fetching attendance:", error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchAttendance();
    }, [selectedCourseId, selectedDate]);

    // 3. Save Attendance
    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({ enrollmentId: s.enrollmentId, status: s.status }));
            await api.post('/teacher/attendance', { date: selectedDate, records });
            toast.success(`✅ Attendance saved successfully for ${selectedDate}`);
        } catch (error) {
            console.error(error);
            toast.error("❌ Failed to save attendance");
        } finally { 
            setSaving(false); 
        }
    };

    /**
     * Helper to get status badge styles.
     */
    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'PRESENT': return 'bg-green-100 text-green-700 border-green-200';
            case 'LATE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ABSENT': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            
            {/* HEADER & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck className="text-blue-600" /> Attendance Control
                    </h1>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <select
                        className="bg-white p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCourseId || ''}
                        onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
                    >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.subjectName} ({c.code})</option>)}
                    </select>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            className="pl-10 p-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* STUDENTS LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Search size={16} /> <span>{students.length} Students</span>
                    </div>
                </div>

                {loading ? <div className="p-10 text-center text-slate-400">Loading...</div> : (
                    <div className="divide-y divide-slate-100">
                        {students.map(student => (
                            <div key={student.enrollmentId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={student.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-slate-200" />
                                    <div>
                                        <h3 className="font-bold text-slate-700">{student.fullName}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(student.status)}`}>
                                                {student.status === 'PRESENT' ? 'Present' : student.status === 'LATE' ? 'Late' : 'Absent'}
                                            </span>
                                            {/* Show raw string date for clarity */}
                                            <span className="text-xs text-slate-400">({selectedDate})</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* ACTION BUTTONS */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'PRESENT' } : s))} 
                                        className="p-2 bg-slate-100 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-lg"
                                        title="Mark Present"
                                    >
                                        <CheckCircle2 size={20}/>
                                    </button>
                                    <button 
                                        onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'LATE' } : s))} 
                                        className="p-2 bg-slate-100 hover:bg-yellow-100 text-slate-400 hover:text-yellow-600 rounded-lg"
                                        title="Mark Late"
                                    >
                                        <Clock size={20}/>
                                    </button>
                                    <button 
                                        onClick={() => setStudents(prev => prev.map(s => s.enrollmentId === student.enrollmentId ? { ...s, status: 'ABSENT' } : s))} 
                                        className="p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg"
                                        title="Mark Absent"
                                    >
                                        <XCircle size={20}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FLOATING SAVE BUTTON */}
            <div className="fixed bottom-8 right-8">
                <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};