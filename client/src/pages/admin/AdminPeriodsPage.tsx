import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    Calendar, Plus, Clock,
    AlertCircle, Search, Trash2, Edit,
} from 'lucide-react';

interface Period {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export const AdminPeriodsPage = () => {
    const theme = getTheme('ADMIN');
    const [periods, setPeriods] = useState<Period[]>([]);
    
    // Estados del Modal
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ id: 0, name: '', startDate: '', endDate: '' });
    
    const [loading, setLoading] = useState(true);

    const fetchPeriods = async () => {
        try {
            const res = await api.get('/admin/periods');
            setPeriods(res.data);
        } catch {
            console.error("Error fetching periods");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPeriods(); }, []);

    // ABRIR MODAL PARA CREAR
    const openCreate = () => {
        setForm({ id: 0, name: '', startDate: '', endDate: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    // ABRIR MODAL PARA EDITAR
    const openEdit = (p: Period) => {
        setForm({
            id: p.id,
            name: p.name,
            startDate: p.startDate.split('T')[0], // Formato YYYY-MM-DD
            endDate: p.endDate.split('T')[0]
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // GUARDAR (CREAR O EDITAR)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/admin/period/data/${form.id}`, form);
                alert("✅ Periodo actualizado con éxito");
            } else {
                await api.post('/admin/period', form);
                alert("✅ Periodo creado con éxito");
            }
            setShowModal(false);
            fetchPeriods();
        } catch {
            alert("❌ Error al guardar periodo");
        }
    };

    // CAMBIAR ESTADO (ACTIVO/INACTIVO)
    const toggleStatus = async (id: number) => {
        if (!confirm("¿Cambiar estado del periodo? (Esto desactivará otros periodos activos)")) return;
        try {
            await api.put(`/admin/period/${id}`);
            fetchPeriods();
        } catch {
            alert("Error al cambiar estado");
        }
    };

    // ELIMINAR PERIODO
    const handleDelete = async (id: number) => {
        if (!confirm("⚠️ ¿Seguro de eliminar este periodo? No debe tener cursos asociados.")) return;
        try {
            await api.delete(`/admin/period/${id}`);
            alert("🗑️ Periodo eliminado");
            fetchPeriods();
        } catch (error: any) {
            alert(error.response?.data?.error || "Error al eliminar");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* 1. HEADER HERO */}
            <div className={`rounded-3xl p-10 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Clock size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Configuración Académica</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4">Periodos Lectivos</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl opacity-90 leading-relaxed">
                        Administra los ciclos académicos, define fechas de inicio y fin, y controla qué periodo está activo actualmente en el sistema.
                    </p>
                </div>

                {/* Decoración */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <Calendar size={250} />
                </div>
            </div>

            {/* 2. BARRA DE ACCIONES */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar periodo..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
                    />
                </div>
                <button
                    onClick={openCreate}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-105 active:scale-95"
                >
                    <Plus size={20} /> Nuevo Periodo
                </button>
            </div>

            {/* 3. TABLA ESTILIZADA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Fin</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-400">Cargando datos...</td></tr>
                            ) : periods.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No hay periodos registrados aún.</td></tr>
                            ) : periods.map(p => (
                                <tr key={p.id} className={`group hover:bg-slate-50 transition-colors ${p.isActive ? 'bg-emerald-50/30' : ''}`}>
                                    <td className="p-5 font-bold text-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.name.charAt(0)}
                                            </div>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td className="p-5 text-slate-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-400" />
                                            {new Date(p.startDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-5 text-slate-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-slate-400" />
                                            {new Date(p.endDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        {p.isActive
                                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                ACTIVO
                                            </span>
                                            : <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                <AlertCircle size={12} /> INACTIVO
                                            </span>
                                        }
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(p.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${p.isActive ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' : 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700 shadow-md'}`}
                                            >
                                                {p.isActive ? 'Desactivar' : 'Activar'}
                                            </button>
                                            <button 
                                                onClick={() => openEdit(p)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" 
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                <Plus size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">{isEditing ? 'Editar Periodo' : 'Nuevo Periodo'}</h2>
                            <p className="text-slate-500 text-sm">Define un ciclo académico para el sistema.</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nombre del Periodo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 2026-B"
                                    className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold text-slate-700"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                                        required
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                                        required
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30"
                                >
                                    {isEditing ? 'Guardar Cambios' : 'Crear Periodo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};