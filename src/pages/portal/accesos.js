import { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  History as HistoryIcon, 
  UserCircle as UserCircleIcon, 
  ShieldCheck, 
  MapPin, 
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

function formatDateTime(iso) {
  if (!iso) return { date: '—', time: '—' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

const ROLE_LABEL = {
  admin:     'Administrador',
  medico:    'Médico',
  asistente: 'Asistente',
  invitado:  'Invitado',
};

function AccesosContent() {
  const [accesos, setAccesos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/portal-usuarios/accesos');
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al cargar'); return; }
        setAccesos(json.accesos || []);
      } catch { setError('Error de conexión'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            <DoorOpen size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Mis Accesos</h1>
            <p className="text-science-500 font-medium mt-1">Historial de entradas a nuestras sedes</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-fade-in [animation-delay:0.1s]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-science-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-science-400 font-black text-[10px] uppercase tracking-[0.3em]">Consultando bitácora...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex items-center gap-4 text-red-600 shadow-sm">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        ) : accesos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border border-science-100 border-dashed">
            <div className="w-20 h-20 bg-science-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <DoorOpen size={40} className="text-science-100" />
            </div>
            <h3 className="text-xl font-black text-science-900 mb-2">Sin accesos registrados</h3>
            <p className="text-science-400 font-medium max-w-sm mx-auto">
              Tu historial de visitas aparecerá aquí una vez que registres tu entrada en recepción con tu QR.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Summary Stat Card */}
            <div className="bg-white px-6 py-4 rounded-2xl border border-science-100 shadow-sm w-fit flex items-center gap-4 animate-fade-in [animation-delay:0.2s]">
              <div className="w-10 h-10 rounded-xl bg-science-50 text-primary flex items-center justify-center border border-science-100">
                <HistoryIcon size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-science-900 leading-none">{accesos.length}</p>
                <p className="text-[10px] font-black text-science-400 uppercase tracking-widest mt-1">Registros Totales</p>
              </div>
            </div>

            {/* Timeline List */}
            <div className="bg-white rounded-[2.5rem] border border-science-100 shadow-sm overflow-hidden animate-fade-in [animation-delay:0.3s]">
               <div className="p-8 border-b border-science-50 bg-science-50/30">
                  <h2 className="text-[11px] font-black text-science-900 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Clock size={16} className="text-primary" />
                     Línea de Tiempo Reciente
                  </h2>
               </div>
               
               <div className="divide-y divide-science-50">
                  {accesos.map((acceso, idx) => {
                    const { date, time } = formatDateTime(acceso.timestamp);
                    const roleLabel = ROLE_LABEL[acceso.registradoPorRole] || acceso.registradoPorRole || 'Staff';
                    
                    return (
                      <div key={acceso.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-science-50/50 transition-colors group">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-science-100 flex items-center justify-center text-science-300 group-hover:text-primary group-hover:border-primary/20 group-hover:shadow-lg transition-all duration-500 shrink-0">
                            <DoorOpen size={24} />
                          </div>
                          <div>
                            <p className="text-base font-black text-science-900 tracking-tight capitalize group-hover:text-primary transition-colors">{date}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-science-400 uppercase tracking-widest bg-science-50 px-2 py-1 rounded-md">
                                <Clock size={12} className="text-primary" /> {time}
                              </span>
                              {acceso.sucursalNombre && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-science-400 uppercase tracking-widest bg-science-50 px-2 py-1 rounded-md">
                                  <MapPin size={12} className="text-primary" /> {acceso.sucursalNombre}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-science-100 shadow-sm group-hover:border-primary/20 transition-all">
                           <div className="w-10 h-10 rounded-xl bg-science-900 text-white flex items-center justify-center shrink-0">
                              <UserCircleIcon size={20} />
                           </div>
                           <div className="pr-4">
                              <p className="text-[10px] font-black text-science-300 uppercase tracking-widest mb-0.5">Registrado por</p>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm font-black text-science-900">{acceso.registradoPor}</span>
                                 <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">{roleLabel}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>

               {accesos.length > 0 && (
                 <div className="p-8 bg-science-50/30 text-center">
                    <p className="text-[10px] font-black text-science-300 uppercase tracking-widest flex items-center justify-center gap-2">
                       <ShieldCheck size={12} className="text-green-500" /> Historial verificado por el sistema de seguridad
                    </p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccesosPage() {
  return (
    <PortalLayout>
      <AccesosContent />
    </PortalLayout>
  );
}
