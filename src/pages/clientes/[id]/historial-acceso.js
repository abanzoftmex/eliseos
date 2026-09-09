import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDoorOpen,
  faSearch,
  faFilter,
  faClockRotateLeft,
  faUserTie,
  faLocationDot,
  faCalendar,
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
  where,
  orderBy,
} from "firebase/firestore";

function HistorialAccesoPage() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("todos");

  const loadData = useCallback(async () => {
    try {
      const type = await getUserType(id);
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

      const accesosRef = collection(db, "accesos");
      let snap;
      try {
        snap = await getDocs(
          query(
            accesosRef,
            where("userId", "==", id),
            orderBy("timestamp", "desc"),
          ),
        );
      } catch {
        const q2 = query(accesosRef, where("userId", "==", id));
        snap = await getDocs(q2);
      }

      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.timestamp?.toDate?.()?.getTime() || 0;
        const tb = b.timestamp?.toDate?.()?.getTime() || 0;
        return tb - ta;
      });

      setAccesos(items);
    } catch (err) {
      console.error("Error loading historial acceso:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const months = [
    ...new Set(
      accesos
        .filter((a) => a.timestamp?.toDate)
        .map((a) => {
          const d = a.timestamp.toDate();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }),
    ),
  ]
    .sort()
    .reverse();

  const filtered = accesos.filter((a) => {
    if (filterMonth !== "todos" && a.timestamp?.toDate) {
      const d = a.timestamp.toDate();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key !== filterMonth) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const reg = (a.registradoPor || "").toLowerCase();
      const suc = (a.sucursalNombre || "").toLowerCase();
      if (!reg.includes(q) && !suc.includes(q)) return false;
    }
    return true;
  });

  const monthLabel = (key) => {
    const [y, m] = key.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  };

  return (
    <div className="p-8 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/clientes/${id}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
          Volver al perfil
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon
              icon={faDoorOpen}
              className="w-5 h-5 text-blue-600"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Historial de Accesos
            </h1>
            <p className="text-sm text-gray-500">
              {user?.nombre || "Cargando..."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && accesos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{accesos.length}</p>
            <p className="text-sm text-gray-500">Total de accesos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{months.length}</p>
            <p className="text-sm text-gray-500">Meses con actividad</p>
          </div>
          {accesos[0]?.timestamp?.toDate && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 col-span-2 md:col-span-1">
              <p className="text-sm font-semibold text-gray-900">
                {accesos[0].timestamp.toDate().toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-500">Último acceso</p>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <FontAwesomeIcon icon={faSearch} className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por persona o sucursal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {months.length > 1 && (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faFilter}
              className="w-4 h-4 text-gray-400"
            />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los meses</option>
              {months.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        )}
        <span className="text-sm text-gray-400">{filtered.length} accesos</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-gray-400">Cargando historial...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FontAwesomeIcon
            icon={faCalendar}
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
          />
          <p className="text-gray-500">
            {search || filterMonth !== "todos"
              ? "No se encontraron accesos con esos filtros"
              : "No hay accesos registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((acceso) => {
            const ts = acceso.timestamp?.toDate?.() || null;
            const dateStr = ts
              ? ts.toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—";
            const timeStr = ts
              ? ts.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "—";

            return (
              <div
                key={acceso.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faDoorOpen}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 capitalize text-sm">
                      {dateStr}
                    </p>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FontAwesomeIcon
                          icon={faClockRotateLeft}
                          className="w-3 h-3 text-gray-400"
                        />
                        {timeStr}
                      </span>
                      {acceso.registradoPor && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faUserTie}
                            className="w-3 h-3 text-gray-400"
                          />
                          {acceso.registradoPor}
                        </span>
                      )}
                      {acceso.sucursalNombre && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faLocationDot}
                            className="w-3 h-3 text-gray-400"
                          />
                          {acceso.sucursalNombre}
                        </span>
                      )}
                    </div>
                  </div>
                  {acceso.registradoPorRole && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                      {acceso.registradoPorRole}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistorialAccesoPage;
