// src/pages/portal/pasaporte.js
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { 
  Award, 
  Trophy, 
  Flame, 
  HeartPulse, 
  CupSoda, 
  Share2, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ChevronRight, 
  Calendar, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Gift,
  Scale,
  Camera,
  Info,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import PortalLayout, { usePortal } from '@/components/portal/PortalLayout';
import {
  PASSPORT_MONTHS,
  PASSPORT_QUARTERS,
  CONSTANCY_STAMP_TYPES,
  EXPERIENCE_STAMP_TYPES,
  MAX_ANNUAL_STAMPS,
  BODY_COMPOSITION_FIELDS
} from '@/domain/passportConstants';

const ICON_MAP = {
  Flame,
  HeartPulse,
  CupSoda,
  Share2,
  Trophy,
  Users
};

function StampBadge({ stamp, tipoKey }) {
  const IconComp = ICON_MAP[stamp.icono] || Award;
  const isObtained = !!stamp.obtenido;

  return (
    <div 
      className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group
        ${isObtained 
          ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/40 shadow-lg shadow-amber-500/5' 
          : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 opacity-75 hover:opacity-100'}
      `}
    >
      {/* Sello de agua / Estampado visual cuando está obtenido */}
      {isObtained && (
        <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full border-2 border-dashed border-amber-500/20 flex items-center justify-center -rotate-12 pointer-events-none">
          <span className="text-[8px] font-black tracking-widest text-amber-500/30 uppercase">SIM STAMP</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div 
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm
              ${isObtained 
                ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-amber-500/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}
            `}
          >
            <IconComp size={20} strokeWidth={isObtained ? 2.5 : 2} />
          </div>

          {isObtained ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Check size={11} strokeWidth={3} /> Sello Obtenido
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Lock size={10} /> Pendiente
            </span>
          )}
        </div>

        <h4 className={`text-sm font-black mb-1 leading-tight ${isObtained ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
          {stamp.nombre}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {stamp.requisito}
        </p>
      </div>

      {isObtained && stamp.detalles?.fechaAsignacion && (
        <div className="mt-4 pt-3 border-t border-amber-400/20 flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 font-bold">
          <span>Validado en Sede</span>
          <span>{new Date(stamp.detalles.fechaAsignacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
        </div>
      )}
    </div>
  );
}

function RewardSelectorModal({ isOpen, onClose, title, options, currentSelection, onSelect, loading }) {
  const [selectedId, setSelectedId] = useState(currentSelection?.opcionElegida || options[0]?.id);

  useEffect(() => {
    if (currentSelection?.opcionElegida) {
      setSelectedId(currentSelection.opcionElegida);
    } else if (options[0]?.id) {
      setSelectedId(options[0].id);
    }
  }, [currentSelection, options]);

  if (!isOpen) return null;

  const isDelivered = currentSelection?.estado === 'entregada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Gift size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Recompensa Desbloqueada</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
          Has completado los requisitos de este periodo. Selecciona <strong>una</strong> de las siguientes opciones de recompensa:
        </p>

        <div className="space-y-3 mb-8">
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <label 
                key={opt.id}
                onClick={() => !isDelivered && setSelectedId(opt.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none
                  ${isSelected 
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'}
                  ${isDelivered ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors
                  ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-400'}
                `}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-0.5">{opt.titulo}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{opt.descripcion}</p>
                </div>
              </label>
            );
          })}
        </div>

        {isDelivered && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} /> Recompensa entregada en sede
          </div>
        )}

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
          {!isDelivered && (
            <button 
              type="button"
              disabled={loading}
              onClick={() => {
                const optObj = options.find(o => o.id === selectedId);
                onSelect(selectedId, optObj?.titulo || selectedId);
              }}
              className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (currentSelection ? 'Actualizar Elección' : 'Confirmar Elección')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PasaporteContent() {
  const portalData = usePortal();
  const user = portalData?.user;

  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeQuarterId, setActiveQuarterId] = useState('Q1');
  const [activeTab, setActiveTab] = useState('pasaporte'); // 'pasaporte' | 'composicion' | 'transformacion'
  
  const [modalState, setModalState] = useState({ isOpen: false, title: '', options: [], currentSelection: null, tipo: '', periodo: '' });
  const [savingReward, setSavingReward] = useState(false);

  async function loadPassport() {
    try {
      const res = await fetch('/api/portal-usuarios/pasaporte');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Error al cargar pasaporte');
        return;
      }
      setPassportData(json);
    } catch {
      setError('Error de conexión al cargar pasaporte');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPassport();
  }, []);

  // Auto-seleccionar trimestre según mes actual si no se ha elegido
  useEffect(() => {
    const currentMonthNum = new Date().getMonth() + 1;
    if (currentMonthNum <= 3) setActiveQuarterId('Q1');
    else if (currentMonthNum <= 6) setActiveQuarterId('Q2');
    else if (currentMonthNum <= 9) setActiveQuarterId('Q3');
    else setActiveQuarterId('Q4');
  }, []);

  const activeQuarter = useMemo(() => {
    if (!passportData?.trimestres) return null;
    return passportData.trimestres.find(q => q.id === activeQuarterId) || passportData.trimestres[0];
  }, [passportData, activeQuarterId]);

  const activeMonths = useMemo(() => {
    if (!passportData?.meses || !activeQuarter) return [];
    return passportData.meses.filter(m => activeQuarter.meses.includes(m.id));
  }, [passportData, activeQuarter]);

  async function handleConfirmReward(opcionId, opcionTitulo) {
    setSavingReward(true);
    try {
      const res = await fetch('/api/portal-usuarios/pasaporte/elegir-recompensa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: modalState.tipo,
          periodo: modalState.periodo,
          opcionId,
          opcionTitulo
        })
      });
      const json = await res.json();
      if (res.ok) {
        setModalState({ isOpen: false, title: '', options: [], currentSelection: null, tipo: '', periodo: '' });
        await loadPassport();
      } else {
        alert(json.error || 'Error al guardar recompensa');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSavingReward(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Cargando Pasaporte del Atleta...</p>
      </div>
    );
  }

  if (error || !passportData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-red-100 dark:border-red-900/30 text-center">
        <p className="text-red-500 font-bold mb-4">{error || 'No fue posible cargar tu pasaporte.'}</p>
        <button 
          onClick={loadPassport}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { passport } = passportData;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* ── COVER HERO SECTION ── */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white p-8 md:p-12 overflow-hidden shadow-2xl">
        {/* Decoración geométrica */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 pointer-events-none">
          <Trophy size={320} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.08),transparent_50%)]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Identidad del Pasaporte */}
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} /> Reto Anual 2026 · Elíseos Rewards
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white">
              Pasaporte del Atleta
            </h1>
            
            <p className="text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
              Un reto de constancia, disciplina y crecimiento personal. Cada sello ganado representa tu esfuerzo hacia la mejor versión de ti mismo.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                {user?.foto ? (
                  <img src={user.foto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-amber-400 text-lg">{user?.name?.charAt(0) || 'A'}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Atleta Perteneciente</p>
                <p className="text-base font-black text-white leading-tight">{user?.name}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Progreso & Sellos */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800/80 p-6 sm:p-8 shrink-0 min-w-[280px] lg:min-w-[340px] space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Progreso Anual</span>
              <span className="text-xs font-black text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {passport.porcentajeProgreso}%
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tight">{passport.totalSellos}</span>
              <span className="text-xl font-bold text-slate-500">/ {MAX_ANNUAL_STAMPS} sellos</span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
              <div 
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 h-full rounded-full transition-all duration-700 shadow-md shadow-amber-500/20"
                style={{ width: `${passport.porcentajeProgreso}%` }}
              />
            </div>

            {/* Desglose */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-bold">Constancia</span>
                <span className="font-black text-cyan-400 text-sm">{passport.sellosConstancia} / 48</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-bold">Experiencia</span>
                <span className="font-black text-pink-400 text-sm">{passport.sellosExperiencia} / 8</span>
              </div>
            </div>

            {/* Próxima Recompensa */}
            {passport.proximaRecompensa && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-center gap-3">
                <Gift size={20} className="text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Próxima Recompensa</p>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {passport.proximaRecompensa.nombre} ({passport.proximaRecompensa.sellosFaltantes} sellos restantes)
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── TABS NAVEGACIÓN ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        
        {/* Main Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
          {[
            { id: 'pasaporte', label: 'Mi Pasaporte & Sellos', icon: Award },
            { id: 'composicion', label: 'Composición Corporal', icon: Scale },
            { id: 'transformacion', label: 'Mi Transformación', icon: Camera }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                  ${isActive 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Trimestres (solo visible en tab pasaporte) */}
        {activeTab === 'pasaporte' && (
          <div className="flex items-center gap-2">
            {PASSPORT_QUARTERS.map(q => {
              const isActive = activeQuarterId === q.id;
              const qData = passportData.trimestres.find(item => item.id === q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuarterId(q.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border
                    ${isActive 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'}
                  `}
                >
                  <span>{q.id}</span>
                  {qData?.metaAlcanzada && <Check size={12} className="text-amber-400 dark:text-amber-600" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* ── TAB 1: PASAPORTE Y SELLOS ── */}
      {activeTab === 'pasaporte' && activeQuarter && (
        <div className="space-y-10 animate-fade-in">
          
          {/* Header del Trimestre */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">{activeQuarter.id} · {activeQuarter.nombre}</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeMonths.map(m => m.nombre).join(' · ')}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Award size={16} className="text-cyan-500" /> 12 Constancia
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy size={16} className="text-pink-500" /> 2 Experiencia
              </span>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full font-black">
                Meta: {activeQuarter.metaAcumulada} Sellos
              </span>
            </div>
          </div>

          {/* Meses del Trimestre */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {activeMonths.map(month => (
              <div 
                key={month.id}
                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div>
                  {/* Encabezado del mes */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{month.nombre}</h3>
                      <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">{month.tituloEditorial}</p>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {month.sellosObtenidosCount} / 4
                    </span>
                  </div>

                  {/* Frase editorial */}
                  <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                    <p className="text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      "{month.fraseEditorial}"
                    </p>
                  </div>

                  {/* 4 Sellos de Constancia */}
                  <div className="space-y-3">
                    {Object.keys(month.sellos).map(k => (
                      <StampBadge key={k} stamp={month.sellos[k]} tipoKey={k} />
                    ))}
                  </div>
                </div>

                {/* Recompensa Mensual */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {month.recompensaMensual.desbloqueada ? (
                    <button
                      onClick={() => setModalState({
                        isOpen: true,
                        title: `Recompensa Mensual: ${month.nombre}`,
                        options: month.recompensaMensual.opciones,
                        currentSelection: month.recompensaMensual.seleccionada,
                        tipo: 'mensual',
                        periodo: month.id
                      })}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
                    >
                      <Gift size={16} />
                      {month.recompensaMensual.seleccionada ? 'Ver / Cambiar Recompensa' : '¡Elegir Recompensa Mensual!'}
                    </button>
                  ) : (
                    <div className="py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                      <Lock size={14} /> Completa los 4 sellos para desbloquear
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* Sección de Sellos de Experiencia & Recompensa Trimestral */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2.5rem] p-8 md:p-10 border border-slate-800 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">Sellos por Experiencia</span>
                <h3 className="text-2xl font-black text-white">Retos Trimestrales {activeQuarter.id}</h3>
              </div>
              <p className="text-xs text-slate-400 max-w-md font-medium">
                Participa en retos deportivos externos e involucra a tu comunidad en Elíseos.
              </p>
            </div>

            {/* Grid 2 Sellos Experiencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(activeQuarter.sellosExperiencia).map(k => (
                <StampBadge key={k} stamp={activeQuarter.sellosExperiencia[k]} tipoKey={k} />
              ))}
            </div>

            {/* Tarjeta Recompensa Trimestral */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Recompensa Trimestral</span>
                <h4 className="text-lg font-black text-white">
                  Meta {activeQuarter.mesFinal.toUpperCase()}: {activeQuarter.metaAcumulada} Sellos Acumulados
                </h4>
                <p className="text-xs text-slate-400">
                  Progreso actual: <strong className="text-white">{passport.totalSellos}</strong> / {activeQuarter.metaAcumulada} sellos anuales
                </p>
              </div>

              {activeQuarter.recompensaTrimestral.desbloqueada ? (
                <button
                  onClick={() => setModalState({
                    isOpen: true,
                    title: `Recompensa Trimestral: ${activeQuarter.recompensaPeriodoLabel}`,
                    options: activeQuarter.recompensaTrimestral.opciones,
                    currentSelection: activeQuarter.recompensaTrimestral.seleccionada,
                    tipo: 'trimestral',
                    periodo: activeQuarter.id
                  })}
                  className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 transition-all"
                >
                  <Trophy size={16} />
                  {activeQuarter.recompensaTrimestral.seleccionada ? 'Ver / Modificar Recompensa' : '¡Reclamar Recompensa Trimestral!'}
                </button>
              ) : (
                <div className="py-3 px-5 rounded-2xl bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-2 shrink-0">
                  <Lock size={14} /> Faltan {activeQuarter.metaAcumulada - passport.totalSellos} sellos para desbloquear
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ── TAB 2: COMPOSICIÓN CORPORAL ── */}
      {activeTab === 'composicion' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="max-w-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Monitoreo InBody</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                Seguimiento de Composición Corporal
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                El pasaporte contempla 5 evaluaciones durante el año (Enero, Marzo, Junio, Septiembre y Diciembre). 
                Pídele a cualquiera de los coaches que registre tu medición en sede.
              </p>
            </div>
          </div>

          {/* Tabla Comparativa */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Métrica InBody</th>
                    {['enero', 'marzo', 'junio', 'septiembre', 'diciembre'].map(m => (
                      <th key={m} className="py-4 px-6 text-center capitalize">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {BODY_COMPOSITION_FIELDS.map(f => (
                    <tr key={f.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {f.label}
                        <span className="text-[10px] text-slate-400 font-normal">({f.unit})</span>
                      </td>
                      {['enero', 'marzo', 'junio', 'septiembre', 'diciembre'].map(m => {
                        const rec = passportData.composiciones[m];
                        const val = rec ? rec[f.key] : null;
                        return (
                          <td key={m} className="py-4 px-6 text-center font-bold text-slate-700 dark:text-slate-300">
                            {val !== null && val !== undefined ? `${val} ${f.unit}` : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: MI TRANSFORMACIÓN ── */}
      {activeTab === 'transformacion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          
          {/* Así empecé */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 block">Punto de Partida</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Así Empecé el Año</h3>
            
            <div className="w-full aspect-[4/5] max-w-xs mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
              {passport.fotoInicioUrl ? (
                <img src={passport.fotoInicioUrl} alt="Así Empecé" className="w-full h-full object-cover" />
              ) : (
                <div className="p-6 text-slate-400 space-y-2">
                  <Camera size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold">Foto Inicial</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Pídele al coach que tome tu foto al inicio del reto.</p>
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500">
              Iniciado el: <span className="text-slate-900 dark:text-white font-black">{passport.fechaInicio || 'Enero 2026'}</span>
            </div>
          </div>

          {/* Así terminé */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 block">Resultado Construido</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Así Terminé el Año</h3>
            
            <div className="w-full aspect-[4/5] max-w-xs mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
              {passport.fotoFinUrl ? (
                <img src={passport.fotoFinUrl} alt="Así Terminé" className="w-full h-full object-cover" />
              ) : (
                <div className="p-6 text-slate-400 space-y-2">
                  <Trophy size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-bold">Foto de Cierre</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Disponible al completar el ciclo anual en Diciembre.</p>
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500">
              Finalizado el: <span className="text-slate-900 dark:text-white font-black">{passport.fechaFin || 'Diciembre 2026'}</span>
            </div>
          </div>

        </div>
      )}

      {/* Modal de selección de recompensa */}
      <RewardSelectorModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        options={modalState.options}
        currentSelection={modalState.currentSelection}
        onSelect={handleConfirmReward}
        loading={savingReward}
      />

    </div>
  );
}

export default function PasaportePage() {
  return (
    <PortalLayout>
      <Head>
        <title>Mi Pasaporte del Miembro | Elíseos Box & Fitness</title>
      </Head>
      <PasaporteContent />
    </PortalLayout>
  );
}
