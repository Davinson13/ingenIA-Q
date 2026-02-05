import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalIcon,
    BookOpen, GraduationCap, Users, Star, Clock, Globe
} from 'lucide-react';

// --- INTERFACES ---

interface AgendaEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: string;
    color: string;
}

// Tooltip State Interface
interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    event: AgendaEvent | null;
}

/**
 * CalendarPage Component
 * Displays the student's monthly agenda, including classes, exams, assignments,
 * and custom personal events or extra courses.
 */
export const CalendarPage = () => {
    const theme = getTheme('STUDENT');

    // --- State: Date & Data ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // --- State: Modals ---
    const [showExtraModal, setShowExtraModal] = useState(false);
    const [showCourseModal, setShowCourseModal] = useState(false);

    // --- State: Forms ---
    const [extraForm, setExtraForm] = useState({ title: '', description: '', date: '', time: '' });
    const [courseForm, setCourseForm] = useState({
        name: '', startTime: '', endTime: '', startDate: '', endDate: '',
        days: [] as number[]
    });

    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false, x: 0, y: 0, event: null
    });

    /**
     * Fetches events for the currently selected month and year.
     */
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<AgendaEvent[]>(`/student/calendar?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`);
            setEvents(res.data);
        } catch (error) {
            console.error("Error loading agenda", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    // Initial Load & On Date Change
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // --- Handlers: Extra Event (Personal) ---
    
    const handleCreateExtra = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION: Prevent past dates
        const selectedDate = new Date(`${extraForm.date}T${extraForm.time}`);
        const now = new Date();

        if (selectedDate < now) {
            alert("⚠️ You cannot add activities in the past. Please check the date and time.");
            return;
        }

        try {
            await api.post('/student/calendar/personal', extraForm);
            alert("✅ Activity created successfully");
            setShowExtraModal(false);
            setExtraForm({ title: '', description: '', date: '', time: '' }); // Reset form
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert("❌ Error creating activity");
        }
    };

    // --- Handlers: External Course ---

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION 1: Start Date
        const start = new Date(courseForm.startDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            alert("⚠️ The course cannot start on a past date.");
            return;
        }

        // VALIDATION 2: Date Logic
        if (courseForm.endDate < courseForm.startDate) {
            alert("⚠️ End date cannot be before start date.");
            return;
        }

        // VALIDATION 3: Time Logic
        if (courseForm.startTime >= courseForm.endTime) {
            alert("⚠️ End time must be after start time.");
            return;
        }

        try {
            await api.post('/student/calendar/external', courseForm);
            alert("✅ Extra course added successfully");
            setShowCourseModal(false);
            setCourseForm({ name: '', startTime: '', endTime: '', startDate: '', endDate: '', days: [] }); // Reset
            fetchEvents();
        } catch (error) {
            console.error(error);
            alert("❌ Error creating course");
        }
    };

    const toggleDay = (day: number) => {
        setCourseForm(prev => {
            const newDays = prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day];
            return { ...prev, days: newDays };
        });
    };

    // --- Render Logic ---

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysElements = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            daysElements.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEvents = events.filter(e => {
                const d = new Date(e.date);
                // Note: Ensure backend sends date string compatible with Date constructor (ISO 8601 recommended)
                // We add 'T00:00:00' logic in backend usually to avoid timezone shifts, 
                // but here we just check day/month match strictly.
                // Using UTC methods might be safer depending on backend implementation.
                // For now, assuming local time match:
                return d.getDate() === day && d.getMonth() === month;
            });
            
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            daysElements.push(
                <div key={day} className={`h-32 border border-slate-100 p-2 overflow-y-auto relative hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
                    <span className={`text-sm font-bold block mb-1 ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{day}</span>
                    <div className="space-y-1">
                        {dayEvents.map((evt, idx) => (
                            <div key={idx}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top, event: evt });
                                }}
                                onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                                className={`text-[10px] px-2 py-1 rounded cursor-pointer truncate font-bold flex items-center gap-1 border
                                    ${evt.type === 'CLASE' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                    ${evt.type === 'DEBER' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                                    ${evt.type === 'EXAMEN' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                    ${evt.type === 'TUTORIA' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                    ${evt.type === 'COMPLEMENTARIO' ? 'bg-teal-100 text-teal-700 border-teal-200' : ''}
                                    ${evt.type === 'EXTRA' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                `}
                            >
                                {/* ICONS BY TYPE */}
                                {evt.type === 'CLASE' && <BookOpen size={10} />}
                                {evt.type === 'EXAMEN' && <GraduationCap size={10} />}
                                {evt.type === 'TUTORIA' && <Users size={10} />}
                                {evt.type === 'COMPLEMENTARIO' && <Globe size={10} />}
                                {evt.type === 'EXTRA' && <Star size={10} />}
                                {evt.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return daysElements;
    };

    return (
        <div className="space-y-6 pb-20">
            
            {/* HEADER */}
            <div className={`text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden mb-8 -mx-4 sm:mx-0 sm:rounded-2xl bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3"><CalIcon size={32} /> Academic Calendar</h1>
                        <p className="text-blue-100 opacity-90">Organize your classes, assignments, and personal life.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ChevronLeft /></button>
                        <h2 className="text-2xl font-bold w-48 text-center capitalize">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ChevronRight /></button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowExtraModal(true)} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/30 flex items-center gap-2"><Star size={18} /> Extra</button>
                        <button onClick={() => setShowCourseModal(true)} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2"><Plus size={18} /> Ext. Course</button>
                    </div>
                </div>
            </div>

            {/* LEGEND */}
            <div className="flex flex-wrap gap-4 justify-center text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Classes</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Assignments</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Exams</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Tutoring</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-teal-500"></span> Ext. Courses</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Personal</span>
            </div>

            {/* CALENDAR GRID */}
            {loading ? (
                <div className="p-20 text-center text-slate-400">Loading agenda...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {renderDays()}
                    </div>
                </div>
            )}

            {/* TOOLTIP */}
            {tooltip.visible && tooltip.event && (
                <div 
                    className="fixed z-50 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl w-48 pointer-events-none" 
                    style={{ top: tooltip.y - 10, left: tooltip.x, transform: 'translate(-50%, -100%)' }}
                >
                    <div className="font-bold text-sm mb-1">{tooltip.event.title}</div>
                    <div className="opacity-80 mb-2">{tooltip.event.description}</div>
                    <div className="flex items-center gap-1 font-mono text-xs bg-white/10 p-1 rounded w-fit">
                        <Clock size={10} /> 
                        {new Date(tooltip.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            )}

            {/* MODAL: EXTRA (Personal) */}
            {showExtraModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Personal Activity</h3>
                        <form onSubmit={handleCreateExtra} className="space-y-3">
                            <input required type="text" placeholder="Title (e.g., Gym, Dentist)" className="w-full p-3 border rounded-lg" value={extraForm.title} onChange={e => setExtraForm({ ...extraForm, title: e.target.value })} />
                            <input required type="date" className="w-full p-3 border rounded-lg" value={extraForm.date} onChange={e => setExtraForm({ ...extraForm, date: e.target.value })} />
                            <input required type="time" className="w-full p-3 border rounded-lg" value={extraForm.time} onChange={e => setExtraForm({ ...extraForm, time: e.target.value })} />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowExtraModal(false)} className="flex-1 py-3 text-slate-500 bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EXTERNAL COURSE */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">New External Course</h3>
                        <form onSubmit={handleCreateCourse} className="space-y-3">
                            <input required type="text" placeholder="Name (e.g., Advanced English)" className="w-full p-3 border rounded-lg" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} />
                            <div className="flex gap-2">
                                <input required type="time" className="w-1/2 p-3 border rounded-lg" value={courseForm.startTime} onChange={e => setCourseForm({ ...courseForm, startTime: e.target.value })} />
                                <input required type="time" className="w-1/2 p-3 border rounded-lg" value={courseForm.endTime} onChange={e => setCourseForm({ ...courseForm, endTime: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1/2"><label className="text-xs font-bold">Start Date</label><input required type="date" className="w-full p-2 border rounded-lg" value={courseForm.startDate} onChange={e => setCourseForm({ ...courseForm, startDate: e.target.value })} /></div>
                                <div className="w-1/2"><label className="text-xs font-bold">End Date</label><input required type="date" className="w-full p-2 border rounded-lg" value={courseForm.endDate} onChange={e => setCourseForm({ ...courseForm, endDate: e.target.value })} /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block">Days of the Week</label>
                                <div className="flex justify-between">
                                    {[1, 2, 3, 4, 5, 6, 0].map(d => (
                                        <button key={d} type="button" onClick={() => toggleDay(d)} className={`w-8 h-8 rounded-full text-xs font-bold ${courseForm.days.includes(d) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 text-slate-500 bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-teal-600 text-white rounded-lg">Add Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};