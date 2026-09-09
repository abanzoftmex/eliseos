import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  ShieldAlert, 
  Cake, 
  Users, 
  Briefcase, 
  MapPin, 
  Pencil, 
  Check, 
  X, 
  Package as PackageIcon, 
  Clock,
  User as UserIcon,
  ShieldCheck,
  Zap,
  Fingerprint,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import PortalLayout, { usePortal } from '@/components/portal/PortalLayout';

function formatDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function EditableField({ icon: Icon, label, value, fieldKey, onSave, accent = '#0ea5e9', type = 'text', options }) {
  const [editing, setEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (currentValue === value) {
      setEditing(false);
      return;
    }
    setLoading(true);
    const success = await onSave(fieldKey, currentValue);
    if (success) {
      setEditing(false);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setCurrentValue(value || '');
    setEditing(false);
  };

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl transition-all group ${editing ? 'bg-white border border-primary/30 shadow-lg' : 'bg-white border border-science-50 hover:border-primary/20'}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-science-50 transition-transform group-hover:scale-110" style={{ backgroundColor: editing ? `${accent}20` : `${accent}10`, color: accent }}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-science-300 uppercase tracking-widest mb-1">{label}</p>
        
        {editing ? (
          <div className="space-y-3 animate-fade-in">
            {options ? (
              <select
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
                className="w-full bg-science-50 border border-science-100 rounded-xl px-3 py-2 text-sm font-bold text-science-900 focus:ring-2 focus:ring-primary/20 outline-none"
                autoFocus
              >
                <option value="">— Seleccionar —</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={type}
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
                className="w-full bg-science-50 border border-science-100 rounded-xl px-3 py-2 text-sm font-bold text-science-900 focus:ring-2 focus:ring-primary/20 outline-none"
                autoFocus
              />
            )}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={12} /> Guardar</>}
              </button>
              <button onClick={handleCancel} disabled={loading} className="flex-1 py-2 bg-science-100 text-science-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-science-200 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-science-900 leading-tight break-words">{value || <span className="text-science-200 italic font-medium">No definido</span>}</p>
            <button 
              onClick={() => setEditing(true)} 
              className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-science-50 text-science-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center shrink-0"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-science-50">
      {Icon && <Icon size={16} className="text-primary" />}
      <h2 className="text-[11px] font-black text-science-900 uppercase tracking-[0.2em]">
        {children}
      </h2>
    </div>
  );
}

function calcDiasRestantes(fechaAsignacion) {
  if (!fechaAsignacion) return 0;
  const fecha = new Date(fechaAsignacion);
  if (isNaN(fecha.getTime())) return 0;
  const diffTime = new Date() - fecha;
  return 30 - Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function calcFechaExpiracion(fechaAsignacion) {
  if (!fechaAsignacion) return null;
  const fecha = new Date(fechaAsignacion);
  if (isNaN(fecha.getTime())) return null;
  const exp = new Date(fecha);
  exp.setDate(exp.getDate() + 30);
  return exp;
}

function PerfilContent() {
  const portalData = usePortal();
  const user       = portalData?.user;
  const packages   = portalData?.packages || [];
  const initial    = user?.name?.charAt(0).toUpperCase() || 'U';
  const age        = calculateAge(user?.fechaNacimiento);
  const birth      = formatDate(user?.fechaNacimiento);

  const activePackages = packages.filter(p => p.activo && calcDiasRestantes(p.fechaAsignacion) > 0);

  const [feedback, setFeedback] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(user?.name || '');
  const [finanzas, setFinanzas] = useState(null);

  useEffect(() => {
    fetch('/api/portal-usuarios/estado-de-cuenta')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setFinanzas(d); })
      .catch(() => {});
  }, []);

  const updateField = async (key, val) => {
    try {
      const res = await fetch('/api/portal-usuarios/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: val }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', msg: json.error || 'Error al guardar' });
        return false;
      } else {
        if (portalData?.user) portalData.user[key] = val;
        setFeedback({ type: 'ok', msg: 'Cambio guardado exitosamente' });
        setTimeout(() => setFeedback(null), 3000);
        return true;
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Error de conexión' });
      return false;
    }
  };

  const handleSaveName = async () => {
    if (currentName === user?.name) {
      setEditingName(false);
      return;
    }
    const success = await updateField('name', currentName);
    if (success) setEditingName(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">

      {/* Hero Header Section */}
      <div className="relative rounded-[2.5rem] bg-science-900 overflow-hidden shadow-2xl animate-fade-in">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-[80px]" />
        
        <div className="relative p-10 lg:p-14 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-primary/50">
              {user?.foto ? (
                <img src={user.foto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-5xl font-black">{initial}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white border-4 border-science-900 shadow-lg">
              <Zap size={18} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="space-y-2">
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.4em]">Pasaporte Digital</p>
              
              {editingName ? (
                <div className="flex flex-col md:flex-row items-center gap-3 animate-fade-in">
                   <input 
                    value={currentName} 
                    onChange={e => setCurrentName(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-white text-3xl font-black focus:ring-2 focus:ring-primary outline-none min-w-[300px]"
                    autoFocus
                   />
                   <div className="flex gap-2">
                      <button onClick={handleSaveName} className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all shadow-lg"><Check size={20} /></button>
                      <button onClick={() => { setCurrentName(user?.name || ''); setEditingName(false); }} className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/10"><X size={20} /></button>
                   </div>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-4 group">
                  <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">{user?.name || 'Usuario'}</h1>
                  <button 
                    onClick={() => setEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-white/10 text-white rounded-xl hover:bg-primary transition-all border border-white/10"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                {user?.type || 'Miembro'}
              </span>
              <span className={`px-4 py-1.5 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border ${user?.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
                {user?.status === 'active' ? 'Estado: Activo' : 'Estado: Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-6 rounded-[1.5rem] border animate-fade-in flex items-center gap-4 fixed top-24 right-10 z-[100] shadow-2xl max-w-sm ${feedback.type === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {feedback.type === 'ok' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="font-bold text-sm">{feedback.msg}</p>
        </div>
      )}

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in [animation-delay:0.1s]">
        
        {/* Contact Module */}
        <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm">
          <SectionTitle icon={Phone}>Datos de Contacto</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4 p-4 bg-science-50/30 border border-science-50 rounded-2xl opacity-60">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-science-300 border border-science-100">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-science-300 uppercase tracking-widest mb-0.5">Correo Electrónico</p>
                <p className="text-sm font-bold text-science-900">{user?.email}</p>
              </div>
            </div>
            
            <EditableField 
              icon={Phone} label="Teléfono Personal" value={user?.telefonoContacto} 
              fieldKey="telefonoContacto" onSave={updateField} type="tel" 
            />
            <EditableField 
              icon={ShieldAlert} label="Tel. Emergencia" value={user?.telefonoEmergencia} 
              fieldKey="telefonoEmergencia" onSave={updateField} accent="#ef4444" type="tel" 
            />
            <EditableField 
              icon={Users} label="Contacto Emergencia" value={user?.nombreContactoEmergencia} 
              fieldKey="nombreContactoEmergencia" onSave={updateField} accent="#ef4444" 
            />
          </div>
        </div>

        {/* Identity Module */}
        <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm">
          <SectionTitle icon={Fingerprint}>Identidad y Perfil</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4 p-4 bg-science-50/30 border border-science-50 rounded-2xl opacity-60">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-science-300 border border-science-100">
                <Cake size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-science-300 uppercase tracking-widest mb-0.5">Fecha de Nacimiento</p>
                <p className="text-sm font-bold text-science-900">{birth ? `${birth} · ${age} años` : 'No definida'}</p>
              </div>
            </div>

            <EditableField 
              icon={Users} label="Género" value={user?.genero} 
              fieldKey="genero" onSave={updateField} 
              options={['Masculino', 'Femenino', 'No binario', 'Prefiero no decir']} 
            />
            <EditableField 
              icon={Zap} label="Lado Dominante" value={user?.ladoDominante} 
              fieldKey="ladoDominante" onSave={updateField} accent="#f59e0b" 
              options={['Derecho', 'Izquierdo', 'Ambidiestro']} 
            />
            <EditableField 
              icon={Briefcase} label="Ocupación" value={user?.ocupacion} 
              fieldKey="ocupacion" onSave={updateField} accent="#64748b" 
            />
          </div>
        </div>
      </div>

      {/* ── ACCESOS DIRECTOS: HISTORIA CLÍNICA & ESTADO DE CUENTA ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in [animation-delay:0.15s]">
        {/* Tarjeta Historia Clínica (Punto 3) */}
        <div className="bg-gradient-to-br from-science-900 to-science-950 text-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-science-800 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <ClipboardList size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Expediente
              </span>
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Mi Historia Clínica</h3>
              <p className="text-xs text-science-300 font-medium mt-1 leading-relaxed">
                Revisa tus valoraciones médicas, fichas deportivas, objetivos físicos y consultas de seguimiento.
              </p>
            </div>
          </div>
          <Link
            href="/portal/clinica"
            className="w-full py-3 px-5 bg-primary hover:bg-science-400 text-science-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            <span>Ver Expediente Clínico</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Tarjeta Estado de Cuenta & Pagos (Punto 4) */}
        <div className="bg-white rounded-[2rem] border border-science-100 p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CreditCard size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${(finanzas?.totalPendiente || 0) > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                {(finanzas?.totalPendiente || 0) > 0 ? `$${finanzas.totalPendiente.toFixed(2)} por liquidar` : 'Al corriente'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-black text-science-900 tracking-tight">Mis Pagos y Comprobantes</h3>
              <p className="text-xs text-science-500 font-medium mt-1 leading-relaxed">
                Historial de compras en sucursal, pagos de clases, mensualidades y comprobantes validados.
              </p>
            </div>
          </div>
          <Link
            href="/portal/estado-de-cuenta"
            className="w-full py-3 px-5 bg-science-900 hover:bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <span>Consultar Estado de Cuenta</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Access and Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in [animation-delay:0.2s]">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm h-full">
            <SectionTitle icon={MapPin}>Sedes con Acceso</SectionTitle>
            <div className="flex flex-col gap-3">
              {user?.sucursales?.length > 0 ? (
                user.sucursales.map(s => (
                  <div key={s} className="flex items-center gap-3 p-3 bg-science-50/50 rounded-2xl border border-science-100/50">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                      <MapPin size={14} />
                    </div>
                    <span className="text-xs font-black text-science-900 uppercase tracking-widest">{s}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-science-400 font-bold italic">No hay sedes asignadas</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] border border-science-100 p-8 shadow-sm h-full">
            <SectionTitle icon={PackageIcon}>Mi Suscripción</SectionTitle>
            {activePackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-science-50 flex items-center justify-center text-science-200">
                  <PackageIcon size={32} />
                </div>
                <p className="text-sm text-science-500 font-bold">Sin paquetes activos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePackages.map(pkg => {
                  const dias = calcDiasRestantes(pkg.fechaAsignacion);
                  const expDate = calcFechaExpiracion(pkg.fechaAsignacion);
                  const sesUsadas = pkg.sessionsTaken || 0;
                  const sesTotal = pkg.numeroServicios || 0;

                  return (
                    <div key={pkg.id} className="p-6 bg-science-50/30 border border-science-100 rounded-3xl hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
                            <PackageIcon size={28} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-science-900 leading-tight">{pkg.nombre}</h4>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-[10px] font-black text-science-400 uppercase tracking-widest">{pkg.tipo || 'Plan Science'}</span>
                               <span className={`text-[10px] font-black uppercase tracking-widest ${dias <= 3 ? 'text-red-500' : 'text-primary'}`}>{dias} días vigentes</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="bg-white px-4 py-3 rounded-2xl text-center min-w-[100px] border border-science-100 shadow-sm">
                            <p className="text-[9px] font-black text-science-300 uppercase tracking-widest mb-1">Sesiones</p>
                            <p className="text-sm font-black text-science-900">{Math.max(0, sesTotal - sesUsadas)} / {sesTotal}</p>
                          </div>
                          <div className="bg-white px-4 py-3 rounded-2xl text-center min-w-[120px] border border-science-100 shadow-sm">
                            <p className="text-[9px] font-black text-science-300 uppercase tracking-widest mb-1">Vence</p>
                            <p className="text-sm font-black text-science-900">{expDate ? formatDate(expDate.toISOString()) : '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <PortalLayout>
      <PerfilContent />
    </PortalLayout>
  );
}
