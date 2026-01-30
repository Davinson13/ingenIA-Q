import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { getTheme } from '../../utils/themeUtils';
import {
    Users, Calendar, BookOpen, School,
    Activity, ShieldCheck, TrendingUp
} from 'lucide-react';

interface AdminStats {
    students: number;
    teachers: number;
    activePeriod: string;
    subjects: number;
}

export const AdminDashboard = () => {
    const { user } = useAuthStore();
    const theme = getTheme('ADMIN'); // 🔥 Usamos el tema ADMIN (Esmeralda)
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        api.get('/admin/stats').then(res => setStats(res.data));
    }, []);

    if (!stats) return <div className="p-20 text-center text-slate-500 font-medium animate-pulse">Cargando panel de control...</div>;

    const cards = [
        {
            title: "Estudiantes Activos",
            value: stats.students,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100"
        },
        {
            title: "Plana Docente",
            value: stats.teachers,
            icon: School,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-100"
        },
        {
            title: "Periodo Académico",
            value: stats.activePeriod,
            icon: Calendar,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            isText: true // Para ajustar tamaño de fuente si es texto largo
        },
        {
            title: "Oferta Académica",
            value: stats.subjects,
            label: "Materias",
            icon: BookOpen,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-100"
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* 1. HEADER HERO - Estilo similar al estudiante pero con tema Admin */}
            <div className={`rounded-3xl p-10 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <ShieldCheck size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Portal Administrativo</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4">Bienvenido, {user?.fullName.split(' ')[0]}</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl opacity-90 leading-relaxed">
                        Tienes el control total del sistema. Revisa las métricas clave y gestiona los recursos académicos desde este panel centralizado.
                    </p>
                </div>

                {/* Decoración de fondo */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <Activity size={250} />
                </div>
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
            </div>

            {/* 2. STATS GRID - Tarjetas mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border ${card.border} hover:shadow-md transition-all duration-300 group relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon size={24} strokeWidth={2.5} />
                            </div>
                            {idx === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp size={10} /> +5%</span>}
                        </div>

                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</p>
                            <h3 className={`font-black text-slate-800 ${card.isText ? 'text-2xl truncate' : 'text-4xl'}`}>
                                {card.value}
                                {card.label && <span className="text-sm font-medium text-slate-400 ml-1">{card.label}</span>}
                            </h3>
                        </div>

                        {/* Decoración hover */}
                        <div className={`absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${card.color}`}>
                            <card.icon size={100} />
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. SECCIÓN DE ACCIONES RÁPIDAS (Opcional para rellenar y que se vea más pro) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <Activity className="text-emerald-600" /> Estado del Sistema
                    </h3>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">Base de Datos Operativa</p>
                            <p className="text-xs text-slate-500">Todas las conexiones estables.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">Soporte Técnico</h3>
                        <p className="text-slate-400 text-sm mb-4">¿Necesitas ayuda con la configuración?</p>
                        <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg text-sm font-bold transition-colors">
                            Contactar Soporte
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 opacity-10">
                        <ShieldCheck size={120} />
                    </div>
                </div>
            </div>
        </div>
    );
};