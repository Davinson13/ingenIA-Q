import { useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 👈 Importamos axios
import { Mail, Lock, User, ArrowRight, Github, Chrome, CheckCircle } from 'lucide-react';
import logoImg from '../../assets/LogoPF.png';
import { signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider, githubProvider } from '../../config/firebase';

export const LoginPage = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // UI States
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- MANEJO DE FORMULARIO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering ? { fullName, email, password } : { email, password };

            const res = await api.post(endpoint, payload);

            if (isRegistering) {
                // REGISTRO EXITOSO
                setSuccessMsg(res.data.message || "Registro exitoso. Revisa la consola del servidor para verificar.");
                setIsLoading(false);
                // No redirigimos, el usuario debe verificar su cuenta
            } else {
                // LOGIN EXITOSO
                const data = res.data.data || res.data;
                login(data.token, data.user);

                // Redirección por Rol
                if (data.user.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (data.user.role === 'TEACHER') {
                    navigate('/teacher/dashboard');
                } else {
                    // Para todos los demás (STUDENT), vamos al dashboard principal
                    navigate('/dashboard');
                }
            }

        } catch (err: unknown) { // 👈 TIPADO SEGURO
            console.error(err);
            setIsLoading(false);

            if (axios.isAxiosError(err) && err.response) {
                const msg = err.response.data;
                setError(typeof msg === 'string' ? msg : "Error en la solicitud.");
            } else {
                setError("Error de conexión. Intenta nuevamente.");
            }
        }
    };

    // --- OAUTH CON FIREBASE ---
    const handleOAuth = async (providerName: 'GOOGLE' | 'GITHUB') => {
        setIsLoading(true);
        setError('');

        try {
            const provider = providerName === 'GOOGLE' ? googleProvider : githubProvider;

            // 2. Login con ventana emergente
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const payload = {
                email: user.email,
                fullName: user.displayName || "Usuario sin nombre",
                provider: providerName
            };

            const res = await api.post('/auth/oauth', payload);
            const data = res.data.data;

            login(data.token, data.user);

            if (data.user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (data.user.role === 'TEACHER') {
                navigate('/teacher/dashboard');
            } else {
                // Para todos los demás (STUDENT), vamos al dashboard principal
                navigate('/dashboard');
            }

        } catch (error: unknown) {
            console.error("Error OAuth:", error);

            // Verificamos si es un error de Firebase
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/account-exists-with-different-credential') {
                    setError("Ya existe una cuenta con este correo pero con otro método de acceso.");
                } else if (error.code === 'auth/popup-closed-by-user') {
                    setError("Se cerró la ventana de inicio de sesión.");
                } else if (error.code === 'auth/cancelled-popup-request') {
                    // Ignoramos si fue cancelado
                    setError("");
                } else {
                    setError("Error de autenticación: " + error.message);
                }
            } else {
                // Error genérico no relacionado con Firebase
                setError("Error desconocido al conectar con el proveedor.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden font-sans">

            {/* Fondos decorativos */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* CARD PRINCIPAL */}
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl min-h-[600px] flex flex-col md:flex-row">

                {/* 1. SECCIÓN FORMULARIO (z-10 para estar encima) */}
                <div className={`w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10 transition-all duration-500 ${isRegistering ? 'md:translate-x-full' : ''}`}>

                    <div className="text-center mb-8">
                        <img src={logoImg} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                        <h2 className="text-3xl font-black text-slate-800">
                            {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {isRegistering ? 'Únete a la comunidad académica' : 'Ingresa tus credenciales para continuar'}
                        </p>
                    </div>

                    {/* Botones Sociales */}
                    <div className="flex gap-4 justify-center mb-6">
                        <button
                            type="button" // Importante type="button" para que no envíe el form
                            onClick={() => handleOAuth('GOOGLE')}
                            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group"
                        >
                            <Chrome className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOAuth('GITHUB')}
                            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group"
                        >
                            <Github className="w-5 h-5 text-slate-600 group-hover:text-black" />
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center mb-6">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">O usa tu correo</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center border border-red-100">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-3 bg-green-50 text-green-600 text-xs font-bold rounded-lg text-center border border-green-100 flex items-center justify-center gap-2">
                            <CheckCircle size={14} /> {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegistering && (
                            <div className="relative group animate-in fade-in slide-in-from-bottom-2">
                                <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text" placeholder="Nombre Completo" required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                    value={fullName} onChange={e => setFullName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="email" placeholder="Correo Institucional o Personal" required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={email} onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="password" placeholder="Contraseña" required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={password} onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit" disabled={isLoading}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all transform active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20"
                        >
                            {isLoading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    {/* Toggle Móvil */}
                    <div className="mt-6 text-center md:hidden">
                        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-blue-600 hover:underline">
                            {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
                        </button>
                    </div>
                </div>

                {/* 2. SECCIÓN DECORATIVA (OVERLAY) */}
                <div
                    className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex-col justify-center items-center p-12 transition-transform duration-500 ease-in-out z-20 ${isRegistering ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="text-center space-y-6 max-w-sm">
                        <h2 className="text-4xl font-black tracking-tight">
                            {isRegistering ? '¡Bienvenido!' : '¡Únete a Nosotros!'}
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            {isRegistering
                                ? 'Ingresa con tus credenciales para acceder a tu panel de control.'
                                : 'Regístrate hoy y gestiona tu vida académica de manera inteligente.'}
                        </p>
                        <button
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                            className="px-8 py-3 border-2 border-white rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
                        >
                            {isRegistering ? 'Iniciar Sesión' : 'Registrarse'}
                        </button>
                    </div>

                    {/* Decoración */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-2xl"></div>
                        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                    </div>
                </div>

                {/* 3. FONDO NEUTRO */}
                <div className={`hidden md:block absolute top-0 ${isRegistering ? 'right-0' : 'left-0'} w-1/2 h-full bg-slate-50 transition-all duration-500 z-0`}></div>
            </div>
        </div>
    );
};