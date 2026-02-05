import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    Calendar, Plus, Clock,
    AlertCircle, Search, Trash2, Edit,
} from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---

interface Period {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

/**
 * AdminPeriodsPage Component
 * Manages academic periods (terms/semesters).
 * Allows creation, editing, deletion, and status toggling (active/inactive).
 */
export const AdminPeriodsPage = () => {
    const theme = getTheme('ADMIN');
    
    // --- State: Data ---
    const [periods, setPeriods] = useState<Period[]>([]);
    
    // --- State: Modals & Forms ---
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ id: 0, name: '', startDate: '', endDate: '' });
    
    const [loading, setLoading] = useState(true);

    /**
     * Fetches the list of periods from the backend.
     * Wrapped in useCallback to ensure stability across renders.
     */
    const fetchPeriods = useCallback(async () => {
        try {
            const res = await api.get<Period[]>('/admin/periods');
            setPeriods(res.data);
        } catch {
            console.error("Error fetching periods");
            toast.error("Error loading periods");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    // --- Handlers: Modal Control ---

    // Open modal in Create mode
    const openCreate = () => {
        setForm({ id: 0, name: '', startDate: '', endDate: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    // Open modal in Edit mode with pre-filled data
    const openEdit = (p: Period) => {
        setForm({
            id: p.id,
            name: p.name,
            startDate: p.startDate.split('T')[0], // Format YYYY-MM-DD for date input
            endDate: p.endDate.split('T')[0]
        });
        setIsEditing(true);
        setShowModal(true);
    };

    // --- Handlers: Data Operations ---

    // Handle Form Submission (Create or Update)
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Construct the promise for toast tracking
        const savePromise = isEditing 
            ? api.put(`/admin/period/data/${form.id}`, form) 
            : api.post('/admin/period', form);

        toast.promise(savePromise, {
            loading: 'Saving period...',
            success: () => {
                setShowModal(false);
                fetchPeriods();
                return isEditing ? "✅ Period updated successfully" : "✅ Period created successfully";
            },
            error: "❌ Failed to save period"
        });
    };

    // Toggle Active Status
    const toggleStatus = (id: number) => {
        toast("Change period status?", {
            description: "This will deactivate other active periods.",
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await api.put(`/admin/period/${id}`);
                        toast.success("Status updated successfully");
                        fetchPeriods();
                    } catch {
                        toast.error("Error changing status");
                    }
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => {}
            }
        });
    };

    // Delete Period
    const handleDelete = (id: number) => {
        toast("⚠️ Are you sure?", {
            description: "This period must not have associated courses.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await api.delete(`/admin/period/${id}`);
                        toast.success("🗑️ Period deleted");
                        fetchPeriods();
                    } catch (error: unknown) {
                         // Safe error handling with type narrowing
                         if (error && typeof error === 'object' && 'response' in error) {
                            const apiError = error as { response: { data: { error: string } } };
                            toast.error(apiError.response?.data?.error || "Error deleting period");
                        } else {
                            toast.error("Error deleting period");
                        }
                    }
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => {}
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* 1. HERO HEADER */}
            <div className={`rounded-3xl p-10 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Clock size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Academic Configuration</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4">Academic Periods</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl opacity-90 leading-relaxed">
                        Manage academic cycles, define start and end dates, and control the currently active period.
                    </p>
                </div>

                {/* Background Decoration */}
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <Calendar size={250} />
                </div>
            </div>

            {/* 2. ACTION BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search period..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
                    />
                </div>
                <button
                    onClick={openCreate}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-105 active:scale-95"
                >
                    <Plus size={20} /> New Period
                </button>
            </div>

            {/* 3. STYLIZED TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading data...</td></tr>
                            ) : periods.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">No periods registered yet.</td></tr>
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
                                                ACTIVE
                                            </span>
                                            : <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                <AlertCircle size={12} /> INACTIVE
                                            </span>
                                        }
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(p.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${p.isActive ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' : 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700 shadow-md'}`}
                                            >
                                                {p.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button 
                                                onClick={() => openEdit(p)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" 
                                                title="Delete"
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

            {/* MODAL: CREATE / EDIT */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                <Plus size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">{isEditing ? 'Edit Period' : 'New Period'}</h2>
                            <p className="text-slate-500 text-sm">Define an academic cycle for the system.</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Period Name</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 2026-B"
                                    className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold text-slate-700"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
                                        required
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">End Date</label>
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
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30"
                                >
                                    {isEditing ? 'Save Changes' : 'Create Period'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};