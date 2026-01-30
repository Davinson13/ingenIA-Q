import { useEffect, useState, useCallback } from 'react'; // 👈 1. Importamos useCallback
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    Users, Search, UserCog, UserCheck,
    Shield, GraduationCap, School, Filter
} from 'lucide-react';

interface User {
    id: number;
    fullName: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    createdAt: string;
}

type RoleFilter = 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export const AdminUsersPage = () => {
    const theme = getTheme('ADMIN');
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
    const [loading, setLoading] = useState(true);

    const [editingUser, setEditingUser] = useState<User | null>(null);

    const filterOptions: RoleFilter[] = ['ALL', 'ADMIN', 'TEACHER', 'STUDENT'];

    useEffect(() => {
        fetchUsers();
    }, []);

    // 🔥 CORRECCIÓN: Usamos useCallback para estabilizar la función
    const filterUsers = useCallback(() => {
        let temp = users;

        if (roleFilter !== 'ALL') {
            temp = temp.filter(u => u.role === roleFilter);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            temp = temp.filter(u =>
                u.fullName.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            );
        }

        setFilteredUsers(temp);
    }, [users, roleFilter, searchTerm]); // 👈 Dependencias de la función

    // 🔥 Ahora el efecto solo depende de la función estable
    useEffect(() => {
        filterUsers();
    }, [filterUsers]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch {
            // Error handling
        } finally {
            setLoading(false);
        }
    };

    const handleChangeRole = async (userId: number, newRole: string) => {
        if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) return;
        try {
            await api.post('/admin/users/role', { id: userId, role: newRole });
            alert("✅ Rol actualizado con éxito");
            setEditingUser(null);
            fetchUsers();
        } catch {
            alert("❌ Error al actualizar rol");
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold border border-emerald-200"><Shield size={12} /> ADMIN</span>;
            case 'TEACHER': return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold border border-purple-200"><School size={12} /> DOCENTE</span>;
            default: return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200"><GraduationCap size={12} /> ESTUDIANTE</span>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-4">

            {/* HEADER */}
            <div className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-r ${theme.gradient} shrink-0`}>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black mb-1">Directorio de Usuarios</h1>
                        <p className="text-emerald-100 opacity-90 text-sm">Gestiona roles y permisos de la comunidad académica.</p>
                    </div>
                    <Users size={48} className="opacity-20" />
                </div>
            </div>

            {/* CONTROLES */}
            <div className="flex flex-col md:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {filterOptions.map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap
                                ${roleFilter === role
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {role === 'ALL' && <Filter size={16} />}
                            {role === 'ALL' ? 'Todos' : role}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Usuario</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Rol Actual</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-10 text-center text-slate-400">Cargando usuarios...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-10 text-center text-slate-400">No se encontraron usuarios.</td></tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {u.fullName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700">{u.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">{u.email}</td>
                                    <td className="p-4">{getRoleBadge(u.role)}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setEditingUser(u)}
                                            className="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                                            title="Cambiar Rol"
                                        >
                                            <UserCog size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
                    Mostrando {filteredUsers.length} usuarios
                </div>
            </div>

            {/* MODAL CAMBIO DE ROL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="font-bold text-lg mb-2 text-slate-800">Gestionar Rol</h3>
                        <p className="text-sm text-slate-500 mb-6">Selecciona el nuevo rol para <strong className="text-slate-700">{editingUser.fullName}</strong>.</p>

                        <div className="space-y-2 mb-6">
                            {['STUDENT', 'TEACHER', 'ADMIN'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleChangeRole(editingUser.id, role)}
                                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all
                                        ${editingUser.role === role
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {role === 'ADMIN' && <Shield size={16} />}
                                        {role === 'TEACHER' && <School size={16} />}
                                        {role === 'STUDENT' && <GraduationCap size={16} />}
                                        {role}
                                    </span>
                                    {editingUser.role === role && <UserCheck size={18} />}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setEditingUser(null)}
                            className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};