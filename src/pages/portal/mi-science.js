import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin, 
  Activity as ActivityIcon, 
  Dumbbell, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  X,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ArrowUpRight,
  History,
  CalendarCheck,
  ListFilter,
} from 'lucide-react';
import PortalLayout, { usePortal } from '@/components/portal/PortalLayout';
import usePortalViewStore from '@/store/portalViewStore';

// ─── DOMAIN / HELPERS ────────────────────────────────────────────────────────

const DAY_SHORT = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
};
const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const WEEKDAY_JS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const CAL_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toDateStr(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

/**
 * Encuentra la próxima ocurrencia de una clase (Dominio)
 */
function nextOccurrence(clase) {
  const now        = new Date();
  const todayStr   = toDateStr(now);
  const nt         = nowTime();

  if (clase.fechaEspecifica) {
    const fecha = clase.fechaEspecifica.slice(0, 10);
    const hora  = clase.horaEspecifica || '00:00';
    if (fecha < todayStr) return null;
    if (fecha === todayStr && hora < nt) return null;
    return new Date(`${fecha}T${hora}`);
  }

  if (clase.modoProgramacion === 'especifica') {
    const future = (clase.fechasEspecificas || [])
      .filter(f => {
        if (f.fecha < todayStr) return false;
        if (f.fecha === todayStr && f.hora && f.hora < nt) return false;
        return true;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || ''));
    if (!future.length) return null;
    const f = future[0];
    return new Date(`${f.fecha}T${f.hora || '00:00'}`);
  }

  if (!clase.diasSemana?.length) return null;
  const todayJsDay = now.getDay();
  let minDays = Infinity;

  for (const d of clase.diasSemana) {
    const target = WEEKDAY_JS[d];
    let diff = (target - todayJsDay + 7) % 7;
    if (diff === 0 && (clase.horaInicio || '00:00') <= nt) diff = 7;
    if (diff < minDays) minDays = diff;
  }

  if (minDays === Infinity) return null;
  const nextD = new Date(now);
  nextD.setDate(now.getDate() + minDays);
  nextD.setHours(0,0,0,0);
  return nextD;
}

function buildCalendarGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  return cells;
}

function clasesForDate(date, clases) {
  const ds = toDateStr(date);
  const dow = date.getDay();
  return clases.filter(c => {
    if (c.fechaEspecifica) {
       let fd = c.fechaEspecifica;
       if (fd.includes('T')) fd = fd.slice(0,10);
       return fd === ds;
    }
    if (c.modoProgramacion === 'especifica') {
      return c.fechasEspecificas?.some(f => f.fecha === ds);
    }
    return c.diasSemana?.some(d => WEEKDAY_JS[d] === dow);
  }).sort((a, b) => (a.horaInicio || a.horaEspecifica || '00:00').localeCompare(b.horaInicio || b.horaEspecifica || '00:00'));
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function MetaPill({ icon: Icon, children, color = '#64748b', bg = '#f8fafc', border = '#e2e8f0' }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all"
      style={{ background: bg, color, borderColor: border }}>
      <Icon size={12} />
      {children}
    </span>
  );
}

function formatNextDate(next, hora) {
  if (!next) return null;
  const dayName = next.toLocaleDateString('es-MX', { weekday: 'long' });
  const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dayNum   = next.getDate();
  let ampm = null;
  if (hora) {
    const [h] = hora.split(':').map(Number);
    ampm = h < 12 ? 'AM' : 'PM';
  }
  return { dayLabel, dayNum, ampm };
}

