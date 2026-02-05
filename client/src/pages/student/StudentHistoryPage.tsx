import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---

interface Subject {
    id: number;
    name: string;
    semester: number;
    isEnrolled?: boolean;
    grade?: number;
}

// Map for grouping subjects by semester level
type SubjectMap = Record<number, Subject[]>;

/**
 * StudentHistoryPage Component
 * Allows students to register previously passed subjects to update their academic history
 * and curriculum progress.
 */
export const StudentHistoryPage = () => {
    // --- State Management ---
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [grades, setGrades] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        api.get<Subject[]>('/student/catalog/all')
            .then(res => setSubjects(res.data))
            .catch(err => {
                console.error("Error fetching subjects:", err);
                toast.error("Failed to load subjects history");
            })
            .finally(() => setLoading(false));
    }, []);

    /**
     * Updates the local grade state for a specific subject.
     */
    const handleGradeChange = (subjectId: number, value: string) => {
        setGrades(prev => ({ ...prev, [subjectId]: value }));
    };

    /**
     * Submits the entered grades to the backend.
     * REPLACED alert/confirm with toast promise and action.
     */
    const handleSave = () => {
        // Prepare payload: filter empty inputs and convert to numbers
        const payload = Object.entries(grades)
            .filter(([_, val]) => val !== "")
            .map(([id, val]) => ({ subjectId: parseInt(id), grade: parseFloat(val) }));

        if (payload.length === 0) {
            toast.warning("Please enter at least one grade to save.");
            return;
        }

        toast("Confirm registration?", {
            description: "This will update your academic curriculum status.",
            action: {
                label: "Save Changes",
                onClick: () => {
                    // Use toast.promise for loading/success/error feedback
                    toast.promise(
                        api.post('/student/history/register', { grades: payload }),
                        {
                            loading: 'Updating academic history...',
                            success: () => {
                                // Reload page after short delay to reflect changes
                                setTimeout(() => window.location.reload(), 1000);
                                return "✅ History updated successfully.";
                            },
                            error: "❌ Error saving data."
                        }
                    );
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => {}
            }
        });
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>;

    // Group subjects by semester level
    const subjectsByLevel: SubjectMap = subjects.reduce((acc: SubjectMap, subj) => {
        const level = subj.semester || 1;
        if (!acc[level]) acc[level] = [];
        acc[level].push(subj);
        return acc;
    }, {});

    return (
        <div className="space-y-6 animate-in fade-in pb-20 px-4 md:px-0">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 rounded-3xl text-white shadow-lg">
                <h1 className="text-2xl md:text-3xl font-black mb-2">Academic History</h1>
                <p className="opacity-90 text-sm md:text-base">Register your previously approved subjects.</p>
            </div>

            {/* Warning / Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 text-yellow-800 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>Only register subjects you have <strong>already passed</strong> (Grade {'>'}= 14). Do not enter subjects you are currently taking.</p>
            </div>

            {/* List by Semester */}
            <div className="space-y-8">
                {Object.keys(subjectsByLevel).map((levelStr) => {
                    const level = parseInt(levelStr);
                    return (
                        <div key={level} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                                <span className="bg-slate-100 text-slate-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black border border-slate-200">{level}</span>
                                Semester {level}
                            </h3>
                            
                            {/* RESPONSIVE GRID: 1 col mobile, 2 tablet, 3 desktop */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {subjectsByLevel[level].map((subj) => (
                                    <div key={subj.id} className={`p-3 rounded-xl border transition-all flex justify-between items-center gap-2 ${subj.isEnrolled ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-700 text-xs truncate">{subj.name}</h4>
                                                {subj.isEnrolled && <CheckCircle size={14} className="text-green-600 shrink-0" />}
                                            </div>
                                            {subj.isEnrolled ? (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Grade: {subj.grade}</span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">Pending</span>
                                            )}
                                        </div>
                                        
                                        {!subj.isEnrolled && (
                                            <input 
                                                type="number" 
                                                min="0" max="20"
                                                placeholder="Grade"
                                                className="w-16 h-10 border border-slate-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                                value={grades[subj.id] || ""}
                                                onChange={e => handleGradeChange(subj.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 z-30">
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform hover:bg-blue-700 hover:shadow-2xl active:scale-95"
                >
                    <Save size={20} /> <span className="hidden sm:inline">Save Changes</span>
                </button>
            </div>
        </div>
    );
};