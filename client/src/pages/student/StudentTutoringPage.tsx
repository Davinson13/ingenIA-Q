import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import {
    Search, Clock, MapPin, Monitor,
    User, BookOpen, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner'; // Import toast

import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';

// --- INTERFACES ---

interface TutoringOffer {
    id: number;
    date: string;
    teacherName: string;
    subjectName: string;
    modality: string;
    notes: string;
    capacity: number;
    booked: number;
    remaining: number;
    isBooked: boolean;
    isFull: boolean;
}

/**
 * StudentTutoringPage Component
 * Allows students to search for and book available tutoring sessions.
 */
export const StudentTutoringPage = () => {
    const theme = getTheme('STUDENT');

    // --- State Management ---
    const [tutorings, setTutorings] = useState<TutoringOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    /**
     * Fetches available tutoring sessions from the backend.
     */
    const fetchTutorings = async () => {
        try {
            const res = await api.get<TutoringOffer[]>('/student/tutorings/available');
            setTutorings(res.data);
        } catch (error) {
            console.error("Error fetching tutorings:", error);
            toast.error("Failed to load tutoring sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTutorings(); }, []);

    /**
     * Handles booking a tutoring session.
     * REPLACED window.confirm/alert with toast action.
     */
    const handleBook = (id: number) => {
        toast("Confirm booking?", {
            description: "This session will be added to your calendar.",
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await api.post('/student/tutorings/book', { tutoringId: id });
                        toast.success("✅ Booking confirmed! Check your calendar.");
                        fetchTutorings(); // Reload to update remaining spots
                    } catch (error: unknown) {
                        // Type-safe error handling
                        const err = error as AxiosError<{ error: string }>;
                        const msg = err.response?.data?.error || "Error booking session";
                        toast.error("❌ " + msg);
                    }
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => {}
            }
        });
    };

    // Filter Logic
    const filtered = tutorings.filter(t =>
        t.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            
            {/* HEADER */}
            <div className={`p-8 rounded-b-3xl shadow-lg -mx-4 sm:mx-0 sm:rounded-2xl text-white bg-gradient-to-r ${theme.gradient}`}>
                <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                    <Search size={32} /> Find Tutoring
                </h1>
                <p className="opacity-90">Find reinforcement sessions and book your spot.</p>

                {/* Search Bar */}
                <div className="mt-6 relative max-w-lg">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by subject or teacher..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-400 outline-none shadow-lg"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* OFFERS LIST */}
            {loading ? <div className="text-center p-20 text-slate-500">Searching for sessions...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                            No tutoring sessions available matching your search.
                        </div>
                    ) : filtered.map(t => (
                        <div key={t.id} className={`bg-white rounded-2xl shadow-sm border p-5 transition-all hover:shadow-md relative overflow-hidden ${t.isBooked ? 'border-green-400 ring-1 ring-green-400' : 'border-slate-200'}`}>

                            {/* Status Badge */}
                            {t.isBooked && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                    <CheckCircle2 size={12} /> BOOKED
                                </div>
                            )}
                            {t.isFull && !t.isBooked && (
                                <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                                    FULL
                                </div>
                            )}

                            {/* Date & Time */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center min-w-[60px]">
                                    <span className="block text-[10px] font-bold uppercase">{new Date(t.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                    <span className="block text-xl font-black">{new Date(t.date).getDate()}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                                        <Clock size={12} /> {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${t.modality === 'VIRTUAL' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {t.modality === 'VIRTUAL' ? <Monitor size={10} /> : <MapPin size={10} />} {t.modality}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{t.subjectName}</h3>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm text-slate-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    <span className="truncate">{t.teacherName}</span>
                                </div>
                                {t.notes && (
                                    <div className="flex items-start gap-2 bg-slate-50 p-2 rounded text-xs italic">
                                        <BookOpen size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{t.notes}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Action Button */}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <div className={`text-xs font-bold flex items-center gap-1 ${t.remaining < 3 ? 'text-red-500' : 'text-slate-400'}`}>
                                    <AlertCircle size={12} />
                                    {t.isFull ? '0 spots' : `${t.remaining} spots left`}
                                </div>

                                {!t.isBooked && !t.isFull && (
                                    <button
                                        onClick={() => handleBook(t.id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Book Now
                                    </button>
                                )}
                                {t.isBooked && (
                                    <span className="text-green-600 text-sm font-bold">Booked!</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};