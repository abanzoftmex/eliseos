import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Clock, 
  Search, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  History as HistoryIcon,
  Receipt,
  CreditCard,
  CircleDollarSign,
  Zap,
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';

function formatPrice(price) {
  if (price == null) return '$0.00';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(price));
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function calcDiasRestantes(fechaAsignacion) {
  if (!fechaAsignacion) return 0;
  const fecha = new Date(fechaAsignacion);
  if (isNaN(fecha.getTime())) return 0;
  const diffTime = new Date() - fecha;
  const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return 30 - diasTranscurridos;
}

function calcFechaExpiracion(fechaAsignacion) {
  if (!fechaAsignacion) return null;
  const fecha = new Date(fechaAsignacion);
  if (isNaN(fecha.getTime())) return null;
  const exp = new Date(fecha);
  exp.setDate(exp.getDate() + 30);
  return exp;
}

function PaymentBadge({ compra }) {
  if (compra.isPaid) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
        <CheckCircle2 size={11} /> Pagado
      </span>
    );
  }
  if (compra.paymentPendingValidation) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
        <Clock size={11} /> En validación
      </span>
    );
  }
  const saldo = compra.monto - compra.montoPagado;
  if (saldo > 0) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
        <CircleDollarSign size={11} /> Debes {formatPrice(saldo)}
      </span>
    );
  }
  return null;
}

