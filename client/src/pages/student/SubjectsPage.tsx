import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BookOpen, CheckCircle2, CircleDashed, PlayCircle } from 'lucide-react';
import clsx from 'clsx';

// --- INTERFACES ---

interface Subject {
    id: number;
    name: string;
    semesterLevel: number;
    status: 'PENDING' | 'TAKING' | 'APPROVED' | 'FAILED';
    grade: number | null;
}

interface CareerPlan {
    careerName: string;
    totalSemesters: number;
    plan: Record<string, Subject[]>; 
}

/**
 * SubjectsPage Component
 * Displays the student's full academic history grouped by semester (Curriculum Map).
 */
export const SubjectsPage = () => {
    // --- State Management ---
    const [data, setData] = useState<CareerPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await api.get<CareerPlan>('/career/my-plan');
                setData(res.data);
            } catch (error) {
                console.error("Error loading curriculum", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    /**
     * Helper function to determine card styles based on subject status.
     */
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return {
                    border: 'border-l-4 border-l-green-500 border-slate-200',
                    bg: 'bg-white',
                    icon: <CheckCircle2 size={18} className="text-green-600" />,
                    text: 'text-slate-600',
                };
            case 'TAKING':
                return {
                    border: 'border-l-4 border-l-blue-600 border-blue-200 bg-blue-50', // Highlighted
                    bg: 'bg-blue-50',
                    icon: <PlayCircle size={18} className="text-blue-600 animate-pulse" />, // Subtle animation
                    text: 'text-blue-900 font-medium',
                };
            default: // PENDING or FAILED
                return {
                    border: 'border-slate-200 border-l-4 border-l-slate-300',
                    bg: 'bg-white opacity-80', // Slightly faded
                    icon: <CircleDashed size={18} className="text-slate-400" />,
                    text: 'text-slate-500',
                };
        }
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            
            {/* Header */}
            <header className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-800">Academic History</h1>
                <div className="flex items-center gap-2 mt-2">
                    <BookOpen className="text-blue-600" size={20} />
                    <p className="text-lg font-medium text-slate-500">{data?.careerName}</p>
                </div>
            </header>

            {/* Curriculum Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(data?.plan || {}).map(([semester, subjects]) => (
                    <div key={semester} className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                        
                        {/* Semester Header */}
                        <div className="p-3 bg-white border-b text-center">
                            <span className="font-bold text-slate-700">Semester {semester}</span>
                        </div>

                        <div className="p-3 space-y-3 flex-1">
                            {subjects.map((sub) => {
                                const style = getStatusStyles(sub.status);
                                
                                return (
                                    <div 
                                        key={sub.id} 
                                        className={clsx(
                                            "p-3 rounded-lg border shadow-sm flex flex-col gap-2 transition-all hover:shadow-md",
                                            style.border,
                                            style.bg
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={clsx("text-sm leading-snug flex-1", style.text)}>
                                                {sub.name}
                                            </p>
                                            <div className="mt-0.5">{style.icon}</div>
                                        </div>

                                        {/* Card Footer: Grade or Status Badge */}
                                        <div className="flex justify-end items-center mt-1">
                                            {sub.status === 'APPROVED' && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">
                                                    Grade: {sub.grade}
                                                </span>
                                            )}
                                            {sub.status === 'TAKING' && (
                                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                                                    In Progress
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
    );
};