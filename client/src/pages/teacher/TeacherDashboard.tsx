import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Users, Clock, AlertCircle,
    BarChart3, ChevronDown, ChevronUp, Calendar, ArrowRight
} from 'lucide-react';

import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';

// --- INTERFACES ---

interface DashboardData {
    stats: {
        courses: number;
        students: number;
        pending: number;
        risk: number;
    };
    courseStats: {
        id: number;
        name: string;
        code: string;
        students: number;
        average: number;
    }[];
    nextEvents: {
        id: number;
        title: string;
        date: string;
        type: string;
        courseName: string;
    }[];
}

/**
 * TeacherDashboard Component
 * Main landing page for teachers. Displays summary stats, active courses,
 * performance metrics, and upcoming agenda.
 */
export const TeacherDashboard = () => {
    const navigate = useNavigate();
    const theme = getTheme('TEACHER');

    // 1. RECOVER USER (Read from localStorage safely)
    const [user, setUser] = useState<{ fullName: string } | null>(null);

    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    // State for expandable course cards
    const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

    useEffect(() => {
        // Load user from local storage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Error reading user data", e);
                setUser({ fullName: "Teacher" });
            }
        }

        // Load Dashboard Data
        const loadDashboard = async () => {
            try {
                const res = await api.get<DashboardData>('/teacher/dashboard');
                setData(res.data);
            } catch (error) {
                console.error("Error loading dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    const toggleCourse = (id: number) => {
        if (expandedCourse === id) setExpandedCourse(null);
        else setExpandedCourse(id);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading dashboard...</div>;

    // Safe values to avoid undefined errors
    const pendingCount = data?.stats.pending || 0;
    const riskCount = data?.stats.risk || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* WELCOME HEADER */}
            <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2">Welcome, {user?.fullName || "Teacher"}</h1>
                    <p className="text-indigo-100 text-lg">Academic Management and Course Control Panel.</p>
                </div>
                {/* Background Decoration */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            </div>

            {/* 1. SUMMARY STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Active Courses */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Courses</p>
                        <h2 className="text-3xl font-black text-slate-800">{data?.stats.courses || 0}</h2>
                    </div>
                </div>

                {/* Total Students */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Students</p>
                        <h2 className="text-3xl font-black text-slate-800">{data?.stats.students || 0}</h2>
                    </div>
                </div>

                {/* Pending Grading */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`p-4 rounded-xl ${pendingCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Grading</p>
                        <h2 className="text-3xl font-black text-slate-800">{pendingCount}</h2>
                    </div>
                </div>

                {/* Academic Risk */}
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-white text-red-500 rounded-xl shadow-sm">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Academic Risk</p>
                        <h2 className="text-3xl font-black text-red-600 flex items-baseline gap-1">
                            {riskCount} <span className="text-sm font-medium opacity-70">courses</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: PERFORMANCE & COURSES (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-purple-600" /> Course Performance
                    </h3>

                    {/* EXPANDABLE COURSE LIST WITH GRAPH */}
                    <div className="space-y-4">
                        {data?.courseStats.map(course => {
                            const isExpanded = expandedCourse === course.id;
                            // Progress bar calculation (0 to 100%)
                            const percentage = (course.average / 20) * 100;

                            return (
                                <div key={course.id} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'border-purple-200 shadow-lg' : 'border-slate-100 shadow-sm'}`}>
                                    {/* CARD HEADER (Always visible) */}
                                    <div
                                        onClick={() => toggleCourse(course.id)}
                                        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${course.average >= 14 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {course.code}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{course.name}</h4>
                                                <p className="text-sm text-slate-500">{course.students} Students Enrolled</p>
                                            </div>
                                        </div>

                                        {/* SIMPLE BAR CHART */}
                                        <div className="flex-1 max-w-xs w-full">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-slate-400">Average</span>
                                                <span className="text-slate-700">{course.average.toFixed(2)} / 20</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${course.average >= 14 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="text-slate-400">
                                            {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </div>

                                    {/* EXPANDABLE CONTENT */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                                            <hr className="border-slate-100 mb-4" />
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-slate-500">
                                                    Manage activities, attendance, and grades for this course.
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent closing on click
                                                        navigate(`/teacher/course/${course.id}`);
                                                    }}
                                                    className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                                >
                                                    Go to Course <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {data?.courseStats.length === 0 && (
                            <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                No courses assigned yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: UPCOMING EVENTS (1/3) */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-purple-600" /> Agenda
                    </h3>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-500 uppercase">Upcoming Activities</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {data?.nextEvents.map(evt => (
                                <div key={evt.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 rounded-lg w-12 h-12 border border-indigo-100">
                                            <span className="text-[10px] font-bold uppercase">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-lg font-black leading-none">{new Date(evt.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">{evt.title}</h5>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{evt.courseName}</p>
                                            <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                                {evt.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!data?.nextEvents || data.nextEvents.length === 0) && (
                                <div className="p-8 text-center">
                                    <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-400">No upcoming events.</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/teacher/calendar')}
                            className="w-full py-3 text-xs font-bold text-purple-600 hover:bg-purple-50 transition-colors border-t border-slate-100"
                        >
                            VIEW FULL AGENDA
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};