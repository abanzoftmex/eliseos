import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarDay,
  faClock,
  faUsers,
  faMapMarkerAlt,
  faEdit,
  faTrash,
  faEye,
  faDollarSign,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import useSucursalStore from "../../store/sucursalStore";

const DayActivitiesSidePanel = ({
  isOpen,
  onClose,
  selectedDate,
  allClasses,
  onEdit,
  onDelete,
  onView,
  deletingClasses = new Set(),
}) => {
  const router = useRouter();
  const sucursales = useSucursalStore((state) => state.sucursales);

  // Mapeo de días de la semana en español a número (0=Domingo, 1=Lunes, etc.)
  const diasSemanaMap = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  // Obtener las clases del día seleccionado
  const dayClasses = useMemo(() => {
    if (!selectedDate || !allClasses) return [];

    const dayOfWeek = selectedDate.getDay();
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const filteredClasses = allClasses.filter((clase) => {
      // 1. Clases recurrentes (grupales) - verificar día de la semana
      if (clase.diasSemana && clase.diasSemana.length > 0) {
        const isRecurring = clase.diasSemana.some((dia) => {
          const diaNumero = diasSemanaMap[dia.toLowerCase()];
          return diaNumero === dayOfWeek;
        });
        if (isRecurring) return true;
      }

      // 2. Clases de fecha específica (sesión y personalizada)
      if (clase.fechaEspecifica) {
        let claseDate;
        if (clase.fechaEspecifica.includes("T")) {
          const d = new Date(clase.fechaEspecifica);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dy = String(d.getDate()).padStart(2, "0");
          claseDate = `${y}-${m}-${dy}`;
        } else {
          claseDate = clase.fechaEspecifica;
        }
        return claseDate === dateString;
      }

      return false;
    });

    return filteredClasses.sort((a, b) => {
      const timeA = a.horaInicio || a.horaEspecifica || "00:00";
      const timeB = b.horaInicio || b.horaEspecifica || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [selectedDate, allClasses]);

  const getSucursalName = (sucursalId) => {
    if (!sucursalId) return "Sin sucursal";
    const sucursal = sucursales.find((s) => s.id === sucursalId);
    return sucursal ? sucursal.name : sucursalId;
  };

  const getTypeColor = (type) => {
    const colors = {
      grupal: "bg-blue-100 text-blue-700 border-blue-200",
      personalizado: "bg-purple-100 text-purple-700 border-purple-200",
      sesion: "bg-green-100 text-green-700 border-green-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getTypeLabel = (type) => {
    const labels = {
      grupal: "Grupal",
      personalizado: "Personalizado",
      sesion: "Sesión",
    };
    return labels[type] || type;
  };

  const formatTime = (time) => {
    if (!time) return "Sin hora";
    return time.substring(0, 5); // HH:MM
  };

  const formatPrice = (price) => {
    if (!price) return "Gratis";
    return `$${price.toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50  transition-opacity backdrop-blur-xs"
        style={{ zIndex: 999 }}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-cyan-100">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faCalendarDay}
              className="w-6 h-6 text-cyan-600"
            />
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Actividades del día
              </h2>
              {selectedDate && (
                <p className="text-sm text-gray-600">
                  {selectedDate.toLocaleDateString("es-MX", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {dayClasses.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon
                icon={faCalendarDay}
                className="w-12 h-12 text-gray-300 mb-4"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay actividades
              </h3>
              <p className="text-gray-500">
                No hay actividades programadas para este día.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  {dayClasses.length} actividad
                  {dayClasses.length !== 1 ? "es" : ""} programada
                  {dayClasses.length !== 1 ? "s" : ""}
                </h3>
              </div>

              {dayClasses.map((clase) => (
                <div
                  key={clase.id}
                  className={`p-4 rounded-lg border-l-4 ${getTypeColor(clase.tipo)} hover:shadow-md transition-shadow`}
                >
                  {/* Header de la actividad */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(clase.tipo)}`}
                        >
                          {getTypeLabel(clase.tipo)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                        {clase.nombre}
                      </h4>
                    </div>
                  </div>

                  {/* Información de la actividad */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="w-3 h-3 text-gray-400"
                      />
                      <span className="font-medium">
                        {formatTime(clase.horaInicio || clase.horaEspecifica)}
                      </span>
                      {clase.duracion && (
                        <span className="text-gray-500">
                          ({clase.duracion} min)
                        </span>
                      )}
                    </div>

                    {clase.instructor && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="w-3 h-3 text-gray-400"
                        />
                        <span>{clase.instructor}</span>
                      </div>
                    )}

                    {clase.ubicacion && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          className="w-3 h-3 text-gray-400"
                        />
                        <span>{clase.ubicacion}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="w-3 h-3 text-emerald-400"
                      />
                      <span className="text-emerald-600 font-medium">
                        {getSucursalName(clase.sucursal)}
                      </span>
                    </div>

                    {clase.tipo === "grupal" && clase.maxParticipantes && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="w-3 h-3 text-gray-400"
                        />
                        <span>Max: {clase.maxParticipantes} personas</span>
                      </div>
                    )}

                    {clase.precio && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FontAwesomeIcon
                          icon={faDollarSign}
                          className="w-3 h-3 text-gray-400"
                        />
                        <span className="font-medium text-cyan-600">
                          {formatPrice(clase.precio)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  {clase.descripcion && (
                    <div className="mb-4 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {clase.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView && onView(clase)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition-colors text-xs font-medium"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                      Ver
                    </button>
                    <button
                      onClick={() => onEdit && onEdit(clase)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                    >
                      <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(clase)}
                      disabled={deletingClasses.has(clase.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingClasses.has(clase.id) ? (
                        <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                      )}
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DayActivitiesSidePanel;
