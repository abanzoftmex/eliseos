import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBox,
  faCalendar,
  faChartLine,
  faChevronRight,
  faFileText,
  faPlus,
  faMapMarkerAlt,
  faHeartPulse,
  faPersonRunning,
  faTrash,
  faDoorOpen,
  faClock,
  faLocationDot,
  faFileInvoiceDollar,
  faAward,
  faNoteSticky,
  faCalendarCheck,
  faEdit,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import NotasSidePanel from "../../../components/NotasSidePanel";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import { showSuccessToast, showErrorToast } from "../../../utils/toast";
import {
  getUserPackages,
  getUserType,
} from "../../../../lib/firebase/packagesService";
import { db } from "../../../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import useSucursalStore from "../../../store/sucursalStore";

function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const sucursales = useSucursalStore((state) => state.sucursales);
  const [isNotasPanelOpen, setIsNotasPanelOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMember = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccessToast('Miembro eliminado exitosamente');
        router.push('/clientes');
      } else {
        showErrorToast(data.error || 'Error al eliminar miembro');
      }
    } catch (err) {
      showErrorToast('Error de conexión al eliminar');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Helper para obtener nombres de sucursales (ahora soporta arrays)
  const getSucursalesNames = (cliente) => {
    if (!cliente) return ["Sin sucursal"];

    const sucursalesArray = Array.isArray(cliente.sucursales)
      ? cliente.sucursales
      : cliente.sucursal
        ? [cliente.sucursal]
        : [];

    if (sucursalesArray.length === 0) return ["Sin sucursal"];

    return sucursalesArray.map((sucursalId) => {
      // Si sucursalId ya es un nombre (string largo), devolverlo directamente
      if (typeof sucursalId === "string" && sucursalId.length > 25) {
        return sucursalId;
      }

      const sucursal = sucursales.find((s) => s.id === sucursalId);
      return sucursal ? sucursal.name : sucursalId;
    });
  };

  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userPackages, setUserPackages] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [recentAccesos, setRecentAccesos] = useState([]);
  const [consultasRapidas, setConsultasRapidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadUserData = useCallback(async () => {
    try {
      const type = await getUserType(id);
      setUserType(type);

      if (type) {
        const userCollection = type === "cliente" ? "clientes" : "atletas";
        const userRef = doc(db, userCollection, id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("📊 Datos del usuario desde Firebase:", userData);
          console.log("📧 Email:", userData.email);
          console.log("📱 Teléfono contacto:", userData.telefonoContacto);
          console.log("🚨 Teléfono emergencia:", userData.telefonoEmergencia);
          console.log("🎂 Fecha nacimiento:", userData.fechaNacimiento);
          console.log("👤 Género:", userData.genero);
          console.log("✋ Lado dominante:", userData.ladoDominante);
          console.log("📋 Status:", userData.status);

          setUser({
            id: id,
            name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ""}`.trim(),
            email: userData.email || "Sin email",
            telefono:
              userData.telefono || userData.telefonoContacto || "Sin teléfono",
            ocupacion:
              userData.ocupacion ||
              (type === "atleta" ? userData.deporte : "Sin especificar"),
            foto: userData.foto,
            type: type,
            ...userData,
          });
        } else {
          setMessage({ type: "error", text: "Usuario no encontrado" });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ type: "error", text: "Error al cargar datos del usuario" });
    }
  }, [id]);

  const loadUserPackages = useCallback(async () => {
    try {
      const result = await getUserPackages(id);
      if (result.success && Array.isArray(result.packages)) {
        setUserPackages(result.packages);
      } else {
        setUserPackages([]);
      }
    } catch (error) {
      console.error("Error loading user packages:", error);
      setUserPackages([]);
    }
  }, [id]);

  const loadUpcomingAppointments = useCallback(async () => {
    try {
      let appointments = [];

      // Cargar de la colección principal 'consultas'
      const consultasRef = collection(db, "consultas");
      const consultasQuery = query(
        consultasRef,
        where("clienteId", "==", id),
        orderBy("createdAt", "desc"),
        limit(10),
      );
      const consultasSnapshot = await getDocs(consultasQuery);
      const consultasData = consultasSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Asegurar que el tipo se detecte correctamente
          type: data.type || "normal", // Si no tiene type, es consulta normal
          source: "consultas",
        };
      });

      appointments = [...consultasData];

      // También intentar cargar de 'consultasNormales' por si hay datos ahí
      try {
        const consultasNormalesRef = collection(db, "consultasNormales");
        const consultasNormalesQuery = query(
          consultasNormalesRef,
          where("clienteId", "==", id),
          orderBy("createdAt", "desc"),
          limit(10),
        );
        const consultasNormalesSnapshot = await getDocs(consultasNormalesQuery);
        const consultasNormalesData = consultasNormalesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "normal",
            source: "consultasNormales",
          }),
        );
        appointments = [...appointments, ...consultasNormalesData];
      } catch (error) {
        console.log("No hay colección consultasNormales o no se puede acceder");
      }

      // También intentar cargar de 'consultasAtleta' por si hay datos ahí
      try {
        const consultasAtletaRef = collection(db, "consultasAtleta");
        const consultasAtletaQuery = query(
          consultasAtletaRef,
          where("clienteId", "==", id),
          orderBy("createdAt", "desc"),
          limit(10),
        );
        const consultasAtletaSnapshot = await getDocs(consultasAtletaQuery);
        const consultasAtletaData = consultasAtletaSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "atleta",
          source: "consultasAtleta",
        }));
        appointments = [...appointments, ...consultasAtletaData];
      } catch (error) {
        console.log("No hay colección consultasAtleta o no se puede acceder");
      }

      // Ordenar por fecha de creación y limitar a 5
      appointments.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });

      appointments = appointments.slice(0, 5);

      console.log("📋 Todas las consultas cargadas:", appointments);
      setUpcomingAppointments(appointments);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setUpcomingAppointments([]);
    }
  }, [id]);

  const loadUserActivities = useCallback(async () => {
    try {
      if (!userType) return;

      const userCollection = userType === "cliente" ? "clientes" : "atletas";
      const activitiesRef = collection(
        db,
        userCollection,
        id,
        "clasesAsignadas",
      );
      const activitiesQuery = query(
        activitiesRef,
        orderBy("fechaAsignacion", "desc"),
        limit(10),
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);

      // Obtener detalles completos de cada clase
      const activitiesWithDetails = await Promise.all(
        activitiesSnapshot.docs.map(async (activityDoc) => {
          const activityData = activityDoc.data();

          // Obtener la información de la clase
          if (activityData.idClase) {
            const classRef = doc(db, "clases", activityData.idClase);
            const classDoc = await getDoc(classRef);

            if (classDoc.exists()) {
              const classData = classDoc.data();
              return {
                id: activityDoc.id,
                classId: activityData.idClase,
                ...activityData,
                classData: classData,
              };
            }
          }

          return {
            id: activityDoc.id,
            ...activityData,
          };
        }),
      );

      console.log("📅 Actividades cargadas:", activitiesWithDetails);
      setUserActivities(
        activitiesWithDetails.filter((activity) => activity.classData),
      );
    } catch (error) {
      console.error("Error loading user activities:", error);
      setUserActivities([]);
    }
  }, [id, userType]);

  const loadRecentAccesos = useCallback(async () => {
    try {
      const accesosRef = collection(db, "accesos");
      let snap;
      try {
        const q = query(
          accesosRef,
          where("userId", "==", id),
          orderBy("timestamp", "desc"),
          limit(3),
        );
        snap = await getDocs(q);
      } catch {
        const q2 = query(accesosRef, where("userId", "==", id));
        snap = await getDocs(q2);
      }
      const accesos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      accesos.sort((a, b) => {
        const ta = a.timestamp?.toDate?.()?.getTime() || 0;
        const tb = b.timestamp?.toDate?.()?.getTime() || 0;
        return tb - ta;
      });
      setRecentAccesos(accesos.slice(0, 3));
    } catch {
      setRecentAccesos([]);
    }
  }, [id]);

  const loadConsultasRapidas = useCallback(async () => {
    try {
      const response = await fetch(`/api/clientes/${id}/consulta-rapida`);
      const result = await response.json();

      if (result.success && Array.isArray(result.consultas)) {
        console.log("📋 Consultas rápidas cargadas:", result.consultas);
        setConsultasRapidas(result.consultas);
      } else {
        setConsultasRapidas([]);
      }
    } catch (error) {
      console.error("Error loading consultas rápidas:", error);
      setConsultasRapidas([]);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadUserData(),
        loadUserPackages(),
        loadUpcomingAppointments(),
        loadConsultasRapidas(),
        loadRecentAccesos(),
      ]);
      setLoading(false);
    };

    loadAllData();
  }, [
    id,
    loadUserData,
    loadUserPackages,
    loadUpcomingAppointments,
    loadConsultasRapidas,
    loadRecentAccesos,
  ]);

  // Cargar actividades cuando userType esté disponible
  useEffect(() => {
    if (userType && id) {
      loadUserActivities();
    }
  }, [userType, id, loadUserActivities]);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "Fecha no disponible";
    return timestamp.toDate().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-cyan-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-gray-300" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">
            Usuario no encontrado
          </h1>
          <p className="text-sm text-gray-400 mb-4">
            El usuario solicitado no existe
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const detailFields = [
    {
      label: "Tel. Emergencia",
      value: user?.telefonoEmergencia || "Sin teléfono",
    },
    user?.nombreContactoEmergencia && {
      label: "Contacto Emergencia",
      value: user.nombreContactoEmergencia,
    },
    {
      label: "Nacimiento",
      value: user?.fechaNacimiento
        ? `${new Date(user.fechaNacimiento).toLocaleDateString("es-ES")}${calculateAge(user.fechaNacimiento) ? ` · ${calculateAge(user.fechaNacimiento)} años` : ""}`
        : "Sin fecha",
    },
    { label: "Género", value: user?.genero || "Sin especificar" },
    {
      label: "Lado Dominante",
      value: user?.ladoDominante || "Sin especificar",
    },
    user?.ocupacion &&
      user.type === "cliente" && { label: "Ocupación", value: user.ocupacion },
    user?.deporte &&
      user.type === "atleta" && { label: "Deporte", value: user.deporte },
    user?.categoria &&
      user.type === "atleta" && { label: "Categoría", value: user.categoria },
    user?.plataformaFitness && {
      label: "Plataforma Fitness",
      value: user.plataformaFitness,
    },
    { label: "Personal a Cargo", value: user?.responsable || "Sin asignar" },
  ].filter(Boolean);

  const quickActions = [
    {
      icon: faNoteSticky,
      label: "Notas",
      action: "notas",
      accent: "amber",
    },
    {
      icon: faCalendar,
      label: "Agendar",
      href: `/clientes/${id}/clases/agendar`,
      accent: "cyan",
    },
    {
      icon: faCalendarCheck,
      label: "Actividades",
      href: `/clientes/${id}/historial-actividades`,
      accent: "emerald",
    },
    {
      icon: faFileText,
      label: "Notas Clínicas",
      href: `/clientes/${id}/notas-clinicas`,
      accent: "teal",
    },
    {
      icon: faBox,
      label: "Paquetes",
      href: `/clientes/${id}/paquetes`,
      accent: "violet",
    },
    {
      icon: faAward,
      label: "Pasaporte",
      href: `/clientes/${id}/pasaporte`,
      accent: "amber",
    },
    {
      icon: faEdit,
      label: "Editar",
      href: `/clientes/${id}/editar`,
      accent: "blue",
    },
    {
      icon: faTrashAlt,
      label: "Borrar",
      action: "borrar",
      accent: "red",
    },
  ];

  const accentMap = {
    cyan: "bg-cyan-50 text-cyan-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    teal: "bg-teal-50 text-teal-600",
    violet: "bg-violet-50 text-violet-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <>
      {message.text && (
        <div
          className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          {message.text}
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* ── HERO ── */}
        <div className="rounded-2xl overflow-hidden border border-gray-100">
          {/* Top: identity bar */}
          <div className="relative bg-linear-to-br from-slate-800 via-slate-900 to-cyan-900 px-6 py-5">
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {user.foto ? (
                  <img
                    src={user.foto}
                    alt={user.name}
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/20 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-linear-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xl font-medium shadow-lg ring-2 ring-white/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-500 text-white shadow border border-slate-900">
                  {user.type === "cliente" ? "CLI" : "ATL"}
                </span>
              </div>

              {/* Name + contact shortcuts */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-semibold text-white tracking-tight">
                    {user.name}
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${user.status === "active" ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"}`}
                  >
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-white/60">
                  <span className="truncate max-w-[220px]">
                    {user?.email || "Sin email"}
                  </span>
                  <span className="w-px h-3 bg-white/20" />
                  <span>
                    {user?.telefonoContacto || user?.telefono || "Sin teléfono"}
                  </span>
                  {user.ocupacion && (
                    <>
                      <span className="w-px h-3 bg-white/20" />
                      <span>{user.ocupacion}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {user.genero && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/10 text-white/60">
                      {user.genero}
                    </span>
                  )}
                  {getSucursalesNames(user).map((nombre, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-500/15 text-cyan-300/80 ring-1 ring-cyan-500/20 flex items-center gap-1"
                    >
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="w-2.5 h-2.5"
                      />
                      {nombre}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/clientes/${id}/editar`)}
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all border border-white/10 hover:border-white/25 backdrop-blur-sm self-start md:self-center"
              >
                Editar Perfil
              </button>
            </div>
          </div>

          {/* Bottom: detail fields on light bg */}
          <div className="bg-gray-50/80 px-6 py-4">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {detailFields.map((f, i) => (
                <div key={i} className="min-w-[140px]">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                    {f.label}
                  </p>
                  <p className="text-sm text-gray-800 font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                if (action.action === 'notas') {
                  setIsNotasPanelOpen(true);
                } else if (action.action === 'borrar') {
                  setIsDeleteModalOpen(true);
                } else if (action.href) {
                  router.push(action.href);
                }
              }}
              className="group flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all duration-200 text-left"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${accentMap[action.accent]}`}
              >
                <FontAwesomeIcon icon={action.icon} className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 whitespace-nowrap">
                {action.label}
              </span>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="w-3 h-3 text-gray-300 group-hover:text-teal-600 transition-colors ml-1"
              />
            </button>
          ))}
        </div>

        {/* ── DATA GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Paquetes / Planes */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col group/card hover:border-gray-200 transition-colors">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faBox}
                    className="w-3 h-3 text-violet-600"
                  />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Paquetes / Planes
                </h2>
              </div>
              {userPackages.length > 0 && (
                <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {userPackages.length}
                </span>
              )}
            </div>
            <div className="px-4 pb-3 flex-1">
              {!Array.isArray(userPackages) || userPackages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon
                      icon={faBox}
                      className="w-4 h-4 text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Sin paquetes asignados
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {userPackages.slice(0, 3).map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {pkg.nombre}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatDate(pkg.fechaAsignacion)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums ml-3">
                        ${pkg.precioFinal || pkg.precioOriginal}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {userPackages.length > 0 && (
              <button
                onClick={() => router.push(`/clientes/${id}/paquetes`)}
                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-cyan-600 hover:bg-gray-50 border-t border-gray-50 transition-colors"
              >
                Ver todos los paquetes →
              </button>
            )}
          </div>

          {/* Evaluaciones */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col group/card hover:border-gray-200 transition-colors">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faFileText}
                    className="w-3 h-3 text-blue-600"
                  />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Evaluaciones
                </h2>
              </div>
              {upcomingAppointments.length > 0 && (
                <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {upcomingAppointments.length}
                </span>
              )}
            </div>
            <div className="px-4 pb-3 flex-1">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="w-4 h-4 text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Sin evaluaciones registradas
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {upcomingAppointments.map((appt) => (
                    <button
                      key={appt.id}
                      onClick={() => {
                        if (appt.status === "completed") {
                          router.push(`/clientes/${id}/historial/${appt.id}`);
                        } else if (appt.type === "atleta") {
                          router.push(
                            `/clientes/${id}/citas-deportivas?draftId=${appt.id}`,
                          );
                        } else {
                          router.push(
                            `/clientes/${id}/citas?draftId=${appt.id}`,
                          );
                        }
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FontAwesomeIcon
                          icon={
                            appt.type === "atleta" ? faChartLine : faCalendar
                          }
                          className={`w-3 h-3 shrink-0 ${appt.type === "atleta" ? "text-orange-400" : "text-blue-400"}`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm">
                            {appt.type === "atleta"
                              ? "Ficha Atleta"
                              : "Ficha Paciente"}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDate(appt.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${appt.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          {appt.status === "completed"
                            ? "Completada"
                            : "Borrador"}
                        </span>
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="w-2.5 h-2.5 text-gray-300 group-hover:text-blue-400 transition-colors"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {upcomingAppointments.length > 0 && (
              <button
                onClick={() => router.push(`/clientes/${id}/historial`)}
                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-cyan-600 hover:bg-gray-50 border-t border-gray-50 transition-colors"
              >
                Ver todas las evaluaciones →
              </button>
            )}
          </div>

          {/* Actividades */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col group/card hover:border-gray-200 transition-colors">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faPersonRunning}
                    className="w-3 h-3 text-cyan-600"
                  />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Actividades
                </h2>
              </div>
              <button
                onClick={() => router.push(`/clientes/${id}/clases/agendar`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Agendar
              </button>
            </div>
            <div className="px-4 pb-3 flex-1">
              {userActivities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="w-4 h-4 text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Sin actividades programadas
                  </p>
                </div>
              ) : (
                userActivities.slice(0, 3).map((activity) => {
                    const cd = activity.classData;
                    const isRecurrente = cd?.modoProgramacion === 'recurrente';
                    const specificDate = activity.fechaEspecifica || cd?.fechaEspecifica || (cd?.fechasEspecificas?.[0]?.fecha);
                    const specificTime = activity.horaEspecifica || cd?.horaEspecifica || (cd?.fechasEspecificas?.[0]?.hora) || cd?.horaInicio;

                    return (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {cd?.nombre || "Actividad sin nombre"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isRecurrente && cd?.diasSemana?.length > 0 ? (
                              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">
                                {cd.diasSemana.join(", ")}
                              </span>
                            ) : specificDate ? (
                              <span className="text-[11px] text-cyan-600 font-bold uppercase tracking-widest">
                                {(() => {
                                  const [y, m, d] = specificDate.split('-');
                                  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                                })()}
                              </span>
                            ) : null}
                            
                            {specificTime && (
                              <span className="text-[11px] text-gray-400 font-medium">
                                · {specificTime} hrs
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shrink-0 ml-2 ${activity.estado === "activa" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-500"}`}
                        >
                          {activity.estado === "activa"
                            ? "Activa"
                            : activity.estado}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
            {userActivities.length > 0 && (
              <button
                onClick={() =>
                  router.push(`/clientes/${id}/historial-actividades`)
                }
                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-cyan-600 hover:bg-gray-50 border-t border-gray-50 transition-colors"
              >
                Ver historial completo →
              </button>
            )}
          </div>

          {/* Accesos */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col group/card hover:border-gray-200 transition-colors">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faDoorOpen}
                    className="w-3 h-3 text-emerald-600"
                  />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Accesos</h2>
              </div>
              {recentAccesos.length > 0 && (
                <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {recentAccesos.length}
                </span>
              )}
            </div>
            <div className="px-4 pb-3 flex-1">
              {recentAccesos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                    <FontAwesomeIcon
                      icon={faDoorOpen}
                      className="w-4 h-4 text-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Sin accesos registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentAccesos.map((acceso) => {
                    const ts = acceso.timestamp?.toDate?.() || null;
                    const dateStr = ts
                      ? ts.toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
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
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm capitalize">
                            {dateStr}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faClock}
                                className="w-2.5 h-2.5"
                              />{" "}
                              {timeStr}
                            </span>
                            {acceso.sucursalNombre && (
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <FontAwesomeIcon
                                  icon={faLocationDot}
                                  className="w-2.5 h-2.5"
                                />{" "}
                                {acceso.sucursalNombre}
                              </span>
                            )}
                          </div>
                        </div>
                        {acceso.registradoPor && (
                          <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                            {acceso.registradoPor}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {recentAccesos.length > 0 && (
              <button
                onClick={() => router.push(`/clientes/${id}/historial-acceso`)}
                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-cyan-600 hover:bg-gray-50 border-t border-gray-50 transition-colors"
              >
                Ver historial completo →
              </button>
            )}
          </div>
        </div>

        {/* ── CONSULTAS RAPIDAS ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faFileText}
                  className="w-3 h-3 text-teal-600"
                />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Consultas Rápidas
              </h2>
            </div>
            <button
              onClick={() => router.push(`/clientes/${id}/consulta-rapida`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Nueva
              consulta
            </button>
          </div>

          <div className="px-4 pb-3">
            {consultasRapidas.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                  <FontAwesomeIcon
                    icon={faFileText}
                    className="w-4 h-4 text-gray-300"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  No hay consultas rápidas
                </p>
                <button
                  onClick={() => router.push(`/clientes/${id}/consulta-rapida`)}
                  className="mt-3 text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  Crear primera consulta →
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {consultasRapidas.slice(0, 5).map((consulta) => (
                  <div key={consulta.id} className="flex items-center group">
                    <button
                      onClick={() =>
                        router.push(
                          `/clientes/${id}/consulta-rapida?consultaId=${consulta.id}`,
                        )
                      }
                      className="flex-1 flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FontAwesomeIcon
                          icon={faFileText}
                          className="w-3 h-3 text-teal-500 shrink-0"
                        />
                        <span className="font-medium text-gray-800 text-sm">
                          Consulta Rápida
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[11px] text-gray-400">
                          {consulta.fechaEvaluacion
                            ? (() => {
                                const [year, month, day] =
                                  consulta.fechaEvaluacion.split("-");
                                return new Date(
                                  year,
                                  month - 1,
                                  day,
                                ).toLocaleDateString("es-MX");
                              })()
                            : "N/A"}
                        </span>
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="w-2.5 h-2.5 text-gray-300 group-hover:text-teal-400 transition-colors"
                        />
                      </div>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "¿Estás seguro de que deseas eliminar esta consulta rápida?",
                          )
                        ) {
                          try {
                            const response = await fetch(
                              `/api/clientes/${id}/consulta-rapida`,
                              {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  consultaId: consulta.id,
                                }),
                              },
                            );
                            const result = await response.json();
                            if (result.success) {
                              loadConsultasRapidas();
                            } else {
                              alert("Error al eliminar la consulta");
                            }
                          } catch (error) {
                            console.error("Error:", error);
                            alert("Error al eliminar la consulta");
                          }
                        }
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 ml-1"
                      title="Eliminar consulta"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {consultasRapidas.length > 5 && (
                  <p className="text-center text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                    Mostrando 5 de {consultasRapidas.length}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <NotasSidePanel
        isOpen={isNotasPanelOpen}
        onClose={() => setIsNotasPanelOpen(false)}
        cliente={user}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteMember}
        cliente={user}
        isDeleting={isDeleting}
      />
    </>
  );
}

// Proteger la ruta - requiere permiso 'clientes'
// Roles permitidos: admin, medico, asistente
export default UserProfilePage;
