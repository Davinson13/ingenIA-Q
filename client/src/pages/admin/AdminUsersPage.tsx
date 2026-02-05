import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    Users, Search, UserCog, GraduationCap,
    X, Hand, AlertTriangle
} from 'lucide-react';

// --- INTERFACES ---

interface Career {
    id: number;
    name: string;
}

interface User {
    id: number;
    fullName: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    career?: Career;
    requestingCareer?: boolean; // Flag indicating if student requested a career assignment
}

type RoleFilter = 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT';

/**
 * AdminUsersPage Component
 * Manages user roles and career assignments.
 * Highlights students requesting career placement.
 */
export const AdminUsersPage = () => {
    const theme = getTheme('ADMIN');

    // --- State: Data ---
    const [users, setUsers] = useState<User[]>([]);
    const [careers, setCareers] = useState<Career[]>([]);
    
    // --- State: Filtering ---
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    
    // --- State: UI & Editing ---
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ role: '', careerId: '' });

    const filterOptions: RoleFilter[] = ['ALL', 'ADMIN', 'TEACHER', 'STUDENT'];

    /**
     * Fetches users and available careers in parallel.
     */
    const fetchData = async () => {
        try {
            const [resUsers, resCareers] = await Promise.all([
                api.get<User[]>('/admin/users'),
                api.get<Career[]>('/admin/users/careers')
            ]);
            setUsers(resUsers.data);
            setCareers(resCareers.data);
        } catch {
            console.error("Error loading users data");
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Filters and sorts the user list.
     * Priority Logic: Students requesting a career are shown at the top.
     */
    const filterUsers = useCallback(() => {
        let temp = users;

        // 1. Filter by Role
        if (roleFilter !== 'ALL') {
            temp = temp.filter(u => u.role === roleFilter);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            temp = temp.filter(u =>
                u.fullName.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            );
        }

        // 3. Sort: Requesting Career -> First
        temp.sort((a, b) => {
            if (a.requestingCareer === b.requestingCareer) return 0;
            return a.requestingCareer ? -1 : 1;
        });

        setFilteredUsers(temp);
    }, [users, roleFilter, searchTerm]);

    // Apply filters whenever dependencies change
    useEffect(() => {
        filterUsers();
    }, [filterUsers]);

    // --- Handlers ---

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setFormData({ role: user.role, careerId: user.career?.id.toString() || '' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await api.put(`/admin/users/${editingUser.id}`, formData);
            alert("✅ User updated successfully");
            setEditingUser(null);
            fetchData();
        } catch {
            alert("Error updating user");
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-[10px] font-bold border border-rose-200">ADMIN</span>;
            case 'TEACHER': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-200">TEACHER</span>;
            default: return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200">STUDENT</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-4">
            
            {/* HEADER */}
            <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-r ${theme.gradient} shrink-0`}>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black mb-1">Users Management</h1>
                        <p className="text-white/90 text-sm">Manage roles, permissions, and career assignments.</p>
                    </div>
                    <Users size={48} className="opacity-20" />
                </div>
            </div>

            {/* FILTERS BAR */}
            <div className="flex flex-col md:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search user..." 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {filterOptions.map((role) => (
                        <button 
                            key={role} 
                            onClick={() => setRoleFilter(role)} 
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === role ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                        >
                            {role === 'ALL' ? 'All' : role}
                        </button>
                    ))}
                </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Career / Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading users...</td></tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors group ${u.requestingCareer ? 'bg-amber-50/50' : ''}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {u.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700">{u.fullName}</div>
                                                <div className="text-xs text-slate-400">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">{getRoleBadge(u.role)}</td>

                                    {/* CAREER / REQUEST STATUS */}
                                    <td className="p-4 text-sm text-slate-600">
                                        {u.career ? (
                                            <span className="flex items-center gap-1 font-medium text-emerald-700">
                                                <GraduationCap size={14} /> {u.career.name}
                                            </span>
                                        ) : (
                                            u.requestingCareer ? (
                                                <div className="flex items-center gap-2 text-amber-700 font-bold bg-amber-100 px-3 py-1 rounded-lg w-fit animate-pulse border border-amber-200 shadow-sm">
                                                    <Hand size={14} />
                                                    <span className="text-xs">REQUESTING CAREER</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 italic">-</span>
                                            )
                                        )}
                                    </td>

                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleEditClick(u)} 
                                            className={`p-2 rounded-lg transition-colors ${u.requestingCareer ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                        >
                                            <UserCog size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                        <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>

                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><UserCog className="text-blue-600" /> Edit User</h3>
                            <p className="text-xs text-slate-500">{editingUser.fullName}</p>

                            {editingUser.requestingCareer && (
                                <div className="mt-3 bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2 items-start text-xs text-amber-800">
                                    <AlertTriangle size={16} className="shrink-0" />
                                    <p><strong>Attention:</strong> This student has requested a career assignment. Please select one below.</p>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                                <select className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-sm" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="STUDENT">Student</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            {formData.role === 'STUDENT' && (
                                <div className="animate-in fade-in pt-2 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Academic Career</label>
                                    <select 
                                        className={`w-full border p-2.5 rounded-lg bg-white text-sm outline-none focus:ring-2 ${editingUser.requestingCareer ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-300 focus:ring-blue-500'}`} 
                                        value={formData.careerId} 
                                        onChange={e => setFormData({ ...formData, careerId: e.target.value })} 
                                        required
                                    >
                                        <option value="">-- Select Career --</option>
                                        {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};