function ClaseCard({ clase, onClick }) {
  // Capacidad por sesión. NO usamos participantesActuales (es un contador global
  // acumulado entre todas las fechas y daría "Lleno" falso). El cupo real por fecha
  // se muestra en el panel de reserva al abrir el día.
  const capacity = clase.maxParticipantes != null && clase.maxParticipantes > 0 ? clase.maxParticipantes : null;
  const next   = nextOccurrence(clase);
  const hora   = clase.modoProgramacion === 'especifica'
    ? clase.fechasEspecificas?.find(f => next && f.fecha === toDateStr(next))?.hora
    : (clase.horaInicio || clase.horaEspecifica);
  const nextFmt = formatNextDate(next, hora);

  return (
    <button 
      onClick={() => next && onClick(next)}
      className="bg-white rounded-[1.5rem] border border-science-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 text-left w-full"
    >
      <div className="bg-science-900 p-5 flex items-center justify-between">
        {nextFmt ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white leading-none tracking-tighter">{nextFmt.dayNum}</span>
            <span className="text-[10px] font-black text-science-400 uppercase tracking-widest">{nextFmt.dayLabel}</span>
            {hora && <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">{hora}</span>}
          </div>
        ) : (
          <span className="text-[10px] font-black text-science-500 uppercase tracking-widest italic">Sin fechas próximas</span>
        )}
        <ArrowUpRight size={14} className="text-white/20 group-hover:text-primary transition-colors" />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-base font-black text-science-900 leading-tight mb-1 group-hover:text-primary transition-colors">{clase.nombre}</h3>
            {clase.instructor && (
              <p className="text-[10px] font-black text-science-400 flex items-center gap-1.5 uppercase tracking-widest">
                <ActivityIcon size={12} className="text-primary" />
                {clase.instructor}
              </p>
            )}
          </div>
        </div>

        {clase.descripcion && (
          <p className="text-xs text-science-500 leading-relaxed mb-6 line-clamp-2 font-medium">
            {clase.descripcion}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {clase.duracion > 0 && <MetaPill icon={Clock}>{clase.duracion} min</MetaPill>}
          {clase.ubicacion && <MetaPill icon={MapPin}>{clase.ubicacion}</MetaPill>}
          {capacity !== null && (
            <MetaPill icon={Users}>{capacity} {capacity === 1 ? 'lugar' : 'lugares'}</MetaPill>
          )}
        </div>
      </div>
    </button>
  );
}

function DayPanel({ date, clases, onClose, registeredSessions, onRegistered }) {
  const dayClases = clasesForDate(date, clases);
  const label = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const [visible, setVisible] = useState(false);
  const [registering, setRegistering] = useState(null);
  // Per-date enrollment counts fetched from server (accurate cupo per session)
  const [perDateCounts, setPerDateCounts] = useState(null);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // Fetch accurate per-date cupo when panel opens
  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const res = await fetch(`/api/portal-usuarios/cupo-por-fecha?fecha=${toDateStr(date)}`);
        const json = await res.json();
        if (!cancelled && json.ok) setPerDateCounts(json.counts || {});
      } catch { /* use global counts as fallback */ }
    }
    fetchCounts();
    return () => { cancelled = true; };
  }, [date]);

  function close() { setVisible(false); setTimeout(onClose, 220); }

  async function handleRegister(classId) {
    setRegistering(classId);
    try {
      const targetDate = toDateStr(date);
      const res = await fetch('/api/portal-usuarios/registrar-clase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, targetDate }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Error al registrarte'); return; }
      // Optimistically update per-date count so the panel reflects the new count
      setPerDateCounts(prev => prev ? { ...prev, [classId]: (prev[classId] || 0) + 1 } : { [classId]: 1 });
      if (onRegistered) onRegistered(classId, targetDate);
    } catch { alert('Error de conexión'); }
    finally { setRegistering(null); }
  }

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-science-950/40 backdrop-blur-sm" onClick={close} />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-300 transform ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-science-50 flex items-center justify-between bg-science-900 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Actividades Disponibles</p>
              <h3 className="text-xl font-black tracking-tight capitalize">{label}</h3>
            </div>
            <button onClick={close} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {dayClases.length === 0 ? (
              <div className="text-center py-20">
                <CalendarIcon size={48} className="mx-auto text-science-100 mb-4" />
                <p className="text-science-400 font-bold">No hay actividades para este día</p>
              </div>
            ) : (
              dayClases.map(c => {
                const dateKey = toDateStr(date);
                // Validamos si ya está registrado en esta sesión específica
                const isRegistered = registeredSessions.some(s => s.idClase === c.id && (s.fechaAsignacionString === dateKey || s.fechaEvaluacion === dateKey));
                // Use per-date count from server when available; fall back to global counter
                const enrolledForDate = perDateCounts !== null ? (perDateCounts[c.id] || 0) : (c.participantesActuales || 0);
                const isFull = c.maxParticipantes != null && c.maxParticipantes > 0 && enrolledForDate >= c.maxParticipantes;
                const hora = c.modoProgramacion === 'especifica' 
                  ? c.fechasEspecificas?.find(f => f.fecha === dateKey)?.hora 
                  : (c.horaInicio || c.horaEspecifica);
                
                return (
                  <div key={c.id} className="p-6 rounded-2xl border border-science-100 bg-science-50/30 hover:border-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-black text-science-900 leading-tight mb-1 group-hover:text-primary transition-colors">{c.nombre}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-science-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} className="text-primary" /> {hora || 'Horario por definir'}
                          </span>
                          <span className="text-[10px] font-black text-science-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={12} className="text-primary" /> {enrolledForDate} / {c.maxParticipantes || '∞'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isRegistered ? (
                      <div className="w-full py-3 bg-green-50 text-green-600 rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-green-100">
                        <CheckCircle2 size={14} /> Registrado para este día
                      </div>
                    ) : isFull ? (
                      <div className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100">
                        <AlertCircle size={14} /> Clase llena
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleRegister(c.id)}
                        disabled={registering === c.id}
                        className="w-full py-3 bg-science-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary shadow-lg shadow-science-900/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                      >
                        {registering === c.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reservar para este día'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RichCalendarView({ clases, registeredSessions, onRegistered }) {
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const currentYear  = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const monthName    = calendarDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();

  const activitiesByDay = useMemo(() => {
    const map = {};
    clases.forEach(c => {
      if (c.modoProgramacion === 'especifica') {
        c.fechasEspecificas?.forEach(f => map[f.fecha] = true);
      } else if (c.diasSemana) {
        for (let d=1; d<=daysInMonth; d++) {
          const date = new Date(currentYear, currentMonth, d);
          if (c.diasSemana.some(day => WEEKDAY_JS[day] === date.getDay())) {
            map[toDateStr(date)] = true;
          }
        }
      } else if (c.fechaEspecifica) {
        map[c.fechaEspecifica.slice(0,10)] = true;
      }
    });
    return map;
  }, [clases, currentYear, currentMonth, daysInMonth]);

  const mySessionsByDay = useMemo(() => {
    const map = {};
    registeredSessions.forEach(s => {
      const dateKey = s.fechaAsignacionString || s.fechaEvaluacion;
      if (dateKey) map[dateKey] = true;
    });
    return map;
  }, [registeredSessions]);

  const cells = buildCalendarGrid(currentYear, currentMonth);

  return (
    <div className="bg-white rounded-[2rem] border border-science-100 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-science-50 flex items-center justify-between bg-science-900 text-white">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-3">
             <div className="w-1.5 h-5 bg-primary rounded-full"></div>
             Agenda de Actividades
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          <button onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] min-w-[120px] text-center">{monthName}</span>
          <button onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {CAL_HEADERS.map(h => <span key={h} className="text-[9px] font-black text-science-300 uppercase tracking-[0.2em]">{h}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((date, i) => {
            if (!date) return <div key={`e-${i}`} className="h-14 opacity-0" />;
            const dateStr = toDateStr(date);
            const hasActivity = activitiesByDay[dateStr];
            const isRegistered = mySessionsByDay[dateStr];
            const isToday = dateStr === toDateStr(today);
            
            return (
              <button
                key={dateStr}
                onClick={() => setSelected(date)}
                className={`
                  h-14 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 group
                  ${isToday 
                    ? 'bg-science-900 text-white shadow-lg scale-105 z-10' 
                    : isRegistered
                      ? 'bg-green-50 border-2 border-green-500/30 text-green-700'
                      : hasActivity 
                        ? 'bg-white border-2 border-primary/20 text-science-900 hover:border-primary/50' 
                        : 'bg-white border border-science-50 text-science-300 hover:border-science-200'}
                `}
              >
                <span className="text-xs font-black">{date.getDate()}</span>
                <div className="flex gap-1 mt-0.5">
                  {hasActivity && !isToday && !isRegistered && (
                    <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)] group-hover:scale-150 transition-transform"></div>
                  )}
                  {isRegistered && !isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <DayPanel 
          date={selected} 
          clases={clases} 
          onClose={() => setSelected(null)} 
          registeredSessions={registeredSessions} 
          onRegistered={onRegistered} 
        />
      )}
    </div>
  );
}

function MiScienceContent() {
  const portalData = usePortal();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState('agenda'); // 'agenda' | 'mis-sesiones'
  const [error, setError]           = useState(null);
  const [registeredSessions, setRegisteredSessions] = useState([]);
  const [selectedDateFromCard, setSelectedDateFromCard] = useState(null);

  const view         = usePortalViewStore(s => s.miScienceView);
  const setView      = usePortalViewStore(s => s.setMiScienceView);
  const activeTab    = usePortalViewStore(s => s.miScienceActiveTab);
  const setActiveTab = usePortalViewStore(s => s.setMiScienceActiveTab);

  useEffect(() => {
    if (portalData?.activities) {
      setRegisteredSessions(portalData.activities.filter(a => a.estado === 'activa'));
    }
  }, [portalData]);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/portal-usuarios/mi-science');
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al cargar'); return; }
        setSucursales(json.sucursales || []);
      } catch { setError('Error de conexión'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleRegistered = (classId, dateKey) => {
    setRegisteredSessions(prev => [...prev, { idClase: classId, fechaAsignacionString: dateKey, estado: 'activa' }]);
    setSucursales(prev => prev.map(s => ({
      ...s,
      clases: s.clases.map(c => c.id === classId ? { ...c, participantesActuales: (c.participantesActuales || 0) + 1 } : c)
    })));
  };

  const safeTab = sucursales.length > 0 ? Math.min(activeTab, sucursales.length - 1) : 0;
  const currentSucursal = sucursales[safeTab] ?? null;
  const isGeneralTab = currentSucursal?.id === 'general';

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            <Dumbbell size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Mis Actividades</h1>
            <p className="text-science-500 font-medium mt-1">Gestión de actividades y entrenamientos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Section toggle */}
          <div className="flex bg-white p-1 rounded-2xl border border-science-100 shadow-sm h-fit">
            {[
              { id: 'agenda',       icon: CalendarIcon, label: 'Agenda' },
              { id: 'mis-sesiones', icon: CalendarCheck, label: 'Mis Actividades' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveSection(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${activeSection === t.id ? 'bg-science-900 text-white shadow-lg' : 'text-science-400 hover:text-science-600'}`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {activeSection === 'agenda' && !loading && !error && sucursales.length > 0 && !isGeneralTab && (
            <div className="flex bg-white p-1 rounded-2xl border border-science-100 shadow-sm h-fit">
              {[
                { id: 'calendar', icon: CalendarIcon, label: 'Calendario' },
                { id: 'cards',    icon: LayoutGrid,   label: 'Tarjetas'   },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${view === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-science-400 hover:text-science-600'}`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MIS SESIONES SECTION */}
      {activeSection === 'mis-sesiones' && (
        <MisSesionesSection activities={portalData?.activities || []} />
      )}

      {/* AGENDA SECTION */}
      {activeSection === 'agenda' && (
      <div className="animate-fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-science-100">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          </div>
        ) : error ? (
          <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex items-center gap-4 text-red-600">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Branch Tabs */}
            {sucursales.length > 1 && (
               <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
               {sucursales.map((s, i) => (
                 <button
                   key={s.id}
                   onClick={() => setActiveTab(i)}
                   className={`shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${safeTab === i ? 'bg-science-900 border-science-900 text-white shadow-xl' : 'bg-white border-science-100 text-science-400 hover:border-primary/30'}`}
                 >
                   <MapPin size={14} className={safeTab === i ? 'text-primary' : 'text-science-300'} />
                   {s.name}
                 </button>
               ))}
             </div>
            )}

            {currentSucursal && (
              <div className="space-y-6">
                {view === 'cards' || isGeneralTab ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentSucursal.clases
                      .map(c => ({ c, next: nextOccurrence(c) }))
                      .filter(({ next }) => next !== null)
                      .sort((a, b) => a.next - b.next)
                      .map(({ c, next }) => (
                        <ClaseCard key={c.id} clase={c} onClick={(d) => setSelectedDateFromCard(d)} />
                      ))}
                  </div>
                ) : (
                  <RichCalendarView 
                    clases={currentSucursal.clases} 
                    registeredSessions={registeredSessions} 
                    onRegistered={handleRegistered} 
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )} {/* end activeSection === 'agenda' */}

      {/* Global Day Panel for Card Clicks */}
      {selectedDateFromCard && (
        <DayPanel 
          date={selectedDateFromCard} 
          clases={currentSucursal?.clases || []} 
          onClose={() => setSelectedDateFromCard(null)} 
          registeredSessions={registeredSessions} 
          onRegistered={handleRegistered} 
        />
      )}
    </div>
  );
}

// ─── MIS SESIONES ─────────────────────────────────────────────────────────────

function getSessionTime(activity) {
  const fecha = activity.fechaAsignacionString || activity.fechaEvaluacion;
  const cd = activity.classData;
  if (!cd) return null;
  if (cd.modoProgramacion === 'especifica') {
    const f = cd.fechasEspecificas?.find(f => f.fecha === fecha);
    return f?.hora || cd.horaEspecifica || null;
  }
  return cd.horaInicio || null;
}

function isSessionPast(activity) {
  const fecha = activity.fechaAsignacionString || activity.fechaEvaluacion;
  if (!fecha) return false;
  const today = new Date();
  const todayStr = toDateStr(today);
  if (fecha < todayStr) return true;
  if (fecha > todayStr) return false;
  // Same day — check if class has already ended
  const hora = getSessionTime(activity) || '00:00';
  const duracion = activity.classData?.duracion || 60;
  const [h, m] = hora.split(':').map(Number);
  const endMin = h * 60 + m + duracion;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const endStr = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
  const nowStr = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`;
  return nowStr >= endStr;
}

function SessionRow({ activity, isPast }) {
  const cd = activity.classData;
  const fecha = activity.fechaAsignacionString || activity.fechaEvaluacion;
  const hora = getSessionTime(activity);
  const dateLabel = fecha
    ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Fecha no definida';

  return (
    <div className={`flex items-center gap-5 p-5 rounded-2xl border transition-all ${isPast ? 'bg-white border-science-100 opacity-70' : 'bg-white border-science-100 hover:border-primary/30'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isPast ? 'bg-science-50 text-science-300 border-science-100' : 'bg-primary/5 text-primary border-primary/20'}`}>
        {isPast ? <History size={20} /> : <CalendarCheck size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-science-900 truncate">{cd?.nombre || activity.nombre || 'Actividad'}</p>
        <p className="text-[10px] font-black text-science-400 uppercase tracking-widest mt-0.5">
          {dateLabel}{hora ? ` · ${hora}` : ''}{cd?.instructor ? ` · ${cd.instructor}` : ''}
        </p>
      </div>
      {isPast ? (
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-science-50 text-science-400 border border-science-100 shrink-0">
          Completada
        </span>
      ) : (
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border border-primary/20 shrink-0">
          Próxima
        </span>
      )}
    </div>
  );
}

function MisSesionesSection({ activities }) {
  const sessions = activities.filter(a => a.estado === 'activa' && (a.fechaAsignacionString || a.fechaEvaluacion));
  const recurring = activities.filter(a => a.estado === 'activa' && !a.fechaAsignacionString && !a.fechaEvaluacion);

  const upcoming = sessions.filter(a => !isSessionPast(a)).sort((a, b) => {
    const fa = a.fechaAsignacionString || a.fechaEvaluacion || '';
    const fb = b.fechaAsignacionString || b.fechaEvaluacion || '';
    return fa.localeCompare(fb);
  });
  const past = sessions.filter(a => isSessionPast(a)).sort((a, b) => {
    const fa = a.fechaAsignacionString || a.fechaEvaluacion || '';
    const fb = b.fechaAsignacionString || b.fechaEvaluacion || '';
    return fb.localeCompare(fa); // most recent first
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upcoming */}
      <div className="bg-white rounded-[2rem] border border-science-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-science-50 bg-science-900 text-white flex items-center gap-4">
          <CalendarCheck size={20} className="text-primary" />
          <h2 className="text-base font-black tracking-tight">Próximas Actividades</h2>
          {upcoming.length > 0 && (
            <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-black bg-primary text-white">{upcoming.length}</span>
          )}
        </div>
        <div className="p-6 space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon size={40} className="mx-auto text-science-100 mb-4" />
              <p className="text-science-400 font-bold text-sm">No tienes actividades próximas</p>
              <p className="text-science-300 text-xs mt-1 font-medium">Reserva una actividad desde la Agenda</p>
            </div>
          ) : (
            upcoming.map(a => <SessionRow key={a.id} activity={a} isPast={false} />)
          )}
        </div>
      </div>

      {/* Recurring assignments */}
      {recurring.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-science-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-science-50 flex items-center gap-4">
            <Dumbbell size={20} className="text-primary" />
            <h2 className="text-base font-black text-science-900 tracking-tight">Clases Activas</h2>
          </div>
          <div className="p-6 space-y-3">
            {recurring.map(a => {
              const cd = a.classData;
              return (
                <div key={a.id} className="flex items-center gap-5 p-5 rounded-2xl border border-science-100 bg-white hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Dumbbell size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-science-900 truncate">{cd?.nombre || a.nombre || 'Actividad'}</p>
                    {cd?.diasSemana?.length > 0 && (
                      <p className="text-[10px] font-black text-science-400 uppercase tracking-widest mt-0.5">
                        {cd.diasSemana.map(d => DAY_SHORT[d] || d).join(' · ')}{cd?.horaInicio ? ` · ${cd.horaInicio}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                    Activa
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-[2rem] border border-science-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-science-50 flex items-center gap-4">
          <History size={20} className="text-science-400" />
          <h2 className="text-base font-black text-science-900 tracking-tight">Historial</h2>
          {past.length > 0 && (
            <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-black bg-science-100 text-science-500">{past.length}</span>
          )}
        </div>
        <div className="p-6 space-y-3">
          {past.length === 0 ? (
            <div className="text-center py-12">
              <History size={40} className="mx-auto text-science-100 mb-4" />
              <p className="text-science-400 font-bold text-sm">Sin historial de actividades</p>
            </div>
          ) : (
            past.map(a => <SessionRow key={a.id} activity={a} isPast={true} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiSciencePage() {
  return (
    <PortalLayout>
      <MiScienceContent />
    </PortalLayout>
  );
}
