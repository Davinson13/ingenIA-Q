import { useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import logoImg from '../../assets/LogoPF.png';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // CORRECCIÓN: Usamos 'login' en lugar de 'setLogin'
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });

            // Verificamos si la respuesta viene directa o anidada en 'data'
            const data = res.data.data || res.data;
            const { token, user } = data;

            // CORRECCIÓN: Llamamos a la función login
            login(token, user);

            // Redirección inteligente según rol
            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (user.role === 'TEACHER') {
                navigate('/teacher/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err: unknown) {
            console.error(err);
            setIsLoading(false);

            if (axios.isAxiosError(err)) {
                if (err.response) {
                    const { status, data } = err.response;
                    if (status === 404) {
                        setError("El correo no está registrado.");
                    } else if (status === 401) {
                        setError("Contraseña incorrecta.");
                    } else {
                        setError(typeof data === 'string' ? data : "Error del servidor.");
                    }
                } else if (err.code === 'ERR_NETWORK') {
                    setError("No se pudo conectar con el servidor.");
                } else {
                    setError("Error de red inesperado.");
                }
            } else {
                setError("Ocurrió un error desconocido.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 transform transition-all hover:scale-[1.01] duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-40 h-40 mb-4">
                        <img src={logoImg} alt="Logo ingenIA-Q" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">ingenIA-Q</h2>
                    <p className="text-slate-500 mt-2 text-sm">Sistema de Gestión Académica Inteligente</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Correo Institucional</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                placeholder="estudiante@fica.edu.ec"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Contraseña</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform active:scale-[0.98]"
                    >
                        {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">© 2026 Facultad de Ingeniería y Ciencias Aplicadas</p>
                </div>
            </div>
        </div>
    );
};