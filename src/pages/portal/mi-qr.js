import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  QrCode, 
  Download, 
  ShieldCheck, 
  Info, 
  User as UserIcon, 
  Zap,
  Smartphone,
  Share2,
  AlertCircle,
  Award,
  Trophy,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import PortalLayout, { usePortal } from '@/components/portal/PortalLayout';

function MiQrContent() {
  const data    = usePortal();
  const user    = data?.user;
  const canvasRef = useRef(null);

  const [qrToken, setQrToken]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [qrReady, setQrReady]   = useState(false);
  const [passportInfo, setPassportInfo] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/portal-usuarios/mi-qr');
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al obtener QR'); return; }
        setQrToken(json.qrToken);
      } catch { setError('Error de conexión'); }
      finally { setLoading(false); }
    }
    load();

    // Carga no bloqueante del pasaporte para el badge de fidelidad
    fetch('/api/portal-usuarios/pasaporte')
      .then(r => r.json())
      .then(d => { if (d?.success) setPassportInfo(d.passport); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!qrToken || !canvasRef.current) return;
    let cancelled = false;

    async function draw() {
      try {
        const QRCode = (await import('qrcode')).default;
        const url    = `${window.location.origin}/admin/usuario-qr/${qrToken}`;
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 320,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
        if (!cancelled) setQrReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Error al generar el QR');
      }
    }
    draw();
    return () => { cancelled = true; };
  }, [qrToken]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link    = document.createElement('a');
    link.download = `eliseos-qr-${user?.name?.split(' ')[0] || 'miembro'}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            <QrCode size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Mi Identidad</h1>
            <p className="text-science-500 font-medium mt-1">Acceso digital a Elíseos Box & Fitness</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* QR Card Column */}
        <div className="lg:col-span-5 animate-fade-in [animation-delay:0.1s]">
          <div className="bg-white rounded-[2.5rem] border border-science-100 shadow-xl overflow-hidden relative group">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-12 group-hover:scale-110 transition-transform duration-700">
              <QrCode size={200} />
            </div>
            
            {/* Card Header */}
            <div className="bg-science-900 p-8 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-primary/50 bg-white/10 flex items-center justify-center overflow-hidden">
                  {user?.foto ? <img src={user.foto} className="w-full h-full object-cover" /> : <span className="font-black text-lg">{user?.name?.charAt(0)}</span>}
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{user?.name}</h3>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{user?.type || 'Miembro'}</span>
                </div>
              </div>
              <div className="absolute top-8 right-8">
                 <Smartphone size={20} className="text-white/20" />
              </div>
            </div>

            {/* QR Area */}
            <div className="p-10 flex flex-col items-center">
              <div className="bg-white p-4 rounded-3xl border-2 border-science-50 shadow-inner relative mb-8">
                {loading && (
                   <div className="w-[260px] h-[260px] flex items-center justify-center bg-science-50/50 rounded-2xl">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                   </div>
                )}
                <canvas ref={canvasRef} style={{ width: '260px', height: '260px', display: qrReady ? 'block' : 'none', borderRadius: '12px' }} />
                {!qrReady && !loading && (
                  <div className="w-[260px] h-[260px] flex items-center justify-center text-red-400">
                    <AlertCircle size={40} />
                  </div>
                )}
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={handleDownload}
                  disabled={!qrReady}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-science-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-science-900/10 disabled:opacity-50"
                >
                  <Download size={16} /> Descargar Identificación
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-science-300 uppercase tracking-widest pt-2">
                  <ShieldCheck size={12} className="text-green-500" /> Token de seguridad activo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Column */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in [animation-delay:0.2s]">
          
          {/* Passport Rewards Card Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[2rem] border border-slate-800 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] -rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Trophy size={140} />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={12} /> Reto Anual 2026
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">Mi Pasaporte del Atleta</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
                  Acumula sellos por constancia y experiencia para desbloquear recompensas exclusivas.
                </p>
                {passportInfo && (
                  <div className="flex items-center gap-4 pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Sellos Obtenidos</span>
                      <span className="text-2xl font-black text-amber-400">{passportInfo.totalSellos || 0} <span className="text-xs text-slate-500 font-bold">/ 56</span></span>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Progreso</span>
                      <span className="text-base font-black text-cyan-400">{passportInfo.porcentajeProgreso || 0}%</span>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/portal/pasaporte"
                className="inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/10 transition-all shrink-0"
              >
                <Award size={16} /> Ver Mi Pasaporte <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* How to use */}
          <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm">
            <h2 className="text-[11px] font-black text-science-900 uppercase tracking-[0.2em] mb-8 pb-4 border-b border-science-50 flex items-center gap-2">
              <Info size={16} className="text-primary" />
              Guía de Uso Rápido
            </h2>
            
            <div className="space-y-8">
              {[
                { 
                  title: 'Identificación', 
                  desc: 'Muestra este código al llegar a cualquiera de nuestras sedes para registrar tu entrada.',
                  icon: Smartphone
                },
                { 
                  title: 'Acceso Técnico', 
                  desc: 'El staff escaneará tu código para ver tu historial médico y deportivo en tiempo real.',
                  icon: Zap
                },
                { 
                  title: 'Privacidad', 
                  desc: 'Tus datos están protegidos. Solo personal autorizado tiene acceso a tu expediente clínico.',
                  icon: ShieldCheck
                }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-science-50 text-primary flex items-center justify-center shrink-0 border border-science-100">
                    <step.icon size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-science-900 text-sm mb-1">{step.title}</h4>
                    <p className="text-sm text-science-500 leading-relaxed font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4">
             <div className="bg-white p-2 rounded-xl text-blue-500 shadow-sm border border-blue-100">
               <ShieldCheck size={20} />
             </div>
             <div>
               <p className="text-blue-800 font-black text-xs uppercase tracking-widest mb-1">Acceso Encriptado</p>
               <p className="text-blue-600/80 text-xs font-medium leading-relaxed">
                 Este código QR se regenera dinámicamente. No compartas capturas de pantalla estáticas por seguridad.
               </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function MiQrPage() {
  return (
    <PortalLayout>
      <MiQrContent />
    </PortalLayout>
  );
}
