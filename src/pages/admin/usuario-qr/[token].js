// ELÍSEOS BOX & FITNESS - SCANNER MODULE - v2.0 - REFRESH
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldAlert,
  Cake,
  Users,
  Briefcase,
  MapPin,
  Package as PackageIcon,
  Activity as ActivityIcon,
  CheckCircle2,
  XCircle,
  QrCode,
  ArrowLeft,
  DoorOpen,
  Check,
  Clock,
  UserCircle,
  Zap,
  ChevronRight,
  AlertCircle,
  History as HistoryIcon,
  Calendar as CalendarIcon,
  Trophy,
  Award,
  Gift
} from "lucide-react";
import useAuthStore from "@/store/authStore";
import useSucursalStore, { ALL_SUCURSALES_ID } from "@/store/sucursalStore";

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};
const DAY_ORDER = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

function formatDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getScheduleLabel(classData) {
  if (!classData) return null;
  const parts = [];

  if (classData.diasSemana?.length > 0) {
    const sorted = [...classData.diasSemana].sort(
      (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
    );
    parts.push(sorted.map((d) => DAY_LABELS[d] || d).join(", "));
  }

  if (classData.horaInicio) parts.push(classData.horaInicio + " hrs");

  if (
    classData.modoProgramacion === "especifica" &&
    classData.fechasEspecificas?.length > 0
  ) {
    const f = classData.fechasEspecificas[0];
    const d = new Date(f.fecha + "T00:00:00");
    parts.push(
      d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
    );
    if (f.hora) parts.push(f.hora + " hrs");
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
        {Icon && <Icon size={16} className="text-[#0ea5e9]" />}
        <h2 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em]">
          {title}
        </h2>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function Field({ icon: Icon, label, value, accent = "#0ea5e9" }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0 group">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-50 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accent}10`, color: accent }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-bold text-[#0f172a] leading-tight break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function AttendanceCard({ activity, userId, collectionName, onUpdate }) {
  const [marking, setMarking] = useState(false);
  const cd = activity.classData;

  // Determinamos la fecha a mostrar (preferimos la de la sesión específica)
  const sessionDateStr =
    activity.fechaAsignacionString || activity.fechaEvaluacion;
  const displayDate = sessionDateStr
    ? formatDate(sessionDateStr)
    : getScheduleLabel(cd);

  const handleMark = async (status) => {
    setMarking(true);
    try {
      const res = await fetch("/api/admin/clases/marcar-asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          assignmentId: activity.id,
          status,
          collectionName,
        }),
      });
      if (res.ok) {
        onUpdate();
      } else {
        const json = await res.json();
        alert(json.error || "Error al marcar asistencia");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setMarking(false);
    }
  };

  const isCompleted =
    activity.estado === "asistida" || activity.estado === "completada";
  const isCanceled =
    activity.estado === "no_asistio" || activity.estado === "cancelada";

  // Lógica de bloqueo 15 min antes
  const canMarkAttendance = useMemo(() => {
    if (!sessionDateStr || !cd?.horaInicio) return true;
    const now = new Date();
    const [y, m, d] = sessionDateStr.split("-").map(Number);
    const [h, min] = cd.horaInicio.split(":").map(Number);
    const startTime = new Date(y, m - 1, d, h, min);
    const diffMs = startTime - now;
    const diffMin = diffMs / (1000 * 60);
    return diffMin <= 15; // Habilitar si faltan 15 min o ya pasó
  }, [sessionDateStr, cd?.horaInicio]);

  return (
    <div
      className={`p-6 rounded-[1.5rem] border transition-all ${isCompleted ? "bg-green-50 border-green-100" : isCanceled ? "bg-red-50 border-red-100" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-black text-[#0f172a] leading-tight mb-1">
            {cd?.nombre || "Sesión"}
          </h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <CalendarIcon size={12} className="text-[#0ea5e9]" /> {displayDate}
            {cd?.horaInicio && (
              <span className="ml-2 flex items-center gap-1">
                <Clock size={12} className="text-[#0ea5e9]" /> {cd.horaInicio}{" "}
                hrs
              </span>
            )}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isCompleted ? "bg-green-500 text-white" : isCanceled ? "bg-red-500 text-white" : "bg-slate-900 text-white"}`}
        >
          {activity.estado || "Activa"}
        </div>
      </div>

      {!isCompleted && !isCanceled && (
        <div className="space-y-3 mt-6">
          <div className="flex gap-3">
            <button
              disabled={marking || !canMarkAttendance}
              onClick={() => handleMark("asistida")}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${canMarkAttendance ? "bg-[#0f172a] text-white hover:bg-[#0ea5e9]" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}
            >
              {marking ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} /> Marcó Asistencia
                </>
              )}
            </button>
            <button 
              disabled={marking || !canMarkAttendance}
              onClick={() => handleMark('no_asistio')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canMarkAttendance ? 'bg-white text-red-500 border border-red-100 hover:bg-red-50' : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'}`}
            >
              <XCircle size={14} /> No Asistió
            </button>

          </div>
          {!canMarkAttendance && (
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center flex items-center justify-center gap-1.5">
              <Clock size={10} /> Disponible 15 min antes de la clase
            </p>
          )}
        </div>
      )}

      {(isCompleted || isCanceled) && (
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
          {isCompleted ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          Asistencia registrada
        </div>
      )}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

function AdminQrScannerContent() {
  const router = useRouter();
  const { token } = router.query;
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedSucursal = useSucursalStore((s) => s.selectedSucursal);
  const sucursales = useSucursalStore((s) => s.sucursales);
  const getSucursal = useSucursalStore((s) => s.getSucursal);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setReg] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [regError, setRegError] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickedSucursal, setPicked] = useState(null);
  const [passportSummary, setPassportSummary] = useState(null);

  const reloadData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/usuario-qr/${token}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const res = await fetch(`/api/admin/usuario-qr/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Error al cargar");
          return;
        }
        setData(json);
      } catch {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    }
    load();

    // Carga de resumen del Pasaporte para el scanner
    fetch(`/api/admin/usuario-qr/${token}/pasaporte-resumen`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setPassportSummary(d);
      })
      .catch(() => {});
  }, [token]);

  const { todaysActivities, lastRegisteredActivity } = useMemo(() => {
    if (!data?.activities)
      return { todaysActivities: [], lastRegisteredActivity: null };

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const sorted = [...data.activities].sort((a, b) => {
      const ta = new Date(a.fechaAsignacion).getTime() || 0;
      const tb = new Date(b.fechaAsignacion).getTime() || 0;
      return tb - ta;
    });

    const last = sorted[0] || null;

    // Filtramos TODAS las de hoy
    const todayActs = data.activities
      .filter((act) => {
        const sessionDateStr = act.fechaAsignacionString || act.fechaEvaluacion;
        if (!sessionDateStr) return false;
        return sessionDateStr === todayStr;
      })
      .sort((a, b) => {
        const hA =
          a.classData?.horaInicio || a.classData?.horaEspecifica || "00:00";
        const hB =
          b.classData?.horaInicio || b.classData?.horaEspecifica || "00:00";
        return hA.localeCompare(hB);
      });

    return { todaysActivities: todayActs, lastRegisteredActivity: last };
  }, [data?.activities]);

  function handleRegistrarAccesoClick() {
    if (registering || registered) return;
    if (selectedSucursal === ALL_SUCURSALES_ID) {
      setPicked(null);
      setShowPicker(true);
    } else {
      const sucObj = getSucursal(selectedSucursal);
      const userSucursalNames = data?.user?.sucursales || [];
      const belongs =
        userSucursalNames.length === 0 ||
        userSucursalNames.includes(sucObj?.name);
      if (belongs) {
        doRegistrar(selectedSucursal);
      } else {
        setPicked(null);
        setShowPicker(true);
      }
    }
  }

  async function doRegistrar(sucursalId) {
    setShowPicker(false);
    setReg(true);
    setRegError(null);
    const sucursalObj = getSucursal(sucursalId);
    const sucursalNombre = sucursalObj?.name || sucursalId || null;
    try {
      const nombre =
        currentUser?.displayName || currentUser?.email || "Administrador";
      const res = await fetch(
        `/api/admin/usuario-qr/${token}/registrar-acceso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registradoPor: nombre,
            sucursal: sucursalId || null,
            sucursalNombre,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setRegError(json.error || "Error al registrar");
        return;
      }
      setRegistered(true);
      reloadData();
    } catch {
      setRegError("Error de conexión");
    } finally {
      setReg(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <QrCode size={48} className="text-slate-200 animate-pulse mb-4" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">
          Leyendo Identidad Digital
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-400 mb-6 border border-red-100 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-[#0f172a] mb-2 tracking-tight">
          QR No Válido
        </h2>
        <p className="text-slate-400 font-medium mb-10 max-w-xs">{error}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-8 py-3 bg-[#0f172a] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#0ea5e9] transition-all shadow-xl shadow-slate-900/10"
        >
          <ArrowLeft size={16} /> Volver al Sistema
        </button>
      </div>
    );
  }

  const { user, packages = [], recentAccesos = [], collectionName } = data;
  const age = calcAge(user?.fechaNacimiento);
  const birth = formatDate(user?.fechaNacimiento);
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  const userSucursalNames = user?.sucursales || [];
  const validSucursales = sucursales.filter(
    (s) => userSucursalNames.length === 0 || userSucursalNames.includes(s.name),
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 animate-fade-in pb-20">
      <div className="relative rounded-[2.5rem] bg-[#0f172a] overflow-hidden shadow-2xl">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#0ea5e9]/20 rounded-full blur-[80px]" />

        <div className="relative p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shadow-2xl">
              {user?.foto ? (
                <img src={user.foto} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-black">
                  {initial}
                </span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0ea5e9] rounded-xl flex items-center justify-center text-white border-4 border-[#0f172a] shadow-lg">
              <Zap size={14} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <p className="text-[#0ea5e9] font-black text-[10px] uppercase tracking-[0.4em] mb-1">
                Identidad Verificada
              </p>
              <h1 className="text-4xl font-black text-white tracking-tight">
                {user?.name}
              </h1>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                {user?.type === "atleta" ? "Atleta Elite" : "Miembro Elíseos"}
              </span>
              <span
                className={`px-4 py-1.5 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border ${user?.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/20" : "bg-red-500/20 text-red-400 border-red-500/20"}`}
              >
                {user?.status === "active" ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center md:items-end gap-3">
            <button
              onClick={handleRegistrarAccesoClick}
              disabled={registering || registered}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${registered ? "bg-green-500 text-white shadow-green-500/20" : "bg-white text-[#0f172a] hover:bg-[#0ea5e9] hover:text-white shadow-black/20"}`}
            >
              {registering ? (
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : registered ? (
                <>
                  <Check size={16} /> Entrada Registrada
                </>
              ) : (
                <>
                  <DoorOpen size={16} /> Registrar Entrada
                </>
              )}
            </button>
            {regError && (
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                {regError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <Section title="Control de Asistencia" icon={ActivityIcon}>
            <div className="grid grid-cols-1 gap-8">
              {/* Actividades de Hoy */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-[#0ea5e9]/10 text-[#0ea5e9] px-2 py-0.5 rounded uppercase tracking-widest text-center">
                    Agenda del día
                  </span>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Actividades de Hoy
                  </h3>
                </div>

                {todaysActivities.length > 0 ? (
                  <div className="space-y-4">
                    {todaysActivities.map((act) => (
                      <AttendanceCard
                        key={act.id}
                        activity={act}
                        userId={user.id}
                        collectionName={collectionName}
                        onUpdate={reloadData}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center">
                    <p className="text-sm font-bold text-slate-400">
                      Sin sesiones programadas para hoy.
                    </p>
                  </div>
                )}
              </div>

              {/* Última Registrada */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">
                    Margen de registro
                  </span>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Última Registrada
                  </h3>
                </div>
                {lastRegisteredActivity &&
                !todaysActivities.some(
                  (a) => a.id === lastRegisteredActivity.id,
                ) ? (
                  <AttendanceCard
                    activity={lastRegisteredActivity}
                    userId={user.id}
                    collectionName={collectionName}
                    onUpdate={reloadData}
                  />
                ) : lastRegisteredActivity ? (
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      La última sesión ya está en la lista de hoy.
                    </p>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center">
                    <p className="text-sm font-bold text-slate-400">
                      No hay otras actividades recientes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="Historial de Entradas" icon={HistoryIcon}>
            {recentAccesos.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium py-10 text-center italic">
                Sin registros de acceso previos.
              </p>
            ) : (
              <div className="space-y-0">
                {recentAccesos.map((acceso) => {
                  const ts = acceso.timestamp
                    ? new Date(acceso.timestamp)
                    : null;
                  return (
                    <div
                      key={acceso.id}
                      className="flex items-start gap-6 py-6 border-b border-slate-50 last:border-0 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-[#0ea5e9] group-hover:border-[#0ea5e9]/20 transition-all shrink-0 shadow-sm">
                        <DoorOpen size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-black text-[#0f172a] capitalize">
                            {ts?.toLocaleDateString("es-MX", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <span className="px-2 py-0.5 bg-sky-50 text-[#0ea5e9] rounded text-[8px] font-black uppercase tracking-widest border border-sky-100">
                            {acceso.registradoPorRole || "Staff"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Clock size={12} className="text-[#0ea5e9]" />{" "}
                            {ts?.toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <UserCircle size={12} /> {acceso.registradoPor}
                          </span>
                          {acceso.sucursalNombre && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <MapPin size={12} /> {acceso.sucursalNombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        <div className="lg:col-span-5 space-y-10">
          {/* Tarjeta de Pasaporte Rewards */}
          <Section title="Pasaporte Rewards 2026" icon={Trophy}>
            {passportSummary ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                      Sellos Obtenidos
                    </span>
                    <span className="text-3xl font-black text-[#0f172a]">
                      {passportSummary.totalSellos || 0}{" "}
                      <span className="text-xs font-bold text-slate-400">
                        / 56
                      </span>
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {passportSummary.porcentajeProgreso || 0}% Progreso
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Constancia
                    </span>
                    <span className="font-black text-[#0f172a] text-sm">
                      {passportSummary.sellosConstancia || 0} / 48
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Experiencia
                    </span>
                    <span className="font-black text-[#0f172a] text-sm">
                      {passportSummary.sellosExperiencia || 0} / 8
                    </span>
                  </div>
                </div>

                {passportSummary.proximaRecompensa && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                    <Gift size={18} className="text-amber-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">
                        Próxima Meta
                      </p>
                      <p className="text-xs font-bold text-[#0f172a] truncate">
                        {passportSummary.proximaRecompensa.nombre} (
                        {passportSummary.proximaRecompensa.sellosFaltantes}{" "}
                        sellos restantes)
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    router.push(`/clientes/${user.id}/pasaporte`)
                  }
                  className="w-full py-3 bg-[#0f172a] hover:bg-[#0ea5e9] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <Award size={14} /> Gestionar Pasaporte Completo
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-bold animate-pulse">
                Cargando estado del pasaporte...
              </div>
            )}
          </Section>

          <Section title="Información de Contacto" icon={Mail}>
            <Field icon={Mail} label="Correo" value={user?.email} />
            <Field
              icon={Phone}
              label="Teléfono"
              value={user?.telefonoContacto}
            />
            <Field
              icon={ShieldAlert}
              label="Emergencia"
              value={user?.telefonoEmergencia}
              accent="#ef4444"
            />
            <Field
              icon={UserCircle}
              label="Contacto"
              value={user?.nombreContactoEmergencia}
              accent="#ef4444"
            />
          </Section>

          <Section title="Datos de Salud" icon={UserIcon}>
            <Field
              icon={Cake}
              label="Nacimiento"
              value={birth ? `${birth} (${age} años)` : null}
              accent="#f59e0b"
            />
            <Field
              icon={Users}
              label="Género"
              value={user?.genero}
              accent="#7c3aed"
            />
            <Field
              icon={Zap}
              label="Lado Dominante"
              value={user?.ladoDominante}
              accent="#f59e0b"
            />
            <Field
              icon={Briefcase}
              label="Ocupación"
              value={user?.ocupacion}
              accent="#64748b"
            />
            <Field
              icon={UserCircle}
              label="Responsable"
              value={user?.responsable}
              accent="#10b981"
            />
          </Section>

          {packages.length > 0 && (
            <Section title="Planes y Paquetes" icon={PackageIcon}>
              <div className="space-y-4">
                {packages.slice(0, 3).map((pkg, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-[#0ea5e9]/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-black text-[#0f172a] leading-tight">
                        {pkg.packageName || pkg.nombre}
                      </p>
                      <PackageIcon
                        size={14}
                        className="text-slate-300 group-hover:text-[#0ea5e9] transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${pkg.activo ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                      >
                        {pkg.activo ? "Activo" : "Vencido"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          />
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-sm relative z-10 shadow-2xl">
            <h3 className="text-xl font-black text-[#0f172a] mb-8">
              Seleccionar Sede
            </h3>
            <div className="space-y-3 mb-10">
              {validSucursales.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPicked(s.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${pickedSucursal === s.id ? "border-[#0ea5e9] bg-sky-50 text-[#0ea5e9]" : "border-slate-50 bg-slate-50 text-slate-600 hover:border-slate-200"}`}
                >
                  <span className="text-sm font-bold">{s.name}</span>
                  {pickedSucursal === s.id && <Check size={16} />}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Cerrar
              </button>
              <button
                onClick={() => pickedSucursal && doRegistrar(pickedSucursal)}
                disabled={!pickedSucursal}
                className="flex-2 py-3 bg-[#0f172a] text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminScannerModulePage() {
  return <AdminQrScannerContent />;
}
