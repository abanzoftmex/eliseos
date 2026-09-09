import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  CircleDollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown,
  History,
  Receipt,
  Camera,
  ShieldCheck,
  Search,
  Package,
  ShoppingBag,
  CalendarClock,
  CalendarX,
  Zap,
  CreditCard,
  Loader2,
  Sparkles,
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
}

function ItemIcon({ tipoItem, className }) {
  if (tipoItem === 'venta_pos') return <ShoppingBag size={24} className={className} />;
  if (tipoItem === 'plan') return <Package size={24} className={className} />;
  return <Receipt size={24} className={className} />;
}

function PlanCard({ plan }) {
  const isExpired = plan.statusVigencia === 'expirado';
  const isPorVencer = plan.statusVigencia === 'por_vencer';

  let bgClass = 'bg-emerald-50 border-emerald-200';
  let textClass = 'text-emerald-700';
  let labelText = `${plan.diasRestantes} días restantes`;
  let Icon = Zap;

  if (isExpired) {
    bgClass = 'bg-red-50 border-red-200';
    textClass = 'text-red-600';
    labelText = 'Expirado';
    Icon = CalendarX;
  } else if (isPorVencer) {
    bgClass = 'bg-amber-50 border-amber-200';
    textClass = 'text-amber-700';
    labelText = `${plan.diasRestantes} día${plan.diasRestantes !== 1 ? 's' : ''} restante${plan.diasRestantes !== 1 ? 's' : ''}`;
    Icon = CalendarClock;
  }

  const fechaExp = plan.fechaExpiracion
    ? new Date(plan.fechaExpiracion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:shadow-lg transition-all">
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${bgClass}`}>
          <Package size={24} className={textClass} />
        </div>
        <div>
          <h4 className="text-base font-black text-science-900 leading-tight">{plan.nombre}</h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${bgClass} ${textClass}`}>
              <Icon size={11} /> {labelText}
            </span>
            {fechaExp && (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Vence: {fechaExp}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        {plan.saldoPendiente > 0 && (
          <>
            <p className="text-xl font-black text-red-500 tracking-tighter">{formatMoney(plan.saldoPendiente)}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Saldo pendiente</p>
          </>
        )}
        {plan.saldoPendiente === 0 && (
          <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">{formatMoney(plan.precioFinal)} pagado</p>
        )}
      </div>
    </div>
  );
}

function AccountStatementContent() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('pendientes');
  const [paying, setPaying] = useState(null); // null | 'all' | itemId

  useEffect(() => {
    async function load() {
      try {
        // Red de seguridad sin webhook: aplica pagos de Stripe que hayan quedado
        // sin marcar (p. ej. si el cliente cerró la pestaña antes de volver).
        // No bloquea la vista si falla.
        try { await fetch('/api/stripe/reconcile', { method: 'POST' }); } catch { /* no-op */ }

        const res = await fetch('/api/portal-usuarios/estado-de-cuenta');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al cargar');
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleStripeCheckout(mode, item) {
    const key = mode === 'all' ? 'all' : item.id;
    setPaying(key);
    try {
      const body = mode === 'all'
        ? { mode: 'all' }
        : { mode: 'item', itemId: item.id, itemType: item.tipoItem };

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Error al iniciar el pago'); return; }
      window.location.href = json.url;
    } catch {
      alert('Error de conexión');
    } finally {
      setPaying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Calculando saldos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center bg-white rounded-[2rem] border border-red-100">
        <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
        <p className="text-slate-600 font-bold">{error}</p>
      </div>
    );
  }

  const planes = data?.planes || [];
  const planesActivos = planes.filter((p) => p.statusVigencia !== 'expirado');
  const planesExpirados = planes.filter((p) => p.statusVigencia === 'expirado');

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            <CircleDollarSign size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Estado de Cuenta</h1>
            <p className="text-science-500 font-medium mt-1">Gestión de pagos y servicios pendientes</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in [animation-delay:0.1s]">
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <TrendingDown size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total por Pagar</p>
            <h3 className="text-5xl font-black text-red-500 tracking-tighter">{formatMoney(data?.summary?.totalPendiente)}</h3>
            <p className="text-slate-500 text-xs mt-4 font-medium flex items-center gap-2">
              <AlertCircle size={14} /> {data?.summary?.countPending} cargo{data?.summary?.countPending !== 1 ? 's' : ''} sin reporte de pago
            </p>
            {data?.summary?.totalPendiente > 0 && (
              <button
                onClick={() => handleStripeCheckout('all')}
                disabled={paying !== null}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 bg-[#635BFF] hover:bg-[#4F46E5] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#635BFF]/30 disabled:opacity-60"
              >
                {paying === 'all'
                  ? <><Loader2 size={14} className="animate-spin" /> Redirigiendo…</>
                  : <><CreditCard size={14} /> Pagar todo con tarjeta</>}
              </button>
            )}
          </div>
        </div>

        <div className="bg-science-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05]">
            <History size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">En Validación</p>
            <h3 className="text-4xl font-black text-white">{data?.summary?.countValidation || 0}</h3>
            <p className="text-slate-400 text-xs mt-4 font-medium">Pagos reportados esperando aprobación</p>
          </div>
        </div>
      </div>

      {/* Planes Section */}
      {planes.length > 0 && (
        <div className="space-y-4 animate-fade-in [animation-delay:0.15s]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-science-900 uppercase tracking-[0.3em] flex items-center gap-2">
              <Package size={14} className="text-primary" /> Mis Planes
            </h2>
            {planesExpirados.length > 0 && (
              <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-widest">
                {planesExpirados.length} expirado{planesExpirados.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {planesActivos.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
          {planesExpirados.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-science-100 shadow-sm w-fit overflow-x-auto animate-fade-in [animation-delay:0.2s]">
        {[
          { id: 'pendientes', label: 'Por Pagar', count: data?.summary?.countPending, icon: CircleDollarSign },
          { id: 'validacion', label: 'En Validación', count: data?.summary?.countValidation, icon: Clock },
          { id: 'pagados', label: 'Historial', count: data?.summary?.countPaid, icon: CheckCircle2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap ${tab === t.id ? 'bg-science-900 text-white shadow-xl shadow-science-900/10' : 'text-science-400 hover:text-science-600'}`}
          >
            <t.icon size={14} className={tab === t.id ? 'text-primary' : ''} />
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-md text-[9px] ${tab === t.id ? 'bg-primary text-white' : 'bg-science-50 text-science-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="animate-fade-in [animation-delay:0.3s]">

        {/* VIEW: PENDIENTES */}
        {tab === 'pendientes' && (
          <div className="space-y-4">
            {data?.pendingPayments?.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 opacity-20" />
                <p className="text-slate-500 font-bold">No tienes pagos pendientes por reportar.</p>
              </div>
            ) : (
              data?.pendingPayments?.map((pay) => {
                const isPos = pay.tipoItem === 'venta_pos';
                const href = isPos
                  ? `/portal/estado-de-cuenta/${pay.id}/pagos?tipo=cargo`
                  : `/portal/estado-de-cuenta/${pay.id}/pagos`;
                return (
                  <div key={pay.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${isPos ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        <ItemIcon tipoItem={pay.tipoItem} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-science-900 leading-tight group-hover:text-primary transition-colors">{pay.nombre || pay.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                            <ShieldCheck size={12} className="text-primary" /> {pay.fecha || pay.date}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isPos ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                            {isPos ? 'Compra tienda' : 'Sesión / Clase'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <p className="text-2xl font-black text-science-950 tracking-tighter">{formatMoney(pay.price || pay.precio)}</p>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => handleStripeCheckout('item', pay)}
                          disabled={paying !== null}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#635BFF] hover:bg-[#4F46E5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-[#635BFF]/20 disabled:opacity-60"
                        >
                          {paying === pay.id
                            ? <><Loader2 size={12} className="animate-spin" /> Espera…</>
                            : <><CreditCard size={12} /> Pagar</>}
                        </button>
                        <Link
                          href={href}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all"
                        >
                          <Camera size={12} /> Evidencia
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW: EN VALIDACIÓN */}
        {tab === 'validacion' && (
          <div className="space-y-4">
            {data?.pendingValidation?.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                <Search size={48} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-500 font-bold">No hay pagos esperando validación.</p>
              </div>
            ) : (
              data?.pendingValidation?.map((pay) => (
                <div key={pay.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm opacity-80 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-science-900 leading-tight">{pay.nombre || pay.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-widest">En Validación</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pay.fecha || pay.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-science-950 tracking-tighter">{formatMoney(pay.montoReportado || pay.reportedAmount || pay.price)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Monto reportado</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW: HISTORIAL PAGADO */}
        {tab === 'pagados' && (
          <div className="space-y-4">
            {data?.paidHistory?.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                <History size={48} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-500 font-bold">No tienes actividades pagadas en tu historial.</p>
              </div>
            ) : (
              data?.paidHistory?.map((pay) => (
                <div key={pay.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 border border-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-science-900 leading-tight">{pay.nombre || pay.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">{pay.fecha || pay.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600 tracking-tighter">{formatMoney(pay.price || pay.precio)}</p>
                    <p className="text-[9px] font-black text-green-500/60 uppercase tracking-widest mt-1">Liquidado</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function AccountStatementPage() {
  return (
    <PortalLayout>
      <AccountStatementContent />
    </PortalLayout>
  );
}
