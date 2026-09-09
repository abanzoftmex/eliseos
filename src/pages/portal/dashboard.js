import { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User as UserIcon, 
  Zap, 
  Layers, 
  ArrowUpRight,
  Activity as ActivityIcon,
  Package as PackageIcon,
  CheckCircle2,
  AlertCircle,
  History as HistoryIcon
} from 'lucide-react';
import PortalLayout, { usePortal } from '@/components/portal/PortalLayout';

const EMPTY_ARRAY = [];

function formatDate(v) {
  if (!v) return 'Fecha no disponible';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Fecha no disponible';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatMoney(value) {
  const raw = value ?? 0;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''));
  const num = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function getSafeDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateKey(d) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getDaysLabel(fechaAsignacion) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = getSafeDate(fechaAsignacion);
  if (!d) return null;
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `En ${diff} días`;
}

function DashboardContent() {
  const data = usePortal();
  const [calendarDate, setCalendarDate] = useState(new Date());

  const user           = data?.user;
  const userPackages   = data?.packages   ?? EMPTY_ARRAY;
  const userActivities = data?.activities ?? EMPTY_ARRAY;

  const activitiesSortedByDate = useMemo(() => (
    [...userActivities].sort((a, b) => {
      const dA = getSafeDate(a.fechaAsignacion)?.getTime() || 0;
      const dB = getSafeDate(b.fechaAsignacion)?.getTime() || 0;
      return dB - dA;
    })
  ), [userActivities]);

  const upcomingActivity = useMemo(() => {
    const now = new Date();
    return activitiesSortedByDate.find(a => {
      const d = getSafeDate(a.fechaAsignacion);
      if (!d) return false;
      return d >= new Date(now.setHours(0,0,0,0));
    }) || null;
  }, [activitiesSortedByDate]);

  const recentActivities = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    return activitiesSortedByDate
      .filter(a => getSafeDate(a.fechaAsignacion) >= now)
      .reverse() 
      .slice(0, 5);
  }, [activitiesSortedByDate]);

  const activeActivitiesCount = useMemo(() => {
    const todayStr = toDateKey(new Date());
    return userActivities.filter(a => toDateKey(getSafeDate(a.fechaAsignacion)) === todayStr).length;
  }, [userActivities]);

  const activitiesByDay = useMemo(() => userActivities.reduce((acc, a) => {
    const key = toDateKey(getSafeDate(a.fechaAsignacion));
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}), [userActivities]);

  const currentYear     = calendarDate.getFullYear();
  const currentMonth    = calendarDate.getMonth();
  const monthName       = calendarDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells   = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDayOfMonth + 1;
    if (d < 1 || d > daysInMonth) return null;
    const date = new Date(currentYear, currentMonth, d);
    const key  = toDateKey(date);
    return { dayNumber: d, key, activityCount: activitiesByDay[key] || 0, isToday: key === toDateKey(new Date()) };
  });
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
        <div>
          <p className="text-[#0ea5e9] font-black text-[10px] uppercase tracking-[0.3em] mb-1">{getGreeting()}</p>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">
            {user?.name?.split(' ')[0] || 'Usuario'}
          </h1>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
          <CalendarIcon size={16} className="text-[#0ea5e9]" />
          <span className="text-xs font-bold text-slate-700">Hoy es {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in [animation-delay:0.1s]">
        
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <PackageIcon size={160} />
          </div>
          <div className="relative z-10">
            <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <PackageIcon size={24} />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Planes Contratados</p>
            <h3 className="text-4xl font-black text-[#0f172a]">{userPackages.length}</h3>
            <p className="text-slate-500 text-xs mt-2 font-medium">Planes activos en tu cuenta</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 text-[#0ea5e9]">
            <Zap size={160} />
          </div>
          <div className="relative z-10">
            <div className="bg-sky-50 text-[#0ea5e9] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Actividades de hoy</p>
            <h3 className="text-4xl font-black text-[#0f172a]">{activeActivitiesCount}</h3>
            <p className="text-slate-500 text-xs mt-2 font-medium">Sesiones programadas</p>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group hover:shadow-[#0ea5e9]/20 transition-all duration-500">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
            <CalendarIcon size={160} />
          </div>
          <div className="relative z-10">
            <div className="bg-white/10 text-[#0ea5e9] p-3 rounded-xl backdrop-blur-md w-fit mb-6 border border-white/10">
              <CalendarIcon size={20} />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Próxima sesión</p>
            <h3 className="text-lg font-black text-white leading-tight mb-2 line-clamp-1">
              {upcomingActivity?.classData?.nombre || 'Sin sesiones'}
            </h3>
            {upcomingActivity && (
              <div className="flex items-center gap-2 mt-4">
                <span className="bg-[#0ea5e9] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg shadow-[#0ea5e9]/20">
                  {getDaysLabel(upcomingActivity.fechaAsignacion) || 'Ahora'}
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  {formatDate(upcomingActivity.fechaAsignacion)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8 animate-fade-in [animation-delay:0.2s]">
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#0ea5e9] rounded-full"></div>
                  Mi Agenda
                </h2>
                <p className="text-slate-400 text-xs font-medium mt-0.5 uppercase tracking-wide">Tus clases y sesiones por mes</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
                  className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-black text-slate-800 uppercase tracking-widest min-w-[120px] text-center">{monthName}</span>
                <button 
                  onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
                  className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50/30">
              <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                {weekDays.map(d => (
                  <span key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-4">
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={`e-${i}`} className="aspect-square" />;
                  const hasActivity = cell.activityCount > 0;
                  return (
                    <div 
                      key={cell.key} 
                      className={`
                        aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                        ${cell.isToday 
                          ? 'bg-[#0f172a] text-white shadow-xl scale-110 z-10' 
                          : hasActivity 
                            ? 'bg-white border-2 border-[#0ea5e9]/20 text-[#0f172a]' 
                            : 'bg-white border border-slate-50 text-slate-300'}
                      `}
                    >
                      <span className="text-sm font-black">{cell.dayNumber}</span>
                      {hasActivity && !cell.isToday && (
                        <div className="w-1 h-1 rounded-full bg-[#0ea5e9] mt-1 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                Planes Activos
              </h2>
            </div>
            <div className="p-8 space-y-4">
              {userPackages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <PackageIcon size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">No hay paquetes activos</p>
                </div>
              ) : (
                userPackages.map(pkg => (
                  <div key={pkg.id} className="group p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#0ea5e9]/30 transition-all flex items-center justify-between shadow-sm hover:shadow-lg">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <PackageIcon size={20} />
                      </div>
                      <div>
                        <p className="font-black text-[#0f172a] leading-tight mb-0.5 group-hover:text-[#0ea5e9] transition-colors">{pkg.nombre}</p>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                          Asignado: {formatDate(pkg.fechaAsignacion)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {pkg.descuento && (
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-md">
                          -{(() => {
                            const pct = pkg.descuentoPorcentaje ?? (
                              pkg.precioOriginal && pkg.precioFinal && pkg.precioOriginal > pkg.precioFinal
                                ? Math.round((1 - pkg.precioFinal / pkg.precioOriginal) * 10000) / 100
                                : null
                            );
                            if (pct !== null) return `${pct}%`;
                            return pkg.descuento;
                          })()} dto.
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 animate-fade-in [animation-delay:0.3s]">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-fit sticky top-[100px]">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                Próximas Sesiones
              </h2>
            </div>
            <div className="p-6 divide-y divide-slate-50">
              {recentActivities.length === 0 ? (
                <div className="text-center py-10">
                  <ActivityIcon size={24} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm">Sin sesiones próximas</p>
                </div>
              ) : (
                recentActivities.map(activity => {
                  const cd = activity.classData;
                  const sessionDateStr = activity.fechaAsignacionString || activity.fechaEvaluacion || cd?.fechaEspecifica || (cd?.fechasEspecificas?.[0]?.fecha);
                  const hora = cd?.horaInicio || cd?.horaEspecifica || (cd?.fechasEspecificas?.[0]?.hora) || '--:--';
                  
                  // Formatear fecha para el label si no es hoy
                  const sessionDate = sessionDateStr ? new Date(sessionDateStr.split('-')[0], sessionDateStr.split('-')[1] - 1, sessionDateStr.split('-')[2]) : null;
                  const dateLabel = sessionDate ? sessionDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '';
                  
                  const daysLabel = getDaysLabel(activity.fechaAsignacion);

                  return (
                    <div key={activity.id} className="py-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-[#0ea5e9]">
                            <ActivityIcon size={18} />
                          </div>
                          <div>
                            <h4 className="font-black text-[#0f172a] text-sm leading-tight line-clamp-1">{cd?.nombre || 'Sesión'}</h4>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cd?.tipo || 'Individual'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {daysLabel && (
                            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${daysLabel === 'Hoy' ? 'bg-[#0ea5e9] text-white' : 'bg-[#0f172a] text-white'}`}>
                              {daysLabel}
                            </span>
                          )}
                          {dateLabel && daysLabel !== 'Hoy' && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dateLabel}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="bg-slate-50/50 p-2 rounded-xl flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-600 tracking-tight uppercase">{hora} hrs</span>
                        </div>
                        <div className="bg-slate-50/50 p-2 rounded-xl flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-[#0ea5e9]" />
                          <span className="text-[10px] font-bold text-slate-600 tracking-tight uppercase truncate">Confirmada</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-6 pt-0 space-y-3">
               <Link href="/portal/mi-science" className="w-full flex items-center justify-center gap-2 py-4 bg-[#0f172a] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#0ea5e9] transition-all shadow-lg shadow-slate-900/10 hover:shadow-[#0ea5e9]/30">
                  Agendar Nueva Sesión <ArrowUpRight size={16} />
               </Link>
               <Link href="/portal/historial" className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
                  Ver Historial Completo <HistoryIcon size={16} />
               </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PortalLayout>
      <DashboardContent />
    </PortalLayout>
  );
}
