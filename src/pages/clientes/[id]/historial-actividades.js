import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPersonRunning,
  faCalendar,
  faSearch,
  faFilter,
  faClock,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import Layout from "../../../components/layout/Layout";
import { getUserType } from "../../../../lib/firebase/packagesService";
import { db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";

function HistorialActividadesPage() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");
  const [search, setSearch] = useState("");
  const [marking, setMarking] = useState(null); // id de la actividad marcando

  const loadData = useCallback(async () => {
    try {
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

      const ref = collection(db, userCollection, id, "clasesAsignadas");
      let snap;
      try {
        snap = await getDocs(query(ref, orderBy("fechaAsignacion", "desc")));
      } catch {
        snap = await getDocs(ref);
      }

      const items = await Promise.all(
        snap.docs.map(async (actDoc) => {
          const data = actDoc.data();
          let classData = null;
          if (data.idClase) {
            try {
              const classDoc = await getDoc(doc(db, "clases", data.idClase));
              if (classDoc.exists()) classData = classDoc.data();
            } catch {
              /* skip */
            }
          }
          return { id: actDoc.id, ...data, classData };
        }),
      );

      const sorted = items
        .filter((a) => a.classData)
        .sort((a, b) => {
          const ta = a.fechaAsignacion?.toDate?.()?.getTime() || 0;
          const tb = b.fechaAsignacion?.toDate?.()?.getTime() || 0;
          return tb - ta;
        });

      setActivities(sorted);
    } catch (err) {
      console.error("Error loading historial actividades:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const handleMarkAsistencia = async (assignmentId, status) => {
    setMarking(assignmentId);
    try {
      const res = await fetch('/api/admin/clases/marcar-asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: id, 
          assignmentId, 
          status, 
          collectionName: userType === 'cliente' ? 'clientes' : 'atletas' 
        }),
      });
      
      if (res.ok) {
        toast.success(`Asistencia marcada como: ${status}`);
        loadData();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Error al actualizar');
      }
    } catch (e) {
      toast.error('Error de conexión');
    } finally {
      setMarking(null);
    }
  };

  const filtered = activities.filter((a) => {
    if (filter === "activas" && a.estado !== "activa") return false;
    if (filter === "pasadas" && a.estado === "activa") return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (a.classData?.nombre || "").toLowerCase();
      const instructor = (a.classData?.instructor || "").toLowerCase();
      if (!name.includes(q) && !instructor.includes(q)) return false;
    }
    return true;
  });

  const formatTs = (ts) => {
    if (!ts) return "Fecha no disponible";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => router.push(`/clientes/${id}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-600 mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            Volver al perfil
          </button>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl border border-slate-800">
              <FontAwesomeIcon
                icon={faPersonRunning}
                className="w-6 h-6 text-cyan-500"
              />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                Historial de Sesiones
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                Expediente de {user?.nombre || "Cargando..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 mb-10 flex flex-wrap items-center gap-6 animate-fade-in">
        <div className="relative flex-1 min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por actividad o instructor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none"
          />
        </div>
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
          {["todas", "activas", "pasadas"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f
                  ? "bg-white text-cyan-600 shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-100">
           <span className="text-[10px] font-black text-cyan-700 uppercase tracking-widest">
            {filtered.length} Registros
           </span>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100">
           <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Cargando bitácora técnica...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 border-dashed">
          <FontAwesomeIcon
            icon={faCalendar}
            className="w-16 h-16 text-slate-100 mx-auto mb-6"
          />
          <h3 className="text-xl font-black text-slate-900 mb-2">Sin actividades registradas</h3>
          <p className="text-slate-400 font-medium max-w-sm mx-auto">
            {search || filter !== "todas"
              ? "No se encontraron resultados que coincidan con los filtros aplicados."
              : "Este usuario aún no tiene sesiones agendadas en el sistema."}
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filtered.map((act) => {
            const isActive = act.estado === "activa";
            const isCompleted = act.estado === "asistida" || act.estado === "completada";
            const isCanceled = act.estado === "no_asistio" || act.estado === "cancelada";
            
            const hora = act.classData?.horaInicio || act.classData?.horaEspecifica || null;
            const sessionDateStr = act.fechaAsignacionString || act.fechaEvaluacion;

            // Lógica de bloqueo 15 min antes
            const canMarkAttendance = (() => {
              if (!isActive) return false;
              if (!sessionDateStr || !hora) return true;
              const now = new Date();
              const [y, m, d] = sessionDateStr.split('-').map(Number);
              const [h, min] = hora.split(':').map(Number);
              const startTime = new Date(y, m - 1, d, h, min);
              const diffMin = (startTime - now) / (1000 * 60);
              return diffMin <= 15;
            })();

            return (
              <div
                key={act.id}
                className={`bg-white rounded-[1.5rem] border transition-all duration-300 group ${isCompleted ? 'border-green-100 bg-green-50/20' : isCanceled ? 'border-red-100 bg-red-50/20' : 'border-slate-100 hover:border-cyan-300 hover:shadow-xl'}`}
              >
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isCompleted ? 'bg-green-500 text-white border-green-400 shadow-lg shadow-green-500/20' : isCanceled ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-100'}`}>
                      <FontAwesomeIcon
                        icon={faPersonRunning}
                        className="w-6 h-6"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-slate-900 leading-tight">
                        {act.classData?.nombre || "Actividad Técnica"}
                      </p>
                      {act.classData?.instructor && (
                        <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                          {act.classData.instructor}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          {act.classData?.tipo || 'Sesión'}
                        </span>
                        {hora && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-cyan-500" />
                            {hora} hrs
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <FontAwesomeIcon icon={faCalendar} className="w-3 h-3 text-cyan-500" />
                            {formatTs(sessionDateStr || act.fechaAsignacion)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 lg:shrink-0 min-w-[220px]">
                    {isActive ? (
                      <>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <button
                            disabled={marking === act.id || !canMarkAttendance}
                            onClick={() => handleMarkAsistencia(act.id, 'asistida')}
                            className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canMarkAttendance ? 'bg-slate-900 text-white hover:bg-green-600 shadow-lg' : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'}`}
                          >
                            {marking === act.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FontAwesomeIcon icon={faCheckCircle} /> Marcó Asistencia</>}
                          </button>
                          <button
                            disabled={marking === act.id || !canMarkAttendance}
                            onClick={() => handleMarkAsistencia(act.id, 'no_asistio')}
                            className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canMarkAttendance ? 'bg-white text-red-500 border border-red-100 hover:bg-red-50' : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'}`}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} /> No Asistió
                          </button>
                        </div>
                        {!canMarkAttendance && (
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5" /> Disponible 15 min antes
                          </p>
                        )}
                      </>
                    ) : (
                      <div className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${isCompleted ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                         <FontAwesomeIcon icon={isCompleted ? faCheckCircle : faTimesCircle} />
                         {act.estado === 'asistida' ? 'Asistió' : act.estado === 'no_asistio' ? 'No asistió' : act.estado}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistorialActividadesPage;
