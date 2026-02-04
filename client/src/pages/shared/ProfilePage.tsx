import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { 
    User as UserIcon, Lock, Save, Trash2, 
    AlertTriangle, CheckCircle, Shield, 
    Mail, GraduationCap, Building2, Loader2,
    Hand, Clock // 🔥 Importamos estos iconos nuevos
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getTheme } from '../../utils/themeUtils';

export const ProfilePage = () => {
    const { user, login, logout } = useAuthStore();
    const navigate = useNavigate();
    const theme = getTheme(user?.role || 'STUDENT');

    const [loadingData, setLoadingData] = useState(true);
    const [fullData, setFullData] = useState<any>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        currentPassword: '',
        newPassword: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Cargar datos
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/me');
                setFullData(res.data.user);
                setFormData(prev => ({ ...prev, fullName: res.data.user.fullName }));
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchProfile();
    }, []);

    const displayUser = fullData || user;

    // 🔥 HANDLER: SOLICITAR CARRERA
    const handleRequestCareer = async () => {
        try {
            await api.post('/student/request-career');
            alert("✅ Solicitud enviada al Administrador.");
            
            // Actualizamos la vista localmente para que cambie el botón instantáneamente
            setFullData((prev: any) => ({ ...prev, requestingCareer: true }));
        } catch (error) {
            alert("Error al enviar la solicitud.");
        }
    };

    // HANDLER: ACTUALIZAR PERFIL
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMsg({ type: '', text: '' });

        try {
            const payload: Record<string, string> = { fullName: formData.fullName };
            if (formData.newPassword) {
                if (!formData.currentPassword) {
                    setMsg({ type: 'error', text: 'Debes escribir tu contraseña actual.' });
                    setIsSaving(false);
                    return;
                }
                payload.password = formData.currentPassword;
                payload.newPassword = formData.newPassword;
            }

            const res = await api.put('/user/profile', payload);
            const currentToken = useAuthStore.getState().token;
            if (currentToken) login(currentToken, res.data.user);
            setFullData(res.data.user);
            setMsg({ type: 'success', text: 'Datos actualizados correctamente.' });
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } catch (error) {
            const err = error as AxiosError<{ error: string }>;
            setMsg({ type: 'error', text: err.response?.data?.error || 'Error al actualizar.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("🚨 ¿ESTÁS SEGURO? Perderás tu cuenta para siempre.")) return;
        try {
            await api.delete('/user/profile');
            logout();
            navigate('/login');
        } catch { alert("Error al eliminar cuenta."); }
    };

    const isGoogleUser = displayUser?.provider === 'GOOGLE' || displayUser?.provider === 'GITHUB';

    if (loadingData) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400"/></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12 pt-6 px-4 sm:px-6">
            
            {/* TARJETA DE PERFIL */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative">
                <div className={`h-32 bg-gradient-to-r ${theme.gradient}`}></div>
                <div className="px-6 pb-8 sm:px-8">
                    <div className="relative -mt-12 flex flex-col sm:flex-row justify-between items-center sm:items-end mb-6 text-center sm:text-left">
                        <div className="w-24 h-24 bg-white rounded-full p-2 shadow-lg mb-4 sm:mb-0">
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-3xl font-black text-white ${theme.primary} uppercase`}>
                                {displayUser?.fullName ? displayUser.fullName.charAt(0) : <UserIcon />}
                            </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 sm:mb-1 ${
                            displayUser?.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' :
                            displayUser?.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                        }`}>
                            {displayUser?.role === 'STUDENT' ? 'Estudiante' : displayUser?.role}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 text-center sm:text-left">{displayUser?.fullName}</h1>
                    <p className="text-slate-500 font-medium text-center sm:text-left">{displayUser?.email}</p>

                    {/* DATOS EXTRA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="bg-white p-3 rounded-full shadow-sm text-slate-400 shrink-0"><Mail size={20} /></div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Correo</p>
                                <p className="font-bold text-slate-700 text-sm truncate">{displayUser?.email}</p>
                            </div>
                        </div>

                        {/* 🔥 SECCIÓN DE CARRERA (LÓGICA DEL BOTÓN) */}
                        {displayUser?.role === 'STUDENT' && (
                            <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 relative">
                                <div className="bg-white p-3 rounded-full shadow-sm text-emerald-500 shrink-0"><GraduationCap size={20} /></div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Carrera</p>
                                    
                                    {displayUser?.career ? (
                                        // CASO 1: YA TIENE CARRERA
                                        <p className="font-black text-emerald-900 text-sm">{displayUser.career.name}</p>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <span className="italic font-normal text-slate-400 text-sm">Sin asignar</span>
                                            
                                            {displayUser.requestingCareer ? (
                                                // CASO 2: YA SOLICITÓ (PENDIENTE)
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 w-fit animate-pulse">
                                                    <Clock size={12}/> Pendiente
                                                </span>
                                            ) : (
                                                // CASO 3: NO TIENE Y NO HA PEDIDO (BOTÓN)
                                                <button 
                                                    onClick={handleRequestCareer}
                                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1 w-fit"
                                                >
                                                    <Hand size={12}/> Solicitar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {displayUser?.role === 'TEACHER' && (
                            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="bg-white p-3 rounded-full shadow-sm text-blue-500 shrink-0"><Building2 size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-600/70 uppercase">Departamento</p>
                                    <p className="font-black text-blue-900 text-sm">Docencia</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ALERTAS */}
            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold shadow-sm ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span>{msg.text}</span>
                </div>
            )}

            {/* FORMULARIO */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-500">
                        <p className="mb-2 font-bold text-slate-700">Seguridad</p>
                        <p>Actualiza tu nombre o cambia tu contraseña periódicamente.</p>
                    </div>
                    {isGoogleUser && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2">
                            <Shield size={16}/> Cuenta vinculada a {user?.provider}
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdate} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 mb-4 border-b pb-2">
                                <UserIcon className="text-blue-500" size={20} /> Editar Datos
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                        </div>

                        {!isGoogleUser && (
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 mb-4 border-b pb-2 pt-2">
                                    <Lock className="text-amber-500" size={20} /> Seguridad
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña Actual</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                                            value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Contraseña</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                                            value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isSaving} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-70">
                                <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>

                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm"><AlertTriangle size={16} /> Zona de Peligro</h3>
                        </div>
                        <button onClick={handleDelete} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 text-xs">
                            <Trash2 size={14} /> Eliminar Cuenta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};