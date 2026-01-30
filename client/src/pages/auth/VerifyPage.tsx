import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState('Verificando tu cuenta...');

    useEffect(() => {
        const verifyAccount = async () => {
            const email = searchParams.get('email');
            const code = searchParams.get('code');

            if (!email || !code) {
                setStatus('ERROR');
                setMessage("Link de verificación inválido o incompleto.");
                return;
            }

            try {
                // Llamada al endpoint backend que creamos
                await api.post('/auth/verify', { email, code });
                setStatus('SUCCESS');
            } catch (error: any) {
                setStatus('ERROR');
                setMessage(error.response?.data || "El código ha expirado o es incorrecto.");
            }
        };

        // Pequeño delay para que no sea instantáneo (UX)
        setTimeout(() => verifyAccount(), 1500);
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
                
                {status === 'LOADING' && (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <Loader2 size={64} className="text-blue-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Verificando...</h2>
                        <p className="text-slate-500">Estamos validando tu información.</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">¡Cuenta Verificada!</h2>
                        <p className="text-slate-500 mb-8">
                            Tu correo ha sido confirmado correctamente. Ya puedes acceder a la plataforma.
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            Ir a Iniciar Sesión <ArrowRight size={18}/>
                        </button>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle size={40} className="text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Error de Verificación</h2>
                        <p className="text-slate-500 mb-8 max-w-[250px] mx-auto">
                            {message}
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full border-2 border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Volver al Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};