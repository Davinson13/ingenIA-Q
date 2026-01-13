import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Eraser } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios'; // <--- ASEGÚRATE DE IMPORTAR ESTO ARRIBA

// Tipo de mensaje
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export const AiTutorPage = () => {
    const { user } = useAuthStore();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Estado inicial con un mensaje de bienvenida
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: `¡Hola ${user?.fullName.split(' ')[0]}! Soy tu Tutor IA de la FICA. 🤖\n\nPuedo ayudarte a repasar temas de tus materias, recordarte tu horario o darte consejos de estudio. ¿En qué trabajamos hoy?`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);

    // Auto-scroll al fondo cuando llega un mensaje nuevo
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        // 1. Mensaje del Usuario (Visual inmediato)
        const userMsg: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true); // Activar animación

        try {
            // 2. LLAMADA REAL AL BACKEND 🚀
            const { data } = await api.post('/ai/chat', { question: userMsg.text });

            // 3. Agregar respuesta del Backend
            const aiMsg: Message = {
                id: Date.now() + 1,
                text: data.text,
                sender: 'ai',
                timestamp: new Date(data.timestamp)
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Error hablando con la IA", error);
            // Mensaje de error visual
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: "Lo siento, tuve un problema de conexión. Inténtalo de nuevo. 🔌",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false); // Apagar animación
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* 1. Cabecera del Chat */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-purple-200">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">Tutor Virtual FICA</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-slate-500 font-medium">En línea</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setMessages([])} // Limpiar chat (opcional)
                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                    title="Borrar historial"
                >
                    <Eraser size={20} />
                </button>
            </div>

            {/* 2. Área de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={clsx(
                            "flex gap-4 max-w-[80%]",
                            msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        {/* Avatar */}
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                            msg.sender === 'user' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                        )}>
                            {msg.sender === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                        </div>

                        {/* Burbuja de Texto */}
                        <div className={clsx(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.sender === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                        )}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <p className={clsx(
                                "text-[10px] mt-2 text-right opacity-70",
                                msg.sender === 'user' ? "text-blue-100" : "text-slate-400"
                            )}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Indicador de "Escribiendo..." */}
                {isTyping && (
                    <div className="flex gap-4 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <Sparkles size={16} />
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 3. Área de Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu pregunta sobre cálculo, programación, horarios..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 outline-none py-2"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

        </div>
    );
};