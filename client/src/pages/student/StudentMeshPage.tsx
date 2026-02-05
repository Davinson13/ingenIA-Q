import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Check, X, Clock, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---

interface MeshSubject {
    id: number;
    name: string;
    semester: number;
    enrollmentStatus: 'APPROVED' | 'TAKING' | 'FAILED' | null;
    grade?: number;
    credits?: number; // Optional if not always present
}

/**
 * StudentMeshPage Component
 * Visualizes the student's academic progress (curriculum map) grouped by semester.
 */
export const StudentMeshPage = () => {
    // --- State Management ---
    const [subjects, setSubjects] = useState<MeshSubject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<MeshSubject[]>('/student/catalog/all')
            .then(res => setSubjects(res.data))
            .catch(() => toast.warning("Error loading curriculum."))
            .finally(() => setLoading(false));
    }, []);

    // Group by semester and sort ascending
    const levels = Array.from(new Set(subjects.map(s => s.semester))).sort((a, b) => a - b);

    /**
     * Returns CSS classes based on subject status.
     */
    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'APPROVED': return 'bg-emerald-100 border-emerald-300 text-emerald-900';
            case 'TAKING': return 'bg-blue-100 border-blue-300 text-blue-900';
            case 'FAILED': return 'bg-red-100 border-red-300 text-red-900';
            default: return 'bg-slate-50 border-slate-200 text-slate-400 grayscale opacity-80';
        }
    };

    /**
     * Returns the appropriate icon component based on status.
     */
    const getStatusIcon = (status: string | null) => {
        switch (status) {
            case 'APPROVED': return <Check size={16} className="text-emerald-600" />;
            case 'TAKING': return <Clock size={16} className="text-blue-600" />;
            case 'FAILED': return <X size={16} className="text-red-600" />;
            default: return <Lock size={14} className="opacity-40" />;
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (subjects.length === 0) return <div className="text-center p-10 text-slate-400">No subjects assigned to your career.</div>;

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-4">
            <div className="px-4 md:px-0">
                <h1 className="text-3xl font-black text-slate-800">Curriculum Map</h1>
                <p className="text-slate-500 text-sm">Your academic progress roadmap.</p>
            </div>

            {/* RESPONSIVE SCROLL CONTAINER */}
            <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent px-4 md:px-0">
                <div className="flex gap-4 min-w-max">
                    {levels.map((level) => (
                        <div key={level} className="w-64 shrink-0 flex flex-col gap-3">
                            {/* Semester Header */}
                            <div className="bg-slate-800 text-white py-2 px-3 rounded-lg text-center font-bold shadow-md text-sm sticky top-0 z-10">
                                Semester {level}
                            </div>
                            
                            {/* Subject List */}
                            <div className="flex flex-col gap-3">
                                {subjects.filter(s => s.semester === level).map(subj => {
                                    const status = subj.enrollmentStatus;
                                    return (
                                        <div key={subj.id} className={`p-3 rounded-xl border-l-4 shadow-sm flex flex-col gap-2 transition-all hover:scale-[1.02] hover:shadow-md ${getStatusColor(status)}`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-bold text-xs leading-snug">{subj.name}</span>
                                                <div className="bg-white/50 p-1 rounded-full shadow-sm shrink-0">
                                                    {getStatusIcon(status)}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-black/5 pt-2 mt-1">
                                                <span className="text-[10px] font-bold opacity-60">4 Credits</span>
                                                {status === 'APPROVED' && (
                                                    <span className="text-xs font-black bg-white/60 px-1.5 py-0.5 rounded text-emerald-800">
                                                        {subj.grade}/20
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LEGEND */}
            <div className="flex flex-wrap gap-4 justify-center text-xs font-bold text-slate-600 border-t border-slate-100 pt-4 px-4">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div> Approved</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> In Progress</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div> Failed</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded"></div> Pending</span>
            </div>
        </div>
    );
};