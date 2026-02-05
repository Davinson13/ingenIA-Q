import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { 
    User as UserIcon, Lock, Save, Trash2, 
    AlertTriangle, CheckCircle, Shield, 
    Mail, GraduationCap, Building2, Loader2,
    Hand, Clock
} from 'lucide-react';

import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { getTheme } from '../../utils/themeUtils';

// --- INTERFACES ---

interface UserProfile {
    id: number;
    fullName: string;
    email: string;
    role: string;
    provider?: string;
    requestingCareer?: boolean;
    career?: {
        name: string;
    };
}

// Interface for API response
interface ApiResponse {
    user: UserProfile;
    message?: string;
}

/**
 * ProfilePage Component
 * Allows users to view their profile details, request career assignment (Students),
 * update their password/name, and delete their account.
 */
export const ProfilePage = () => {
    const { user, login, logout } = useAuthStore();
    const navigate = useNavigate();
    const theme = getTheme(user?.role || 'STUDENT');

    // --- State Management ---
    const [loadingData, setLoadingData] = useState(true);
    const [fullData, setFullData] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        currentPassword: '',
        newPassword: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // --- Initial Data Fetch ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Using explicit casting for safety
                const res = await api.get('/auth/me');
                const data = res.data as ApiResponse; // Explicit casting
                setFullData(data.user);
                setFormData(prev => ({ ...prev, fullName: data.user.fullName }));
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchProfile();
    }, []);

    // Fallback to auth store user if API data isn't loaded yet
    const displayUser = fullData || (user as unknown as UserProfile);

    // --- Handlers ---

    /**
     * Handles the request for a career assignment (Student only).
     */
    const handleRequestCareer = async () => {
        try {
            await api.post('/student/request-career');
            alert("✅ Request sent to Administrator.");
            
            // Update local state to reflect change immediately
            setFullData((prev) => prev ? ({ ...prev, requestingCareer: true }) : null);
        } catch (error: unknown) { // ✅ Fixed: Explicitly typed 'error'
            console.error(error); 
            alert("Failed to send request.");
        }
    };

    /**
     * Handles profile updates (Name & Password).
     */
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMsg({ type: '', text: '' });

        try {
            const payload: Record<string, string> = { fullName: formData.fullName };
            
            // Password change logic validation
            if (formData.newPassword) {
                if (!formData.currentPassword) {
                    setMsg({ type: 'error', text: 'Current password is required to set a new one.' });
                    setIsSaving(false);
                    return;
                }
                payload.password = formData.currentPassword;
                payload.newPassword = formData.newPassword;
            }

            // ✅ FIXED: Explicitly casting the response data
            const res = await api.put('/user/profile', payload);
            const data = res.data as ApiResponse; // Explicit type assertion
            
            // Update global auth store if token exists
            const currentToken = useAuthStore.getState().token;
            if (currentToken) login(currentToken, data.user);
            
            setFullData(data.user);
            setMsg({ type: 'success', text: 'Profile updated successfully.' });
            
            // Clear sensitive fields
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));

        } catch (error: unknown) {
            // Type-safe error handling
            const err = error as AxiosError<{ error: string }>;
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Handles account deletion.
     */
    const handleDelete = async () => {
        if (!confirm("🚨 ARE YOU SURE? This action cannot be undone and your data will be lost.")) return;
        try {
            await api.delete('/user/profile');
            logout();
            navigate('/login');
        } catch (error: unknown) { // ✅ Fixed: Explicitly typed 'error'
            console.error(error);
            alert("Failed to delete account."); 
        }
    };

    const isGoogleUser = displayUser?.provider === 'GOOGLE' || displayUser?.provider === 'GITHUB';

    if (loadingData) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400"/></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12 pt-6 px-4 sm:px-6">
            
            {/* PROFILE CARD */}
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
                            {displayUser?.role === 'STUDENT' ? 'Student' : displayUser?.role}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 text-center sm:text-left">{displayUser?.fullName}</h1>
                    <p className="text-slate-500 font-medium text-center sm:text-left">{displayUser?.email}</p>

                    {/* EXTRA DETAILS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="bg-white p-3 rounded-full shadow-sm text-slate-400 shrink-0"><Mail size={20} /></div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                <p className="font-bold text-slate-700 text-sm truncate">{displayUser?.email}</p>
                            </div>
                        </div>

                        {/* 🔥 CAREER SECTION (BUTTON LOGIC) */}
                        {displayUser?.role === 'STUDENT' && (
                            <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 relative">
                                <div className="bg-white p-3 rounded-full shadow-sm text-emerald-500 shrink-0"><GraduationCap size={20} /></div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Career</p>
                                    
                                    {displayUser?.career ? (
                                        // CASE 1: CAREER ASSIGNED
                                        <p className="font-black text-emerald-900 text-sm">{displayUser.career.name}</p>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <span className="italic font-normal text-slate-400 text-sm">Unassigned</span>
                                            
                                            {displayUser.requestingCareer ? (
                                                // CASE 2: REQUESTED (PENDING)
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 w-fit animate-pulse">
                                                    <Clock size={12}/> Pending
                                                </span>
                                            ) : (
                                                // CASE 3: NO CAREER & NO REQUEST (BUTTON)
                                                <button 
                                                    onClick={handleRequestCareer}
                                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-1 w-fit"
                                                >
                                                    <Hand size={12}/> Request
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
                                    <p className="text-[10px] font-bold text-blue-600/70 uppercase">Department</p>
                                    <p className="font-black text-blue-900 text-sm">Faculty</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ALERTS */}
            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold shadow-sm ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <span>{msg.text}</span>
                </div>
            )}

            {/* EDIT FORM */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-500">
                        <p className="mb-2 font-bold text-slate-700">Security</p>
                        <p>Update your name or change your password periodically to keep your account safe.</p>
                    </div>
                    {isGoogleUser && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2">
                            <Shield size={16}/> Account linked to {displayUser?.provider}
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdate} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 mb-4 border-b pb-2">
                                <UserIcon className="text-blue-500" size={20} /> Edit Profile
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                        </div>

                        {!isGoogleUser && (
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 mb-4 border-b pb-2 pt-2">
                                    <Lock className="text-amber-500" size={20} /> Security
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                                            value={formData.currentPassword} onChange={e => setFormData({ ...formData, currentPassword: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                                            value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isSaving} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-70">
                                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm"><AlertTriangle size={16} /> Danger Zone</h3>
                        </div>
                        <button onClick={handleDelete} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 text-xs">
                            <Trash2 size={14} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};