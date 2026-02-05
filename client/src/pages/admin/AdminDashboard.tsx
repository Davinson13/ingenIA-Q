import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { getTheme } from '../../utils/themeUtils';
import {
    Users, Calendar, BookOpen, School,
    Activity, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';

// --- INTERFACES ---

/**
 * Statistics data structure received from the backend.
 */
interface AdminStats {
    students: number;
    teachers: number;
    activePeriod: string;
    subjects: number;
    pendingRequests: number; // Count of users requesting career assignment
    users: number;
}

/**
 * AdminDashboard Page
 * Displays high-level metrics, system status, and quick actions for Administrators.
 * It provides a quick overview of the academic institution's health.
 */
export const AdminDashboard = () => {
    const { user } = useAuthStore();
    const theme = getTheme('ADMIN');
    const [stats, setStats] = useState<AdminStats | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        api.get<AdminStats>('/admin/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(error => {
                console.error("Failed to load dashboard stats", error);
            });
    }, []);

    // --- Loading State ---
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-20 animate-pulse">
                <ShieldCheck size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">Loading dashboard...</p>
            </div>
        );
    }

    // --- Configuration: Metric Cards ---
    const cards = [
        {
            title: "Student Community",
            value: stats.students,
            label: "Students",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
            link: "/admin/users"
        },
        {
            title: "Faculty Staff",
            value: stats.teachers,
            label: "Teachers",
            icon: School,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
            link: "/admin/users"
        },
        {
            title: "Academic Cycle",
            value: stats.activePeriod || "Inactive",
            label: "Current",
            icon: Calendar,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            isText: true,
            link: "/admin/periods"
        },
        {
            title: "Educational Offer",
            value: stats.subjects,
            label: "Subjects",
            icon: BookOpen,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100",
            link: "/admin/academic"
        },
    ];

    // System Health Check based on pending actions
    const systemStatus = stats.pendingRequests > 0 ? 'WARNING' : 'OK';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* 1. HERO HEADER */}
            <div className={`rounded-3xl p-10 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <ShieldCheck size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-lg">Admin Portal</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-2">Hello, {user?.fullName.split(' ')[0]}</h1>
                        <p className="text-emerald-100 text-lg max-w-xl opacity-90 leading-relaxed">
                            Executive summary of the academic platform.
                        </p>
                    </div>

                    {/* Integrated Alert in Header (If requests exist) */}
                    {stats.pendingRequests > 0 && (
                        <Link to="/admin/users" className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all group cursor-pointer">
                            <div className="bg-amber-500 text-white p-3 rounded-full animate-pulse shadow-lg">
                                <AlertTriangle size={24} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="font-black text-2xl leading-none">{stats.pendingRequests}</p>
                                <p className="text-xs font-bold uppercase tracking-wide opacity-80 group-hover:opacity-100">Pending Requests</p>
                            </div>
                            <ArrowRight className="opacity-50 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                {/* Background Decoration */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <Activity size={250} />
                </div>
            </div>

            {/* 2. METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <Link
                        to={card.link}
                        key={idx}
                        className={`bg-white p-6 rounded-2xl shadow-sm border ${card.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden block`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <card.icon size={24} strokeWidth={2.5} />
                            </div>
                            {idx === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp size={10} /> Active</span>}
                        </div>

                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</p>
                            <h3 className={`font-black text-slate-800 flex items-baseline gap-1 ${card.isText ? 'text-xl truncate' : 'text-3xl'}`}>
                                {card.value}
                                {card.label && <span className="text-xs font-bold text-slate-400 uppercase">{card.label}</span>}
                            </h3>
                        </div>

                        {/* Hover Icon Decoration */}
                        <div className={`absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${card.color}`}>
                            <card.icon size={100} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* 3. SYSTEM STATUS & ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Status Panel */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Activity className="text-slate-400" /> System Status
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${systemStatus === 'OK'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            }`}>
                            {systemStatus === 'OK' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            {systemStatus === 'OK' ? 'Operational' : 'Attention Required'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Career Requests Monitor */}
                        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${stats.pendingRequests > 0
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-100 opacity-60'
                            }`}>
                            <div className={`w-3 h-3 rounded-full shadow-sm ${stats.pendingRequests > 0 ? 'bg-amber-500 animate-bounce' : 'bg-slate-300'}`}></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">Career Assignment</p>
                                <p className="text-xs text-slate-500">
                                    {stats.pendingRequests > 0
                                        ? `${stats.pendingRequests} students waiting for assignment.`
                                        : "No pending requests."}
                                </p>
                            </div>
                            {stats.pendingRequests > 0 && (
                                <Link to="/admin/users" className="text-xs font-bold text-amber-700 hover:underline">Resolve →</Link>
                            )}
                        </div>

                        {/* Database Monitor (Visual Mock) */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Database Connection</p>
                                <p className="text-xs text-slate-500">Latency: 24ms • Active connections: Stable</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="font-bold text-xl mb-1">Technical Support</h3>
                        <p className="text-slate-400 text-sm mb-6">Issues with the platform? Report critical incidents directly to the development team.</p>
                        <button className="w-full bg-white text-slate-900 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg">
                            Contact Support
                        </button>
                    </div>
                    {/* Background Decoration */}
                    <div className="absolute -right-10 -top-10 opacity-5">
                        <ShieldCheck size={200} />
                    </div>
                </div>
            </div>
        </div>
    );
};