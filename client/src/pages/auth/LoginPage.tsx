import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, ArrowRight, Chrome, CheckCircle } from 'lucide-react';
import { signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { auth, googleProvider } from '../../config/firebase';
import logoImg from "../../assets/LogoPF.png";
/**
 * LoginPage Component
 * Handles both User Login and Registration flows using a toggleable interface.
 * Supports Email/Password authentication and Social OAuth (Google only).
 */
export const LoginPage = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    // --- State: Form Inputs ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // --- State: UI Feedback ---
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handles traditional Email/Password submission.
     * Differentiates between Login and Register based on `isRegistering` state.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Reset previous feedback states
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering ? { fullName, email, password } : { email, password };

            // Sending request to backend
            const res = await api.post(endpoint, payload);

            if (isRegistering) {
                // REGISTRATION SUCCESS
                setSuccessMsg(res.data.message || "Registration successful. Please check server logs to verify.");
                // We do not redirect immediately; user needs to verify or log in manually.
            } else {
                // LOGIN SUCCESS
                const data = res.data.data || res.data; // Handle potential API response variations
                login(data.token, data.user);

                // Role-based Redirection
                if (data.user.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (data.user.role === 'TEACHER') {
                    navigate('/teacher/dashboard');
                } else {
                    // Default for STUDENT role
                    navigate('/dashboard');
                }
            }

        } catch (err: unknown) {
            console.error("Authentication Error:", err);
            
            // Safe Error Handling using type guards
            if (axios.isAxiosError(err) && err.response) {
                const msg = err.response.data;
                // If the server returns a simple string or a JSON with an error field
                setError(typeof msg === 'string' ? msg : (msg?.error || "Request failed."));
            } else {
                setError("Connection error. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles OAuth Authentication via Firebase (Google).
     * Once Firebase authenticates, it sends the user data to the backend to create/login the user.
     */
    const handleGoogleOAuth = async () => {
        setIsLoading(true);
        setError('');

        try {
            // 1. Trigger Firebase Popup
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // 2. Prepare payload for backend
            const payload = {
                email: user.email,
                fullName: user.displayName || "Unknown User",
                provider: 'GOOGLE'
            };

            // 3. Send to backend to sync/create user
            const res = await api.post('/auth/oauth', payload);
            const data = res.data.data;

            // 4. Update Global Auth Store
            login(data.token, data.user);

            // 5. Redirect based on Role
            if (data.user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (data.user.role === 'TEACHER') {
                navigate('/teacher/dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (error: unknown) {
            console.error("OAuth Error:", error);

            // Specific Firebase Error Handling
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case 'auth/account-exists-with-different-credential':
                        setError("An account already exists with the same email but different sign-in credentials.");
                        break;
                    case 'auth/popup-closed-by-user':
                        setError("Sign-in popup was closed before completion.");
                        break;
                    case 'auth/cancelled-popup-request':
                        // User cancelled, clear error to avoid confusion
                        setError("");
                        break;
                    default:
                        setError(`Authentication failed: ${error.message}`);
                }
            } else {
                setError("An unknown error occurred while connecting to the provider.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden font-sans">

            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            {/* MAIN CARD CONTAINER */}
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl min-h-[600px] flex flex-col md:flex-row">

                {/* 1. FORM SECTION (Dynamic Content) */}
                <div className={`w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10 transition-all duration-500 ${isRegistering ? 'md:translate-x-full' : ''}`}>

                    <div className="text-center mb-8">
                        <img src={logoImg} alt="Platform Logo" className="h-16 mx-auto mb-4 object-contain" />
                        <h2 className="text-3xl font-black text-slate-800">
                            {isRegistering ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            {isRegistering ? 'Join the academic community today.' : 'Enter your credentials to continue.'}
                        </p>
                    </div>

                    {/* Social OAuth Buttons */}
                    <div className="flex gap-4 justify-center mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleOAuth}
                            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group flex items-center gap-2 px-6"
                            title="Sign in with Google"
                        >
                            <Chrome className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Google</span>
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center mb-6">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or use email</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Feedback Messages */}
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

                    {/* Authentication Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegistering && (
                            <div className="relative group animate-in fade-in slide-in-from-bottom-2">
                                <User className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text" placeholder="Full Name" required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                    value={fullName} onChange={e => setFullName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="email" placeholder="Institutional Email" required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={email} onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="password" placeholder="Password" required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                value={password} onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit" disabled={isLoading}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all transform active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20"
                        >
                            {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    {/* Mobile Toggle Button */}
                    <div className="mt-6 text-center md:hidden">
                        <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-blue-600 hover:underline">
                            {isRegistering ? 'Already have an account? Login' : 'New here? Create an account'}
                        </button>
                    </div>
                </div>

                {/* 2. OVERLAY SECTION (Sliding Panel) */}
                {/* This section slides over the form on desktop to create a dynamic effect */}
                <div
                    className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex-col justify-center items-center p-12 transition-transform duration-500 ease-in-out z-20 ${isRegistering ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="text-center space-y-6 max-w-sm">
                        <h2 className="text-4xl font-black tracking-tight">
                            {isRegistering ? 'Welcome Back!' : 'Join Us Today!'}
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            {isRegistering
                                ? 'To keep connected with us please login with your personal info.'
                                : 'Enter your personal details and start your journey with us.'}
                        </p>
                        <button
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                            className="px-8 py-3 border-2 border-white rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
                        >
                            {isRegistering ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>

                    {/* Artistic Background Overlay Elements */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-2xl"></div>
                        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                    </div>
                </div>

                {/* 3. NEUTRAL BACKGROUND FILLER */}
                {/* Fills the empty space left by the sliding panel */}
                <div className={`hidden md:block absolute top-0 ${isRegistering ? 'right-0' : 'left-0'} w-1/2 h-full bg-slate-50 transition-all duration-500 z-0`}></div>
            </div>
        </div>
    );
};