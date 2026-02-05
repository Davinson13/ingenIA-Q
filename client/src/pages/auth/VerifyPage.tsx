import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

import api from '../../api/axios';

/**
 * VerifyPage Component
 * * Handles the email verification process. It extracts the verification token and email
 * from the URL query parameters, sends them to the backend, and displays the result.
 * * States:
 * - LOADING: Waiting for the API response.
 * - SUCCESS: Account verified successfully.
 * - ERROR: Verification failed (expired token, invalid link, etc.).
 */
export const VerifyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // UI State Management
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('Verifying your account...');

    useEffect(() => {
        /**
         * Triggers the verification request to the backend.
         */
        const verifyAccount = async () => {
            const email = searchParams.get('email');
            const code = searchParams.get('code');

            // 1. Validation: Ensure params exist
            if (!email || !code) {
                setStatus('ERROR');
                setMessage("Invalid or incomplete verification link.");
                return;
            }

            try {
                // 2. API Call
                await api.post('/auth/verify', { email, code });
                setStatus('SUCCESS');
                
            } catch (error: unknown) {
                setStatus('ERROR');
                
                // 3. Safe Error Handling
                if (axios.isAxiosError(error) && error.response?.data) {
                    // Extract specific error message from backend if available
                    const errorData = error.response.data;
                    // Ensure we render a string, even if the backend sends an object
                    setMessage(typeof errorData === 'string' ? errorData : (errorData.error || JSON.stringify(errorData)));
                } else {
                    // Fallback for generic errors (network issues, etc.)
                    setMessage("The code has expired or is incorrect.");
                }
            }
        };

        // Artificial delay for better UX (prevents flickering)
        const timer = setTimeout(() => verifyAccount(), 1500);

        // Cleanup timer on unmount
        return () => clearTimeout(timer);
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
                
                {/* STATE: LOADING */}
                {status === 'LOADING' && (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <Loader2 size={64} className="text-blue-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Verifying...</h2>
                        <p className="text-slate-500">We are validating your information.</p>
                    </div>
                )}

                {/* STATE: SUCCESS */}
                {status === 'SUCCESS' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Account Verified!</h2>
                        <p className="text-slate-500 mb-8">
                            Your email has been successfully confirmed. You can now access the platform.
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Go to Login <ArrowRight size={18}/>
                        </button>
                    </div>
                )}

                {/* STATE: ERROR */}
                {status === 'ERROR' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle size={40} className="text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Verification Failed</h2>
                        <p className="text-slate-500 mb-8 max-w-[250px] mx-auto text-sm break-words">
                            {message}
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full border-2 border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};