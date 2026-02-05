import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { getTheme } from '../../utils/themeUtils';
import {
    BookOpen, Users, Clock, Plus,
    GraduationCap, Layers, ChevronRight, School,
    Edit, Trash2, Save, X
} from 'lucide-react';

// --- INTERFACES ---

interface Schedule {
    id: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface Parallel {
    id: number;
    code: string;
    capacity: number;
    teacherId: number;
    schedules: Schedule[];
}

interface Subject {
    id: number;
    name: string;
    semesterLevel: number;
    parallels: Parallel[];
}

interface Career {
    id: number;
    name: string;
    subjects: Subject[];
}

interface UserTeacher {
    id: number;
    fullName: string;
    role: string;
}

/**
 * AdminAcademicPage Component
 * Manages the academic structure: Careers, Subjects, Parallels, and Schedules.
 */
export const AdminAcademicPage = () => {
    const theme = getTheme('ADMIN');

    // --- State: Data Structure ---
    const [careers, setCareers] = useState<Career[]>([]);
    const [teachers, setTeachers] = useState<UserTeacher[]>([]);

    // --- State: User Selection (Navigation) ---
    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // --- State: Modals & UI ---
    const [showParallelModal, setShowParallelModal] = useState(false);
    const [parallelForm, setParallelForm] = useState({ code: 'A', capacity: 30, teacherId: '' });

    // --- State: Inline Editing ---
    const [editingCourse, setEditingCourse] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ capacity: 0, teacherId: 0 });

    // --- State: Schedule Management ---
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [currentParallelForSchedule, setCurrentParallelForSchedule] = useState<Parallel | null>(null);
    const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 1, startTime: '', endTime: '' });

    // 🔄 REF: SELECTION TRACKER
    // Stores the current selection to allow 'fetchData' to restore user context
    // without creating circular dependencies in useEffect/useCallback.
    const selectionRef = useRef({ selectedCareer, selectedSubject, currentParallelForSchedule });

    useEffect(() => {
        selectionRef.current = { selectedCareer, selectedSubject, currentParallelForSchedule };
    }, [selectedCareer, selectedSubject, currentParallelForSchedule]);

    /**
     * Data Fetching Function
     * Loads the academic structure and restores user selection if applicable.
     */
    const fetchData = useCallback(async () => {
        try {
            // 1. Fetch Academic Structure
            const resStructure = await api.get<Career[]>('/admin/academic/structure');
            setCareers(resStructure.data);
            
            // 2. Restore Selection (Reading from Ref to avoid dependencies)
            const { 
                selectedCareer: currentC, 
                selectedSubject: currentS, 
                currentParallelForSchedule: currentP 
            } = selectionRef.current;

            if (currentC && currentS) {
                // Find updated career object
                const updatedCareer = resStructure.data.find((c) => c.id === currentC.id);
                if (updatedCareer) {
                    setSelectedCareer(updatedCareer);
                    
                    // Find updated subject object
                    const updatedSubject = updatedCareer.subjects.find((s) => s.id === currentS.id);
                    if (updatedSubject) setSelectedSubject(updatedSubject);
                    
                    // If schedule modal is open, update its parallel reference
                    if (currentP) {
                        const updatedParallel = updatedSubject?.parallels.find(p => p.id === currentP.id);
                        if (updatedParallel) setCurrentParallelForSchedule(updatedParallel);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to reload academic structure", error);
        }
    }, []); // Empty dependencies = Stable function reference

    // --- Initial Load Effect ---
    useEffect(() => {
        // 🔥 FIX: Wrapping the call in an async function inside useEffect
        // satisfies the linter that we are not causing synchronous updates loop.
        const initData = async () => {
            await fetchData();
            
            // Load teachers only once
            try {
                const res = await api.get<UserTeacher[]>('/admin/users');
                const teacherList = res.data.filter((u) => u.role === 'TEACHER');
                setTeachers(teacherList);
            } catch (error) {
                console.error("Error loading teachers", error);
            }
        };

        initData();
    }, [fetchData]);

    // --- Helper: Filtering Logic ---
    const semesters = selectedCareer
        ? Array.from(new Set(selectedCareer.subjects.map(s => s.semesterLevel))).sort((a, b) => a - b)
        : [];

    const filteredSubjects = selectedCareer && selectedSemester
        ? selectedCareer.subjects.filter(s => s.semesterLevel === selectedSemester)
        : [];

    // Translated days array
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // --- Handlers: Navigation ---
    const handleSelectCareer = (c: Career) => {
        setSelectedCareer(c);
        setSelectedSemester(null);
        setSelectedSubject(null);
    };

    const handleSelectSemester = (sem: number) => {
        setSelectedSemester(sem);
        setSelectedSubject(null);
    };

    // --- Handlers: Parallel CRUD ---
    const handleCreateParallel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject) return;

        try {
            await api.post('/admin/academic/parallel', { ...parallelForm, subjectId: selectedSubject.id });
            alert("✅ Parallel created successfully");
            setShowParallelModal(false);
            setParallelForm({ code: 'A', capacity: 30, teacherId: '' });
            fetchData();
        } catch {
            alert("❌ Failed to create parallel. Check if period is active.");
        }
    };

    const startEdit = (parallel: Parallel) => {
        setEditingCourse(parallel.id);
        setEditForm({ capacity: parallel.capacity, teacherId: parallel.teacherId || 0 });
    };

    const handleUpdateCourse = async (id: number) => {
        try {
            await api.put(`/admin/course/${id}`, editForm);
            setEditingCourse(null);
            alert("✅ Course updated successfully");
            fetchData(); 
        } catch {
            alert("❌ Failed to update course");
        }
    };

    const handleDeleteCourse = async (id: number) => {
        if (!confirm("⚠️ Are you sure? This cannot be undone if students are enrolled.")) return;
        try {
            await api.delete(`/admin/course/${id}`);
            alert("🗑️ Course deleted");
            fetchData();
        } catch (error: unknown) {
             // Safe error handling with type narrowing
             if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response: { data: { error: string } } };
                alert(apiError.response?.data?.error || "Error deleting course");
            } else {
                alert("Error deleting course");
            }
        }
    };

    // --- Handlers: Schedule Management ---
    const openScheduleModal = (parallel: Parallel) => {
        setCurrentParallelForSchedule(parallel);
        setScheduleForm({ dayOfWeek: 1, startTime: '', endTime: '' });
        setShowScheduleModal(true);
    };

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentParallelForSchedule) return;
        try {
            await api.post('/admin/academic/schedule', {
                ...scheduleForm,
                parallelId: currentParallelForSchedule.id
            });
            alert("Schedule added");
            setScheduleForm({ dayOfWeek: 1, startTime: '', endTime: '' });
            fetchData();
        } catch {
            alert("Failed to add schedule block");
        }
    };

    const handleDeleteSchedule = async (scheduleId: number) => {
        if(!confirm("Delete this time block?")) return;
        try {
            await api.delete(`/admin/schedule/${scheduleId}`);
            fetchData();
        } catch {
            alert("Failed to delete schedule");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-4">

            {/* HEADER */}
            <div className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black mb-1">Academic Structure</h1>
                        <p className="text-emerald-100 opacity-90 text-sm">Manage educational offerings: Careers, Subjects, Parallels, and Schedules.</p>
                    </div>
                    <School className="opacity-20 absolute right-4 top-1/2 -translate-y-1/2" size={100} />
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* COL 1: CAREERS */}
                <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <GraduationCap size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">1. Careers</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {careers.map(c => (
                            <button key={c.id} onClick={() => handleSelectCareer(c)} className={`w-full text-left p-4 rounded-xl text-sm font-bold transition-all border flex justify-between items-center group ${selectedCareer?.id === c.id ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:border-slate-200'}`}>
                                <span className="truncate">{c.name}</span>
                                {selectedCareer?.id === c.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* COL 2: SEMESTERS */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <Layers size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">2. Level</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {selectedCareer ? semesters.map(sem => (
                            <button key={sem} onClick={() => handleSelectSemester(sem)} className={`w-full text-center p-3 rounded-xl text-sm font-bold transition-all border ${selectedSemester === sem ? 'bg-emerald-600 text-white shadow-md border-emerald-600' : 'bg-white border-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}>
                                {sem}º Semester
                            </button>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center"><GraduationCap size={32} className="mb-2 opacity-50" /><p className="text-xs">Select Career</p></div>
                        )}
                    </div>
                </div>

                {/* COL 3: SUBJECTS */}
                <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <BookOpen size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">3. Subjects</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {selectedSemester ? filteredSubjects.map(s => (
                            <button key={s.id} onClick={() => setSelectedSubject(s)} className={`w-full text-left p-3 rounded-xl text-sm transition-all border flex items-center gap-3 ${selectedSubject?.id === s.id ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 border-slate-100'}`}>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${selectedSubject?.id === s.id ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <span className="truncate">{s.name}</span>
                            </button>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-4 text-center"><Layers size={32} className="mb-2 opacity-50" /><p className="text-xs">Select Level</p></div>
                        )}
                    </div>
                </div>

                {/* COL 4: PARALLEL DETAILS */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm relative">
                    {selectedSubject ? (
                        <>
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                <div>
                                    <h2 className="font-black text-slate-800 leading-tight">{selectedSubject.name}</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Parallel Management</p>
                                </div>
                                <button onClick={() => setShowParallelModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow-md transition-all" title="Create Parallel"><Plus size={20} /></button>
                            </div>

                            <div className="overflow-y-auto p-4 space-y-4 flex-1 bg-slate-50/30">
                                {selectedSubject.parallels.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl m-4">
                                        <p className="text-slate-500 font-medium text-sm">No active parallels.</p>
                                    </div>
                                )}

                                {selectedSubject.parallels.map((p) => (
                                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group relative">
                                        
                                        {/* CARD HEADER */}
                                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-50">
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider">Parallel {p.code}</span>
                                            <div className="flex gap-1">
                                                {editingCourse === p.id ? (
                                                    <>
                                                        <button onClick={() => handleUpdateCourse(p.id)} className="p-1.5 text-green-600 bg-green-50 rounded-lg"><Save size={16}/></button>
                                                        <button onClick={() => setEditingCourse(null)} className="p-1.5 text-slate-400 bg-slate-50 rounded-lg"><X size={16}/></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                                                        <button onClick={() => handleDeleteCourse(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* DATA */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">T</div>
                                                {editingCourse === p.id ? (
                                                    <select className="w-full border border-slate-300 rounded p-1 text-xs" value={editForm.teacherId} onChange={e => setEditForm({...editForm, teacherId: Number(e.target.value)})}>
                                                        <option value="">-- Unassigned --</option>
                                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className="truncate font-medium">{teachers.find(t => t.id === p.teacherId)?.fullName || <span className="text-red-400 italic">Unassigned</span>}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-slate-500 pl-11">
                                                <Users size={14} />
                                                {editingCourse === p.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" className="w-16 border border-slate-300 rounded p-1 text-center" value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: Number(e.target.value)})}/> <span>Seats</span>
                                                    </div>
                                                ) : (
                                                    <span>{p.capacity} Max Seats</span>
                                                )}
                                            </div>

                                            {/* SCHEDULES */}
                                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-50 pl-11">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock size={10}/> Schedule</div>
                                                {p.schedules && p.schedules.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.schedules.map(s => (
                                                            <span key={s.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                                {days[s.dayOfWeek].substring(0,3)} {s.startTime}-{s.endTime}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-xs text-slate-300 italic">Unassigned</span>}
                                                
                                                <button onClick={() => openScheduleModal(p)} className="text-xs text-blue-600 hover:underline font-bold self-start mt-1">
                                                    + Manage Schedule
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50/50"><BookOpen size={48} className="mb-3 opacity-20" /><p className="font-bold text-slate-400">Select Subject</p></div>
                    )}
                </div>
            </div>

            {/* MODAL CREATE PARALLEL */}
            {showParallelModal && selectedSubject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <h3 className="font-bold text-xl mb-1 text-slate-800">New Parallel</h3>
                        <p className="text-xs text-slate-500 mb-6 uppercase">{selectedSubject.name}</p>
                        <form onSubmit={handleCreateParallel} className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Code</label><input type="text" className="w-full border p-2.5 rounded-lg font-bold text-center uppercase" placeholder="A" maxLength={1} value={parallelForm.code} onChange={e => setParallelForm({ ...parallelForm, code: e.target.value.toUpperCase() })} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capacity</label><input type="number" className="w-full border p-2.5 rounded-lg text-center" value={parallelForm.capacity} onChange={e => setParallelForm({ ...parallelForm, capacity: parseInt(e.target.value) })} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teacher</label><select className="w-full border p-2.5 rounded-lg bg-white" value={parallelForm.teacherId} onChange={e => setParallelForm({ ...parallelForm, teacherId: e.target.value })} required><option value="">Select...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select></div>
                            <div className="flex gap-2 pt-4"><button type="button" onClick={() => setShowParallelModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl">Create</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL SCHEDULE (NEW) */}
            {showScheduleModal && currentParallelForSchedule && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowScheduleModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X/></button>
                        <h3 className="font-bold text-xl text-slate-800 mb-1">Class Schedule</h3>
                        <p className="text-sm text-slate-500 mb-4">Parallel {currentParallelForSchedule.code} - {selectedSubject?.name}</p>

                        <div className="bg-slate-50 rounded-xl p-3 mb-6 space-y-2 max-h-40 overflow-y-auto">
                            {currentParallelForSchedule.schedules?.length === 0 && <p className="text-center text-xs text-slate-400">No hours assigned.</p>}
                            {currentParallelForSchedule.schedules?.map((s) => (
                                <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                                    <span className="text-sm font-bold text-slate-700">{days[s.dayOfWeek]} <span className="font-normal text-slate-500 mx-1">|</span> {s.startTime} - {s.endTime}</span>
                                    <button onClick={() => handleDeleteSchedule(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddSchedule} className="space-y-3 border-t pt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase">Add Block</p>
                            <div className="grid grid-cols-3 gap-3">
                                <select className="col-span-3 border p-2 rounded-lg text-sm bg-white" value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm({...scheduleForm, dayOfWeek: parseInt(e.target.value)})}>{days.map((d, i) => (i > 0 && <option key={i} value={i}>{d}</option>))}</select>
                                <input type="time" required className="border p-2 rounded-lg text-sm" value={scheduleForm.startTime} onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})} />
                                <input type="time" required className="border p-2 rounded-lg text-sm" value={scheduleForm.endTime} onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})} />
                                <button type="submit" className="col-span-1 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700"><Plus size={20}/></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};