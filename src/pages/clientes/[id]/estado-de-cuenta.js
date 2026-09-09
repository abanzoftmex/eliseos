import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  FileText,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  Calendar,
  AlertCircle,
  TrendingDown,
  History as HistoryIcon,
  Receipt,
  User as UserIcon,
  ShieldCheck,
  Check,
  Search,
  ShoppingBag,
  Package,
  CalendarClock,
  CalendarX,
  Zap,
} from "lucide-react";
import Layout from "../../../components/layout/Layout";
import { getUserType } from "../../../../lib/firebase/packagesService";
import { db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Activity } from "../../../../lib/domain/activity/entity";
import { calcularDiasRestantes, calcularFechaExpiracion } from "../../../utils/packageUtils";

function formatMoney(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n || 0);
}

function EstadoDeCuentaPage() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [activities, setActivities] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("por_validar");
  const [expanded, setExpanded] = useState({});
  const [processing, setProcessing] = useState(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const type = await getUserType(id);
      setUserType(type);
      if (!type) {
        setLoading(false);
        return;
      }

      const userCollection = type === "cliente" ? "clientes" : "atletas";
      const userRef = doc(db, userCollection, id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const d = userDoc.data();
        setUser({
          id,
          nombre:
            `${d.nombre || ""} ${d.apellidoPaterno || ""} ${d.apellidoMaterno || ""}`.trim(),
        });
      }

      const [clasesSnap, cargosSnap, paquetesSnap] = await Promise.all([
        getDocs(query(
          collection(db, userCollection, id, "clasesAsignadas"),
          orderBy("fechaAsignacion", "desc")
        )).catch(() => getDocs(collection(db, userCollection, id, "clasesAsignadas"))),
        getDocs(query(
          collection(db, userCollection, id, "cargos"),
          orderBy("createdAt", "desc")
        )).catch(() => getDocs(collection(db, userCollection, id, "cargos"))),
        getDocs(collection(db, userCollection, id, "paquetesAsignados")),
      ]);

      const items = await Promise.all(
        clasesSnap.docs.map(async (actDoc) => {
          const data = actDoc.data();
          let classData = {};
          if (data.idClase) {
            try {
              const classDoc = await getDoc(doc(db, "clases", data.idClase));
              if (classDoc.exists()) classData = classDoc.data();
            } catch {
              /* skip */
            }
          }
          return new Activity({ id: actDoc.id, ...classData, ...data });
        }),
      );

      const payables = items.filter((a) => a.requiresPayment());
      payables.sort((a, b) => (b.specificDate || "").localeCompare(a.specificDate || ""));
      setActivities(payables);

      // Cargos POS
      const cargosData = cargosSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.estatus !== "cancelado");
      setCargos(cargosData);

      // Planes con vigencia
      const planesData = paquetesSnap.docs
        .map((d) => {
          const p = { id: d.id, ...d.data() };
          const diasRestantes = calcularDiasRestantes(p.fechaAsignacion);
          const fechaExp = calcularFechaExpiracion(p.fechaAsignacion);
          let statusVigencia = "activo";
          if (diasRestantes <= 0) statusVigencia = "expirado";
          else if (diasRestantes <= 7) statusVigencia = "por_vencer";
          return { ...p, diasRestantes, fechaExp, statusVigencia };
        })
        .filter((p) => p.status === "active" || p.status === "expired");
      setPlanes(planesData);
    } catch (err) {
      console.error("Error loading estado de cuenta:", err);
      toast.error("Error al cargar los datos técnicos");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpand = (actId) => {
    setExpanded((prev) => ({ ...prev, [actId]: !prev[actId] }));
  };

  const handleAction = async (assignmentId, abonoId, action, reason = "") => {
    setProcessing(abonoId || assignmentId);
    try {
      const res = await fetch("/api/admin/clases/validar-abono", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          userType,
          assignmentId,
          abonoId: abonoId || "single_report",
          action,
          reason,
        }),
      });
      if (res.ok) {
        toast.success(action === "validate" ? "Pago validado" : "Pago rechazado");
        loadData();
      } else {
        const json = await res.json();
        throw new Error(json.error || "Error al procesar");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleCargoAction = async (cargoId, abonoId, action, reason = "") => {
    setProcessing(abonoId || cargoId);
    try {
      const res = await fetch("/api/admin/cargos/validar-abono", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, userType, cargoId, abonoId, action, reason }),
      });
      if (res.ok) {
        toast.success(action === "validate" ? "Pago validado" : "Pago rechazado");
        loadData();
      } else {
        const json = await res.json();
        throw new Error(json.error || "Error al procesar");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const { porCobrar, porValidar, liquidados, summary } = useMemo(() => {
    const pc = [];
    const pv = [];
    const liq = [];
    const stats = { total: 0, pagado: 0, pendiente: 0 };

    activities.forEach((a) => {
      const price = a.price;
      const validado = Number(a.totalValidado || (a.isPaid ? price : 0));
      const abonos = a.abonosReportados || [];
      const hasPending =
        abonos.some((ab) => ab.estado === "pendiente") ||
        a.paymentPendingValidation;

      stats.total += price;
      stats.pagado += validado;
      stats.pendiente += price - validado;

      if (a.isPaid || validado >= price) {
        liq.push(a);
      } else if (hasPending) {
        pv.push(a);
      } else {
        pc.push(a);
      }
    });

    // Sumar cargos POS al resumen
    cargos.forEach((c) => {
      stats.total += Number(c.monto || 0);
      stats.pagado += Number(c.totalValidado || 0);
      stats.pendiente += Number(c.monto || 0) - Number(c.totalValidado || 0);
    });

    return { porCobrar: pc, porValidar: pv, liquidados: liq, summary: stats };
  }, [activities, cargos]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div>
          <button
            onClick={() => router.push(`/clientes/${id}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-600 mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al perfil
          </button>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-slate-800">
              <FileText size={32} className="text-[#0ea5e9]" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                Estado de Cuenta
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-pulse"></span>
                Control técnico de {user?.nombre || "Cargando..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in [animation-delay:0.1s]">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <HistoryIcon size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
              Total Servicios
            </p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
              {formatMoney(summary.total)}
            </h3>
          </div>
        </div>

        <div className="bg-[#0f172a] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700 text-emerald-500">
            <CheckCircle2 size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
              Total Recaudado
            </p>
            <h3 className="text-4xl font-black text-emerald-400 tracking-tighter">
              {formatMoney(summary.pagado)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 text-red-500">
            <TrendingDown size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1 text-red-500">
              Saldo Pendiente
            </p>
            <h3 className="text-4xl font-black text-red-500 tracking-tighter">
              {formatMoney(summary.pendiente)}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit overflow-x-auto animate-fade-in [animation-delay:0.2s]">
        {[
          {
            id: "por_validar",
            label: "Por Validar",
            count: porValidar.length,
            icon: Clock,
          },
          {
            id: "por_cobrar",
            label: "Pendientes",
            count: porCobrar.length,
            icon: CircleDollarSign,
          },
          {
            id: "cargos_pos",
            label: "Cargos POS",
            count: cargos.filter((c) => !c.isPaid).length,
            icon: ShoppingBag,
          },
          {
            id: "planes",
            label: "Planes",
            count: planes.length,
            icon: Package,
          },
          {
            id: "liquidados",
            label: "Liquidados",
            count: liquidados.length,
            icon: CheckCircle2,
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap ${tab === t.id ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
          >
            <t.icon
              size={14}
              className={
                tab === t.id
                  ? t.id === "por_validar"
                    ? "text-amber-400"
                    : "text-[#0ea5e9]"
                  : ""
              }
            />
            {t.label}
            {t.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-md text-[9px] ${tab === t.id ? "bg-[#0ea5e9] text-white" : "bg-slate-50 text-slate-400"}`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="animate-fade-in [animation-delay:0.3s]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
              Consultando balances...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(tab === "por_validar"
              ? porValidar
              : tab === "por_cobrar"
                ? porCobrar
                : liquidados
            ).length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 border-dashed animate-fade-in">
                <ShieldCheck
                  size={48}
                  className="mx-auto text-slate-100 mb-6"
                />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                  Sin registros
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-2">
                  No hay actividades en esta categoría para mostrar.
                </p>
              </div>
            ) : (
              (tab === "por_validar"
                ? porValidar
                : tab === "por_cobrar"
                  ? porCobrar
                  : liquidados
              ).map((act) => {
                const price = act.price;
                const validado = Number(
                  act.totalValidado || (act.isPaid ? price : 0),
                );
                const pendiente = price - validado;
                const abonos = act.abonosReportados || [];
                const hasPending =
                  abonos.some((a) => a.estado === "pendiente") ||
                  act.paymentPendingValidation;

                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:border-[#0ea5e9]/30 transition-all group animate-fade-in"
                  >
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-start gap-6">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${act.isPaid ? "bg-green-50 text-green-500 border-green-100" : hasPending ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                        >
                          <Receipt size={24} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#0ea5e9] transition-colors">
                            {act.name || "Sesión Técnica"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 pt-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <Calendar size={12} className="text-[#0ea5e9]" />{" "}
                              {act.getDisplayDate()}
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                              ID: {act.id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${act.status === "asistida" ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}
                            >
                              {act.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                            Costo Total
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {formatMoney(price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                            Pendiente
                          </p>
                          <p
                            className={`text-xl font-black ${pendiente > 0 ? "text-red-500" : "text-emerald-500"}`}
                          >
                            {formatMoney(pendiente)}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleExpand(act.id)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expanded[act.id] ? "bg-slate-900 text-white shadow-xl rotate-180" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>
                    </div>

                    {expanded[act.id] && (
                      <div className="p-8 border-t border-slate-50 bg-slate-50/30 animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                            <HistoryIcon size={14} className="text-[#0ea5e9]" />
                            Historial de Reportes
                          </h4>
                          {hasPending && (
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse border border-amber-200">
                              Requiere Validación
                            </span>
                          )}
                        </div>

                        {abonos.length === 0 ? (
                          <div className="space-y-6">
                            {act.paymentPendingValidation &&
                              act.paymentEvidenceUrl && (
                                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                      <Clock size={20} />
                                    </div>
                                    <div>
                                      <p className="text-lg font-black text-slate-900">
                                        {formatMoney(act.paymentAmountReported)}
                                      </p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Reporte único de portal
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <a
                                      href={act.paymentEvidenceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                                    >
                                      <Eye size={14} /> Ver Comprobante
                                    </a>
                                    <button
                                      onClick={() =>
                                        handleAction(act.id, null, "validate")
                                      }
                                      className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
                                    >
                                      Validar Pago
                                    </button>
                                  </div>
                                </div>
                              )}
                            {!act.paymentPendingValidation && (
                              <div className="py-10 text-center text-slate-400 italic font-medium text-sm">
                                No hay comprobantes subidos para esta actividad.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {abonos.map((abono) => (
                              <div
                                key={abono.id}
                                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-[#0ea5e9]/20"
                              >
                                <div className="flex items-center gap-5">
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${abono.estado === "validado" ? "bg-green-50 text-green-500 border-green-100" : abono.estado === "rechazado" ? "bg-red-50 text-red-500 border-red-100" : "bg-amber-50 text-amber-500 border-amber-100"}`}
                                  >
                                    <HistoryIcon size={20} />
                                  </div>
                                  <div>
                                    <p className="text-lg font-black text-slate-900">
                                      {formatMoney(abono.monto)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                      <Clock
                                        size={12}
                                        className="text-[#0ea5e9]"
                                      />{" "}
                                      Reportado:{" "}
                                      {new Date(
                                        abono.fechaReporte,
                                      ).toLocaleDateString("es-MX")}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {abono.evidenciaUrl && (
                                    <a
                                      href={abono.evidenciaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0ea5e9] transition-all shadow-lg shadow-black/10"
                                    >
                                      <Eye size={14} /> Ver Ticket
                                    </a>
                                  )}

                                  {abono.estado === "pendiente" && (
                                    <div className="flex gap-2">
                                      <button
                                        disabled={processing === abono.id}
                                        onClick={() =>
                                          handleAction(
                                            act.id,
                                            abono.id,
                                            "validate",
                                          )
                                        }
                                        className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
                                      >
                                        {processing === abono.id ? (
                                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                          <>
                                            <Check size={14} /> Aprobar
                                          </>
                                        )}
                                      </button>
                                      <button
                                        disabled={processing === abono.id}
                                        onClick={() => {
                                          const reason = window.prompt(
                                            "Motivo del rechazo:",
                                          );
                                          if (reason !== null)
                                            handleAction(
                                              act.id,
                                              abono.id,
                                              "reject",
                                              reason,
                                            );
                                        }}
                                        className="px-5 py-2.5 bg-white text-red-500 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                      >
                                        Rechazar
                                      </button>
                                    </div>
                                  )}

                                  {abono.estado !== "pendiente" && (
                                    <div
                                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${abono.estado === "validado" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
                                    >
                                      {abono.estado === "validado" ? (
                                        <CheckCircle2 size={12} />
                                      ) : (
                                        <XCircle size={12} />
                                      )}
                                      Pago {abono.estado}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* CARGOS POS */}
      {tab === "cargos_pos" && (
        <div className="space-y-4 animate-fade-in">
          {cargos.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
              <ShoppingBag size={48} className="mx-auto text-slate-100 mb-6" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Sin cargos POS</h3>
              <p className="text-slate-400 text-sm font-medium mt-2">No hay compras con pago diferido registradas.</p>
            </div>
          ) : (
            cargos.map((cargo) => {
              const abonos = cargo.abonosReportados || [];
              const hasPending = abonos.some((a) => a.estado === "pendiente") || cargo.paymentPendingValidation;
              const pendiente = Number(cargo.monto || 0) - Number(cargo.totalValidado || 0);
              const isExpanded = expanded[`cargo_${cargo.id}`];
              return (
                <div key={cargo.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:border-[#0ea5e9]/30 transition-all group">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${cargo.isPaid ? "bg-green-50 text-green-500 border-green-100" : hasPending ? "bg-amber-50 text-amber-500 border-amber-100" : "bg-orange-50 text-orange-500 border-orange-100"}`}>
                        <ShoppingBag size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-[#0ea5e9] transition-colors">
                          {cargo.descripcion || "Venta en tienda"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${cargo.isPaid ? "bg-green-50 text-green-600 border-green-100" : hasPending ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                            {cargo.isPaid ? "Pagado" : hasPending ? "En Validación" : "Pendiente"}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
                            ID: {cargo.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xl font-black text-slate-900">{formatMoney(cargo.monto)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pendiente</p>
                        <p className={`text-xl font-black ${pendiente > 0 ? "text-red-500" : "text-emerald-500"}`}>{formatMoney(pendiente)}</p>
                      </div>
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [`cargo_${cargo.id}`]: !prev[`cargo_${cargo.id}`] }))}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? "bg-slate-900 text-white shadow-xl rotate-180" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                      >
                        <ChevronDown size={20} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-8 border-t border-slate-50 bg-slate-50/30 animate-fade-in space-y-4">
                      {cargo.items && cargo.items.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Productos</p>
                          {cargo.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-50 last:border-0">
                              <span className="font-medium text-slate-700">{item.nombre} x{item.cantidad}</span>
                              <span className="font-bold text-slate-900">{formatMoney(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <HistoryIcon size={14} className="text-[#0ea5e9]" /> Historial de Abonos
                      </h4>
                      {abonos.length === 0 ? (
                        <p className="py-6 text-center text-slate-400 italic font-medium text-sm">No hay comprobantes subidos aún.</p>
                      ) : (
                        <div className="space-y-3">
                          {abonos.map((abono) => (
                            <div key={abono.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${abono.estado === "validado" ? "bg-green-50 text-green-500 border-green-100" : abono.estado === "rechazado" ? "bg-red-50 text-red-500 border-red-100" : "bg-amber-50 text-amber-500 border-amber-100"}`}>
                                  <HistoryIcon size={20} />
                                </div>
                                <div>
                                  <p className="text-lg font-black text-slate-900">{formatMoney(abono.monto)}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {new Date(abono.fechaReporte).toLocaleDateString("es-MX")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                {abono.evidenciaUrl && (
                                  <a href={abono.evidenciaUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0ea5e9] transition-all shadow-lg">
                                    <Eye size={14} /> Ver Ticket
                                  </a>
                                )}
                                {abono.estado === "pendiente" && (
                                  <div className="flex gap-2">
                                    <button
                                      disabled={processing === abono.id}
                                      onClick={() => handleCargoAction(cargo.id, abono.id, "validate")}
                                      className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                      {processing === abono.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Aprobar</>}
                                    </button>
                                    <button
                                      disabled={processing === abono.id}
                                      onClick={() => { const reason = window.prompt("Motivo del rechazo:"); if (reason !== null) handleCargoAction(cargo.id, abono.id, "reject", reason); }}
                                      className="px-5 py-2.5 bg-white text-red-500 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                    >Rechazar</button>
                                  </div>
                                )}
                                {abono.estado !== "pendiente" && (
                                  <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${abono.estado === "validado" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                                    {abono.estado === "validado" ? <CheckCircle2 size={12} /> : <XCircle size={12} />} Pago {abono.estado}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PLANES */}
      {tab === "planes" && (
        <div className="space-y-4 animate-fade-in">
          {planes.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
              <Package size={48} className="mx-auto text-slate-100 mb-6" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Sin planes asignados</h3>
            </div>
          ) : (
            planes.map((plan) => {
              const isExpired = plan.statusVigencia === "expirado";
              const isPorVencer = plan.statusVigencia === "por_vencer";
              let badge = "bg-emerald-50 text-emerald-700 border-emerald-200";
              let labelText = `${plan.diasRestantes} días restantes`;
              if (isExpired) { badge = "bg-red-50 text-red-600 border-red-200"; labelText = "Expirado"; }
              else if (isPorVencer) { badge = "bg-amber-50 text-amber-700 border-amber-200"; labelText = `${plan.diasRestantes} día${plan.diasRestantes !== 1 ? "s" : ""} restante${plan.diasRestantes !== 1 ? "s" : ""}`; }
              const fechaExp = plan.fechaExp ? plan.fechaExp.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : null;
              const saldoPendiente = Math.max(0, Number(plan.precioFinal || plan.precio || 0) - Number(plan.montoPagado || 0));
              return (
                <div key={plan.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${badge}`}>
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">{plan.nombre || plan.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${badge}`}>{labelText}</span>
                        {fechaExp && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vence: {fechaExp}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${saldoPendiente > 0 ? "text-red-500" : "text-emerald-600"}`}>{formatMoney(saldoPendiente)}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{saldoPendiente > 0 ? "Saldo pendiente" : "Liquidado"}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

EstadoDeCuentaPage.requireAuth = true;
EstadoDeCuentaPage.allowedRoles = ["admin", "medico", "asistente"];

export default function AccountStatementAdminPage() {
  return <EstadoDeCuentaPage />;
}
