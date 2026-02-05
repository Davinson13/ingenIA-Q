import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- INTERFACES ---

interface Message {
    id: number;
    sender: 'USER' | 'AI';
    text: string;
}

interface ChatResponse {
    reply: string;
}

/**
 * AiTutorPage Component
 * Provides a chat interface for students to interact with an AI tutor connected to their subjects.
 */
export const AiTutorPage = () => {
    // --- State Management ---
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: 'AI', text: 'Hello 👋 I am IngenIA. I am connected to your subjects. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Ref for auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);

    /**
     * Scrolls the chat view to the latest message.
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * Handles sending a message to the AI backend.
     * @param e - The form event (optional)
     */
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput(''); 

        // 1. Add User Message immediately
        setMessages(prev => [...prev, { id: Date.now(), sender: 'USER', text: userMsg }]);
        setLoading(true);

        try {
            // 2. Send to Backend
            // We expect a JSON response with a 'reply' field
            const res = await api.post<ChatResponse>('/student/ai-chat', { message: userMsg });
            
            // 3. Add AI Response
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: res.data.reply }]);
        } catch (error: unknown) {
            console.error("AI Chat Error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: 'I encountered a connection error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center gap-3 text-white shadow-md z-10 shrink-0">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                    <Sparkles size={20} className="text-yellow-300" />
                </div>
                <div>
                    <h2 className="font-bold text-base leading-tight">Academic AI Tutor</h2>
                    <p className="text-violet-200 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                    </p>
                </div>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${msg.sender === 'USER' ? 'bg-slate-800' : 'bg-violet-600'}`}>
                                {msg.sender === 'USER' ? <User size={14} className="text-white"/> : <Bot size={14} className="text-white"/>}
                            </div>

                            {/* Message Bubble */}
                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed overflow-hidden ${
                                msg.sender === 'USER' 
                                    ? 'bg-slate-800 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                            }`}>
                                {msg.sender === 'USER' ? (
                                    <p>{msg.text}</p>
                                ) : (
                                    /* Markdown Rendering for AI Responses */
                                    <div className="markdown-content space-y-2">
                                        <ReactMarkdown 
                                            components={{
                                                // Custom styling for markdown elements
                                                strong: ({node, ...props}) => <span className="font-bold text-violet-700" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                                                li: ({node, ...props}) => <li className="marker:text-violet-400" {...props} />,
                                                p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator */}
                {loading && (
                    <div className="flex justify-start pl-11">
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-2 shadow-sm">
                            <Loader2 size={14} className="text-violet-500 animate-spin"/>
                            <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                        </div>
                    </div>
                )}
                
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <input 
                        type="text" 
                        placeholder="Ask your question here..." 
                        className="w-full pl-5 pr-14 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all text-slate-700 font-medium placeholder:text-slate-400"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        <Send size={18} className={input.trim() && !loading ? '-ml-0.5' : ''} />
                    </button>
                </div>
            </form>
        </div>
    );
};