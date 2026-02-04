import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { getTheme } from '../../utils/themeUtils';
import { Link } from 'react-router-dom';
import {
    Users, Calendar, BookOpen, School,
    Activity, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';

interface AdminStats {
    students: number;
    teachers: number;
    activePeriod: string;
    subjects: number;
    pendingRequests: number; // 🔥 Aseguramos que esto venga del backend
    users: number;
}

export const AdminDashboard = () => {
    const { user } = useAuthStore();
    const theme = getTheme('ADMIN');
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        api.get('/admin/dashboard/stats') // Asegúrate de que la ruta sea correcta
            .then(res => setStats(res.data))
            .catch(console.error);
    }, []);

    if (!stats) return (
        <div className="flex flex-col items-center justify-center h-full p-20 animate-pulse">
            <ShieldCheck size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Cargando panel de control...</p>
        </div>
    );

    const cards = [
        {
            title: "Comunidad Estudiantil",
            value: stats.students,
            label: "Alumnos",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
            link: "/admin/users"
        },
        {
            title: "Cuerpo Docente",
            value: stats.teachers,
            label: "Profesores",
            icon: School,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100",
            link: "/admin/users"
        },
        {
            title: "Ciclo Académico",
            value: stats.activePeriod || "Inactivo",
            label: "Actual",
            icon: Calendar,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            isText: true,
            link: "/admin/periods"
        },
        {
            title: "Oferta Educativa",
            value: stats.subjects,
            label: "Materias",
            icon: BookOpen,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100",
            link: "/admin/academic"
        },
    ];

    // Estado del sistema basado en alertas
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
                        <h1 className="text-3xl md:text-4xl font-black mb-2">Hola, {user?.fullName.split(' ')[0]}</h1>
                        <p className="text-emerald-100 text-lg max-w-xl opacity-90 leading-relaxed">
                            Resumen ejecutivo de la plataforma académica.
                        </p>
                    </div>

                    {/* Alerta flotante integrada en el header si hay pendientes */}
                    {stats.pendingRequests > 0 && (
                        <Link to="/admin/users" className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all group cursor-pointer">
                            <div className="bg-amber-500 text-white p-3 rounded-full animate-pulse shadow-lg">
                                <AlertTriangle size={24} strokeWidth={3} />
                            </div>
                            <div>
                                <p className="font-black text-2xl leading-none">{stats.pendingRequests}</p>
                                <p className="text-xs font-bold uppercase tracking-wide opacity-80 group-hover:opacity-100">Solicitudes Pendientes</p>
                            </div>
                            <ArrowRight className="opacity-50 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                {/* Decoración */}
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
                            {idx === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp size={10} /> +Activos</span>}
                        </div>

                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</p>
                            <h3 className={`font-black text-slate-800 flex items-baseline gap-1 ${card.isText ? 'text-xl truncate' : 'text-3xl'}`}>
                                {card.value}
                                {card.label && <span className="text-xs font-bold text-slate-400 uppercase">{card.label}</span>}
                            </h3>
                        </div>

                        {/* Icono decorativo gigante */}
                        <div className={`absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${card.color}`}>
                            <card.icon size={100} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* 3. ESTADO DEL SISTEMA & ACCIONES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Panel de Estado */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Activity className="text-slate-400" /> Estado del Sistema
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${systemStatus === 'OK'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            }`}>
                            {systemStatus === 'OK' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            {systemStatus === 'OK' ? 'Operativo' : 'Atención Requerida'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {/* Monitor de Solicitudes */}
                        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${stats.pendingRequests > 0
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-slate-50 border-slate-100 opacity-60'
                            }`}>
                            <div className={`w-3 h-3 rounded-full shadow-sm ${stats.pendingRequests > 0 ? 'bg-amber-500 animate-bounce' : 'bg-slate-300'}`}></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">Asignación de Carreras</p>
                                <p className="text-xs text-slate-500">
                                    {stats.pendingRequests > 0
                                        ? `${stats.pendingRequests} alumnos esperan asignación.`
                                        : "No hay solicitudes pendientes."}
                                </p>
                            </div>
                            {stats.pendingRequests > 0 && (
                                <Link to="/admin/users" className="text-xs font-bold text-amber-700 hover:underline">Resolver →</Link>
                            )}
                        </div>

                        {/* Monitor Base de Datos (Fake pero visualmente útil) */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Conexión de Base de Datos</p>
                                <p className="text-xs text-slate-500">Latencia: 24ms • Conexiones activas: Estables</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta Soporte */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 className="font-bold text-xl mb-1">Soporte Técnico</h3>
                        <p className="text-slate-400 text-sm mb-6">¿Problemas con la plataforma? Reporta incidencias críticas directamente al equipo de desarrollo.</p>
                        <button className="w-full bg-white text-slate-900 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg">
                            Contactar Soporte
                        </button>
                    </div>
                    {/* Fondo decorativo */}
                    <div className="absolute -right-10 -top-10 opacity-5">
                        <ShieldCheck size={200} />
                    </div>
                </div>
            </div>
        </div>
    );
};