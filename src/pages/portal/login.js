import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ShieldCheck, 
  Activity as ActivityIcon, 
  Zap, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();
  const [checking, setChecking]         = useState(true);
  const [authStage, setAuthStage]       = useState('email');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage]   = useState('');
  const [isLoading, setIsLoading]       = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/portal-usuarios/me');
        if (res.ok) { router.replace('/portal/dashboard'); return; }
      } catch { /* no session */ }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); setStatusMessage('');
    try {
      const res = await fetch('/api/portal-usuarios/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) { setErrorMessage(result.error || 'No se pudo validar el correo'); return; }
      setStatusMessage(result.message || 'Solicitud procesada');
      if (result.firstTime) {
        sessionStorage.setItem('portal_email', email);
        router.push('/portal/otp');
      } else {
        setAuthStage('password');
      }
    } catch { 
      setErrorMessage('No se pudo procesar tu solicitud'); 
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); setStatusMessage('');
    try {
      const res = await fetch('/api/portal-usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) { setErrorMessage(result.error || 'No se pudo iniciar sesión'); return; }
      router.replace('/portal/dashboard');
    } catch { 
      setErrorMessage('Error al conectar con el servidor'); 
    } finally {
      setIsLoading(false);
    }
  }
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1c4040]">
        <div className="relative mb-8">
           <img src="/img/logo_dark.png" alt="" className="w-24 opacity-20" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-[#c2ef03]/20 border-t-[#c2ef03] rounded-full animate-spin" />
           </div>
        </div>
        <p className="text-[#c2ef03] font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Sincronizando Sistema</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Acceso Miembros | Elíseos Box & Fitness</title>
      </Head>

      <div className="min-h-screen flex bg-white font-sans selection:bg-[#c2ef03] selection:text-[#1c4040]">
        
        {/* ── LEFT PANEL: CINEMATIC VISUAL ── */}
        <div className="hidden lg:flex relative w-[55%] min-h-screen overflow-hidden" style={{ backgroundColor: '#1c4040' }}>
          {/* Main Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/img/poster_login.webp" 
              alt="Elíseos Box & Fitness" 
              className="w-full h-full object-cover opacity-60 scale-105"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1c4040] via-[#1c4040]/85 to-transparent" />
          </div>

          {/* Design Elements */}
          <div className="absolute top-0 left-0 w-full p-16 z-20">
             <img src="/img/logo_dark.png" alt="Logo Elíseos" className="w-72 max-w-full h-auto object-contain" />
          </div>

          {/* Impact Text */}
          <div className="relative z-20 mt-auto p-20 space-y-8 animate-fade-in flex flex-col">
             <div className="space-y-2">
                <p className="text-[#c2ef03] font-black text-xs uppercase tracking-[0.4em]">Portal de Miembros</p>
                <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter font-serif">
                  DESAFÍA<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#c2ef03]/70 italic font-light">TU POTENCIAL</span>
                </h1>
             </div>

             <div className="flex gap-10">
                {[
                  { label: 'Control Técnico', icon: ActivityIcon },
                  { label: 'Evolución Real', icon: Zap },
                  { label: 'Acceso Seguro', icon: ShieldCheck }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[#c2ef03] border border-white/10">
                        <item.icon size={20} />
                     </div>
                     <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-10 left-20 z-20">
             <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em]">
               © {new Date().getFullYear()} Elíseos · Box & Fitness
             </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: AUTH FORM ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 relative overflow-hidden bg-white">
          
          <div className="w-full max-w-sm space-y-10 relative z-10">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-10">
               <img src="/img/logo_light.png" alt="Logo Elíseos" className="w-60 max-w-full h-auto object-contain" />
            </div>

            {/* Welcome Text */}
            <div className="space-y-2 text-center lg:text-left">
              <p className="text-[#1c4040] font-black text-[10px] uppercase tracking-[0.3em]">Acceso Miembros</p>
              <h2 className="text-4xl font-black text-[#1c4040] tracking-tighter leading-tight font-serif">Bienvenido</h2>
              <p className="text-slate-500 font-medium text-sm">Ingresa tus credenciales para acceder al portal.</p>
            </div>

            {/* Alerts */}
            {statusMessage && (
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-sm font-bold animate-fade-in">
                 <CheckCircle2 size={18} /> {statusMessage}
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-bold animate-fade-in">
                 <AlertCircle size={18} /> {errorMessage}
              </div>
            )}

            {/* Auth Stages */}
            <div className="space-y-6">
              {authStage === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1c4040] transition-colors">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="miembro@eliseos.mx"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1c4040] placeholder:text-slate-400 focus:ring-4 focus:ring-[#1c4040]/10 focus:border-[#1c4040] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isLoading}
                    type="submit" 
                    className="w-full group bg-[#1c4040] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#255252] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#1c4040]/20"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Validar Acceso <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-[#c2ef03]" /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1c4040] shadow-sm">
                        <Mail size={16} />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo Validado</p>
                        <p className="text-xs font-bold text-[#1c4040] truncate">{email}</p>
                     </div>
                     <button 
                        type="button" 
                        onClick={() => setAuthStage('email')}
                        className="p-2 text-slate-400 hover:text-[#1c4040] transition-colors"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1c4040] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#1c4040] placeholder:text-slate-400 focus:ring-4 focus:ring-[#1c4040]/10 focus:border-[#1c4040] outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#1c4040] transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    disabled={isLoading}
                    type="submit" 
                    className="w-full group bg-[#1c4040] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#255252] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#1c4040]/20"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Iniciar Sesión <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-[#c2ef03]" /></>}
                  </button>
                </form>
              )}
            </div>

            {/* Helper links */}
            <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
               <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                 ¿No tienes cuenta o tienes problemas para entrar?<br />
                 <span className="text-[#1c4040] font-black uppercase tracking-widest cursor-pointer hover:underline">Contactar Soporte Técnico</span>
               </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
