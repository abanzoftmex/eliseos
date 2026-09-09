import { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  History as HistoryIcon, 
  Activity as ActivityIcon, 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle,
  MapPin,
  Filter,
  ArrowDownWideNarrow
} from 'lucide-react';
import PortalLayout, { usePortal } from '@/components/portal/PortalLayout';

function formatDate(v) {
  if (!v) return 'Fecha no disponible';
  const d = new Date(v);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getSafeDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function HistorialContent() {
  const data = usePortal();
  const [filter, setFilter] = useState('todas'); // todas, completadas, canceladas
  
  const activities = data?.activities ?? [];

  const historyActivities = useMemo(() => {
    const now = new Date();
    // En el historial mostramos TODO, pero ordenado por lo más reciente primero
    let filtered = [...activities].sort((a, b) => {
      const dA = getSafeDate(a.fechaAsignacion)?.getTime() || 0;
      const dB = getSafeDate(b.fechaAsignacion)?.getTime() || 0;
      return dB - dA;
    });

    if (filter === 'completadas') {
      filtered = filtered.filter(a => a.estado === 'completada' || a.estado === 'asistida');
    } else if (filter === 'canceladas') {
      filtered = filtered.filter(a => a.estado === 'cancelada' || a.estado === 'no_asistio');
    }

    return filtered;
  }, [activities, filter]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <Link href="/portal/dashboard" className="w-10 h-10 rounded-xl bg-white border border-science-100 flex items-center justify-center text-science-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
             <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Historial</h1>
            <p className="text-science-500 font-medium mt-1 flex items-center gap-2">
               <HistoryIcon size={16} className="text-primary" />
               Registro completo de tus actividades
            </p>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-science-100 shadow-sm h-fit">
           {[
             { id: 'todas', label: 'Todas' },
             { id: 'completadas', label: 'Completadas' },
             { id: 'canceladas', label: 'Canceladas' }
           ].map(t => (
             <button
               key={t.id}
               onClick={() => setFilter(t.id)}
               className={`px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${filter === t.id ? 'bg-science-900 text-white shadow-lg' : 'text-science-400 hover:text-science-600'}`}
             >
               {t.label}
             </button>
           ))}
        </div>
      </div>

      {/* Main List */}
      <div className="animate-fade-in [animation-delay:0.1s]">
        {historyActivities.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-science-100 border-dashed">
            <ActivityIcon size={48} className="mx-auto text-science-100 mb-6" />
            <h3 className="text-xl font-black text-science-900 mb-2">Sin registros encontrados</h3>
            <p className="text-science-400 font-medium">No hay actividades que coincidan con tu filtro.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-science-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-science-50 bg-science-50/30 flex items-center justify-between">
                <span className="text-[10px] font-black text-science-400 uppercase tracking-[0.2em]">{historyActivities.length} Actividades registradas</span>
                <ArrowDownWideNarrow size={16} className="text-science-200" />
             </div>
             
             <div className="divide-y divide-science-50">
                {historyActivities.map((activity) => {
                  const date = getSafeDate(activity.fechaAsignacion);
                  const isFuture = date && date > new Date();
                  
                  return (
                    <div key={activity.id} className={`p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-science-50/50 transition-colors group ${isFuture ? 'opacity-60 bg-science-50/20' : ''}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${
                          activity.estado === 'completada' || activity.estado === 'asistida'
                            ? 'bg-green-50 border-green-100 text-green-500'
                            : activity.estado === 'cancelada' || activity.estado === 'no_asistio'
                              ? 'bg-red-50 border-red-100 text-red-500'
                              : 'bg-white border-science-100 text-science-300'
                        }`}>
                          <ActivityIcon size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <p className="text-base font-black text-science-900 tracking-tight capitalize group-hover:text-primary transition-colors">
                                {activity.classData?.nombre || 'Sesión técnica'}
                             </p>
                             {isFuture && <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">Programada</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-science-400 uppercase tracking-widest">
                              <CalendarIcon size={12} className="text-primary" /> {formatDate(activity.fechaAsignacion)}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-science-400 uppercase tracking-widest">
                              <Clock size={12} className="text-primary" /> {activity.classData?.horaInicio || '--:--'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-1">
                         <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                            activity.estado === 'completada' || activity.estado === 'asistida'
                              ? 'bg-green-50 border-green-100 text-green-600'
                              : activity.estado === 'cancelada' || activity.estado === 'no_asistio'
                                ? 'bg-red-50 border-red-100 text-red-600'
                                : 'bg-science-50 border-science-100 text-science-600'
                         }`}>
                            {activity.estado === 'completada' || activity.estado === 'asistida' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {activity.estado === 'completada' || activity.estado === 'asistida' ? 'Completada' : activity.estado === 'cancelada' || activity.estado === 'no_asistio' ? 'Cancelada' : 'No asistida'}
                         </div>
                         {activity.sucursalNombre && (
                           <span className="text-[9px] font-bold text-science-300 uppercase tracking-widest flex items-center gap-1 mt-1">
                              <MapPin size={10} /> {activity.sucursalNombre}
                           </span>
                         )}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function HistorialPage() {
  return (
    <PortalLayout>
      <HistorialContent />
    </PortalLayout>
  );
}
