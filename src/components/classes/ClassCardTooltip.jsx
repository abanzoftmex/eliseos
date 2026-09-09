import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUsers, faMapMarkerAlt, faEdit, faTrash as faTrash2, faCalendar, faEye } from '@fortawesome/free-solid-svg-icons';

const ClassCardTooltip = ({
  clase,
  onEdit,
  onDelete,
  onView,
  onViewParticipants,
  onShowDayActivities, // Nueva prop para mostrar actividades del día
  isDeleting = false,
  tooltipPosition = 'right', // 'right' o 'left'
  sucursalName = null,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200); // Delay de 200ms antes de ocultar
  };

  const getTypeColor = (type) => {
    const colors = {
      grupal: 'bg-blue-200 text-blue-800 border-blue-300',
      personalizado: 'bg-purple-200 text-purple-800 border-purple-300',
      sesion: 'bg-green-200 text-green-800 border-green-300'
    };
    return colors[type] || 'bg-gray-200 text-gray-800 border-gray-300';
  };

  const getTypeLabel = (type) => {
    const labels = {
      grupal: 'Grupal',
      personalizado: 'Personalizado',
      sesion: 'Sesión'
    };
    return labels[type] || type;
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const formatDays = (diasSemana) => {
    if (!diasSemana || diasSemana.length === 0) return '';
    const diasMap = {
      'lunes': 'Lun',
      'martes': 'Mar',
      'miercoles': 'Mié',
      'jueves': 'Jue',
      'viernes': 'Vie',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };
    return diasSemana.map(dia => diasMap[dia] || dia).join(', ');
  };

  return (
    <div
      className="relative"
      style={{ zIndex: showTooltip ? 50 : 'auto' }}
    >
      {/* Card compacto */}
      <div
        className={`p-2 rounded-lg border-l-4 cursor-pointer transition-all duration-200 ${getTypeColor(clase.tipo)} hover:shadow-lg active:scale-95`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          if (onShowDayActivities) onShowDayActivities(clase);
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 truncate shadow-sm">
            {getTypeLabel(clase.tipo)}
          </span>
        </div>
        
        <h3 className="font-bold text-gray-900 text-xs leading-tight line-clamp-2 mb-1">
          {clase.nombre}
        </h3>
        
        {(clase.horaInicio || clase.horaEspecifica) && (
          <div className="flex items-center gap-1 text-gray-700">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            <span className="text-xs font-semibold">{formatTime(clase.horaInicio || clase.horaEspecifica)}</span>
          </div>
        )}
        {sucursalName && (
          <div className="text-[10px] text-gray-600 truncate mt-0.5 font-medium">{sucursalName}</div>
        )}
      </div>

      {/* Tooltip flotante */}
      {showTooltip && (
        <>
          {/* Área invisible entre card y tooltip para facilitar el hover */}
          <div 
            className={`absolute ${tooltipPosition === 'right' ? 'left-full' : 'right-full'} top-0 w-3 h-full z-[99]`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          
          <div 
            className={`absolute ${tooltipPosition === 'right' ? 'left-full ml-3' : 'right-full mr-3'} top-0 z-[100] w-64 bg-white rounded-lg shadow-2xl border border-gray-200 p-4`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Flecha del tooltip */}
            {tooltipPosition === 'right' ? (
              <div className="absolute right-full top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
            ) : (
              <div className="absolute left-full top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-white"></div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(clase.tipo)}`}>
                {getTypeLabel(clase.tipo)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(clase);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(clase);
                  }}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <FontAwesomeIcon icon={faTrash2} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-800 text-base mb-3">
              {clase.nombre}
            </h3>

            {/* Botón de Ver Participantes */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewParticipants && onViewParticipants(clase);
              }}
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition-colors font-medium text-sm border border-cyan-200"
            >
              <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
              <span>Ver Participantes</span>
            </button>
            
            <div className="space-y-2 text-gray-600 text-sm">
              {clase.diasSemana && clase.diasSemana.length > 0 && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDays(clase.diasSemana)}</span>
                </div>
              )}
              
              {clase.horaInicio && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{formatTime(clase.horaInicio)}</span>
                  {clase.duracion && <span className="text-gray-500">({clase.duracion} min)</span>}
                </div>
              )}
              
              {clase.ubicacion && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5 text-gray-400" />
                  <span>{clase.ubicacion}</span>
                </div>
              )}
              
              {clase.tipo === 'grupal' && clase.maxParticipantes && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-gray-400 w-3.5 h-3.5" />
                  <span>Max: {clase.maxParticipantes} personas</span>
                </div>
              )}
              
              {clase.instructor && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-gray-400 w-3.5 h-3.5" />
                  <span>{clase.instructor}</span>
                </div>
              )}
            </div>

            {clase.descripcion && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 line-clamp-3">{clase.descripcion}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassCardTooltip;