function ProductosContent() {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [misProductos, setMisProductos] = useState([]);
  const [misCompras, setMisCompras]     = useState([]);
  const [misPaquetes, setMisPaquetes]   = useState([]);
  const [tab, setTab]                   = useState('paquetes');
  const [search, setSearch]             = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portal-usuarios/productos');
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al cargar'); return; }
        setMisProductos(json.misProductos || []);
        setMisCompras(json.misCompras || []);
        setMisPaquetes(json.misPaquetes || []);
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activePaquetes  = misPaquetes.filter(p => p.activo && calcDiasRestantes(p.fechaAsignacion) > 0);
  const historyPaquetes = misPaquetes.filter(p => !p.activo || calcDiasRestantes(p.fechaAsignacion) <= 0);

  const filteredProductos = misProductos.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.nombre?.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q);
  });

  const filteredCompras = misCompras.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.descripcion?.toLowerCase().includes(q) ||
      p.items?.some(i => i.nombre?.toLowerCase().includes(q) || i.name?.toLowerCase().includes(q));
  });

  const totalProductosItems = filteredProductos.length + filteredCompras.length;
  const totalDeuda = misCompras.reduce((sum, c) => {
    if (c.isPaid || c.paymentPendingValidation) return sum;
    return sum + Math.max(0, c.monto - c.montoPagado);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-xl border border-science-800">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-science-900 tracking-tight">Mis Compras</h1>
            <p className="text-science-500 font-medium mt-1">Paquetes, productos y compras anteriores</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-science-100 animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-science-400 font-black text-[10px] uppercase tracking-[0.3em]">Cargando...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 flex items-center gap-4 text-red-600 animate-fade-in">
          <AlertCircle size={24} />
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Summary chips */}
          <div className="flex flex-wrap gap-4 animate-fade-in [animation-delay:0.1s]">
            <div className="bg-white px-6 py-4 rounded-2xl border border-science-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-science-50 text-primary flex items-center justify-center">
                <Package size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-science-900 leading-none">{activePaquetes.length}</p>
                <p className="text-[10px] font-black text-science-400 uppercase tracking-widest mt-1">Paquetes Activos</p>
              </div>
            </div>
            <div className="bg-white px-6 py-4 rounded-2xl border border-science-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-science-900 leading-none">{misProductos.length + misCompras.length}</p>
                <p className="text-[10px] font-black text-science-400 uppercase tracking-widest mt-1">Productos / Compras</p>
              </div>
            </div>
            {totalDeuda > 0 && (
              <div className="bg-red-50 px-6 py-4 rounded-2xl border border-red-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
                  <CircleDollarSign size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-red-600 leading-none">{formatPrice(totalDeuda)}</p>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-1">Saldo pendiente</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in [animation-delay:0.2s]">
            <div className="flex bg-white p-1 rounded-2xl border border-science-100 shadow-sm w-fit overflow-x-auto">
              {[
                { key: 'paquetes', label: 'Mis Paquetes', icon: Package,    count: misPaquetes.length },
                { key: 'mis',      label: 'Mis Productos', icon: ShoppingBag, count: misProductos.length + misCompras.length },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTab(opt.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap ${tab === opt.key ? 'bg-science-900 text-white shadow-xl shadow-science-900/10' : 'text-science-400 hover:text-science-600'}`}
                >
                  <opt.icon size={14} className={tab === opt.key ? 'text-primary' : ''} />
                  {opt.label}
                  {opt.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${tab === opt.key ? 'bg-primary text-white' : 'bg-science-50 text-science-400'}`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'mis' && (
              <div className="relative group min-w-[260px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-science-300" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-science-100 rounded-2xl text-sm font-bold text-science-900 placeholder:text-science-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
            )}
          </div>

          {/* ── MIS PAQUETES ── */}
          {tab === 'paquetes' && (
            <div className="space-y-10 animate-fade-in [animation-delay:0.3s]">

              {/* Activos */}
              {activePaquetes.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-science-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap size={16} className="text-primary" />
                    Planes Activos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activePaquetes.map(pkg => {
                      const dias    = calcDiasRestantes(pkg.fechaAsignacion);
                      const expDate = calcFechaExpiracion(pkg.fechaAsignacion);
                      const sesUsadas = pkg.sessionsTaken || 0;
                      const sesTotal  = pkg.numeroServicios || 0;
                      const pct = sesTotal > 0 ? Math.round((sesUsadas / sesTotal) * 100) : 0;
                      return (
                        <div key={pkg.id} className="bg-white rounded-[2rem] border border-science-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                          <div className="h-1.5 w-full bg-science-50">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="p-8">
                            <div className="flex items-start justify-between gap-4 mb-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-science-900 text-primary flex items-center justify-center shadow-lg border border-science-800 group-hover:scale-110 transition-transform">
                                  <Package size={22} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-science-900 leading-tight group-hover:text-primary transition-colors">{pkg.nombre}</h4>
                                  <span className="text-[10px] font-black text-science-400 uppercase tracking-widest">{pkg.tipo || 'Plan Personalizado'}</span>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${dias <= 3 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-science-50 text-primary border border-science-100'}`}>
                                {dias} días
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-science-50/50 p-4 rounded-2xl border border-science-100/50">
                                <p className="text-[10px] font-black text-science-300 uppercase tracking-widest mb-1">Sesiones libres</p>
                                <p className="text-sm font-black text-science-800">{Math.max(0, sesTotal - sesUsadas)} de {sesTotal}</p>
                              </div>
                              <div className="bg-science-50/50 p-4 rounded-2xl border border-science-100/50">
                                <p className="text-[10px] font-black text-science-300 uppercase tracking-widest mb-1">Expira</p>
                                <p className="text-sm font-black text-science-800">{expDate ? formatDate(expDate.toISOString()) : '—'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activePaquetes.length === 0 && historyPaquetes.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[2rem] border border-science-100 border-dashed">
                  <Package size={48} className="mx-auto text-science-100 mb-6 opacity-50" />
                  <h3 className="text-xl font-black text-science-900 mb-2">No tienes paquetes activos</h3>
                  <p className="text-science-400 font-medium">Habla con tu entrenador para adquirir un plan.</p>
                </div>
              )}

              {/* Historial paquetes */}
              {historyPaquetes.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-black text-science-300 uppercase tracking-[0.2em] flex items-center gap-2">
                    <HistoryIcon size={16} />
                    Historial de Paquetes
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {historyPaquetes.map(pkg => (
                      <div key={pkg.id} className="flex items-center justify-between p-5 bg-white/50 border border-science-50 rounded-2xl opacity-60">
                        <div className="flex items-center gap-4">
                          <Package size={18} className="text-science-300" />
                          <div>
                            <p className="font-bold text-science-800 text-sm">{pkg.nombre}</p>
                            <p className="text-[10px] font-bold text-science-400 uppercase tracking-widest">Asignado: {formatDate(pkg.fechaAsignacion)}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-science-400 uppercase tracking-widest px-2 py-1 bg-science-50 rounded-md">Expirado</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MIS PRODUCTOS ── */}
          {tab === 'mis' && (
            <div className="space-y-10 animate-fade-in [animation-delay:0.3s]">

              {/* Productos asignados */}
              {filteredProductos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-science-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    Productos Asignados
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {filteredProductos.map(prod => (
                      <div key={prod.id} className="group p-6 bg-white border border-science-100 rounded-[1.5rem] hover:border-primary/30 transition-all flex items-center gap-6 shadow-sm hover:shadow-lg">
                        <div className="w-16 h-16 rounded-2xl bg-science-50 overflow-hidden flex items-center justify-center shrink-0 border border-science-100">
                          {prod.imageUrl
                            ? <img src={prod.imageUrl} className="w-full h-full object-cover" alt={prod.nombre} />
                            : <ShoppingBag size={24} className="text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-black text-science-900 leading-tight group-hover:text-primary transition-colors">{prod.nombre}</h3>
                              <p className="text-xs text-science-500 mt-1 font-medium line-clamp-1">{prod.descripcion || 'Producto de Elíseos Box & Fitness'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-black text-science-900 tracking-tighter">{formatPrice(prod.precio)}</p>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Asignado</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-science-50">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-science-400 uppercase tracking-widest">
                              <Clock size={12} /> {formatDate(prod.fechaAsignacion)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compras en tienda (cargos) */}
              {filteredCompras.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-science-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Receipt size={16} className="text-primary" />
                    Historial de Compras en Tienda
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {filteredCompras.map(compra => {
                      const saldo = Math.max(0, compra.monto - compra.montoPagado);
                      return (
                        <div key={compra.id} className={`p-6 bg-white border rounded-[1.5rem] shadow-sm transition-all hover:shadow-lg ${saldo > 0 && !compra.paymentPendingValidation ? 'border-red-200 hover:border-red-300' : 'border-science-100 hover:border-primary/30'}`}>
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-5 flex-1 min-w-0">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${compra.isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : compra.paymentPendingValidation ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-red-50 border-red-200 text-red-500'}`}>
                                <Receipt size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-black text-science-900 leading-tight">{compra.descripcion}</h4>
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-science-400 uppercase tracking-widest mt-1">
                                  <Clock size={11} /> {formatDate(compra.createdAt)}
                                </span>
                                {/* Items breakdown */}
                                {compra.items?.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {compra.items.map((item, i) => (
                                      <span key={i} className="text-[10px] font-bold text-science-600 bg-science-50 border border-science-100 px-2 py-1 rounded-lg">
                                        {item.cantidad || item.qty || 1}× {item.nombre || item.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 shrink-0">
                              <p className="text-xl font-black text-science-900 tracking-tighter">{formatPrice(compra.monto)}</p>
                              <PaymentBadge compra={compra} />
                              {saldo > 0 && !compra.paymentPendingValidation && (
                                <Link
                                  href={`/portal/estado-de-cuenta/${compra.id}/pagos?tipo=cargo`}
                                  className="flex items-center gap-2 px-4 py-2 bg-science-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-md"
                                >
                                  <CreditCard size={12} /> Pagar
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {totalProductosItems === 0 && (
                <div className="text-center py-24 bg-white rounded-[2rem] border border-science-100 border-dashed">
                  <ShoppingBag size={48} className="mx-auto text-science-100 mb-6" />
                  <h3 className="text-xl font-black text-science-900 mb-2">Sin productos ni compras</h3>
                  <p className="text-science-400 font-medium">Aquí aparecerán tus productos y compras en tienda.</p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function ProductosPage() {
  return (
    <PortalLayout>
      <ProductosContent />
    </PortalLayout>
  );
}
