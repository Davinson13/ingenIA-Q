import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const StudentHistoryPage = () => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [grades, setGrades] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/student/catalog/all')
            .then(res => setSubjects(res.data))
            .finally(() => setLoading(false));
    }, []);

    const handleGradeChange = (subjectId: number, value: string) => {
        setGrades(prev => ({ ...prev, [subjectId]: value }));
    };

    const handleSave = async () => {
        if (!confirm("¿Confirmar registro? Esto afectará tu malla.")) return;
        
        const payload = Object.entries(grades)
            .filter(([_, val]) => val !== "")
            .map(([id, val]) => ({ subjectId: parseInt(id), grade: parseFloat(val) }));

        try {
            await api.post('/student/history/register', { grades: payload });
            alert("✅ Historial actualizado.");
            window.location.reload();
        } catch { alert("Error al guardar."); }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>;

    // Agrupar materias
    const subjectsByLevel = subjects.reduce((acc: any, subj) => {
        const level = subj.semester || 1;
        if (!acc[level]) acc[level] = [];
        acc[level].push(subj);
        return acc;
    }, {});

    return (
        <div className="space-y-6 animate-in fade-in pb-20 px-4 md:px-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 rounded-3xl text-white shadow-lg">
                <h1 className="text-2xl md:text-3xl font-black mb-2">Historial Académico</h1>
                <p className="opacity-90 text-sm md:text-base">Registra tus materias aprobadas anteriormente.</p>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 text-yellow-800 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>Solo registra materias <strong>ya aprobadas</strong> (Nota {'>'}= 14). No ingreses materias que estás cursando ahora.</p>
            </div>

            {/* Lista por Semestres */}
            <div className="space-y-8">
                {Object.keys(subjectsByLevel).map((level) => (
                    <div key={level} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="bg-slate-100 text-slate-600 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black border border-slate-200">{level}</span>
                            Semestre {level}
                        </h3>
                        
                        {/* GRID RESPONSIVO: 1 columna móvil, 2 tablet, 3 escritorio */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subjectsByLevel[level].map((subj: any) => (
                                <div key={subj.id} className={`p-3 rounded-xl border transition-all flex justify-between items-center gap-2 ${subj.isEnrolled ? 'bg-green-50 border-green-200 opacity-80' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-700 text-xs truncate">{subj.name}</h4>
                                            {subj.isEnrolled && <CheckCircle size={14} className="text-green-600 shrink-0" />}
                                        </div>
                                        {subj.isEnrolled ? (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Nota: {subj.grade}</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">Pendiente</span>
                                        )}
                                    </div>
                                    
                                    {!subj.isEnrolled && (
                                        <input 
                                            type="number" 
                                            min="0" max="20"
                                            placeholder="Nota"
                                            className="w-16 h-10 border border-slate-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                            value={grades[subj.id] || ""}
                                            onChange={e => handleGradeChange(subj.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Botón Flotante */}
            <div className="fixed bottom-6 right-6 z-30">
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform hover:bg-blue-700 hover:shadow-2xl active:scale-95"
                >
                    <Save size={20} /> <span className="hidden sm:inline">Guardar Cambios</span>
                </button>
            </div>
        </div>
    );
};