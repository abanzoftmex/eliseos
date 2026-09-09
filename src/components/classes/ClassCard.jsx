import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUsers, faMapMarkerAlt, faEdit, faTrash as faTrash2, faCalendar, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const ClassCard = ({ 
  clase, 
  onEdit, 
  onDelete, 
  onView, 
  isDeleting = false, 
  compact = false 
}) => {
  const getTypeColor = (type) => {
    const colors = {
      grupal: 'bg-blue-100 text-blue-700 border-blue-200',
      personalizado: 'bg-purple-100 text-purple-700 border-purple-200',
      sesion: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
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

  const formatSpecificDates = (fechasEspecificas) => {
    if (!fechasEspecificas || fechasEspecificas.length === 0) return '';
    if (fechasEspecificas.length === 1) {
      const fecha = new Date(fechasEspecificas[0].fecha + 'T00:00:00');
      const fechaStr = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      return `${fechaStr} a las ${formatTime(fechasEspecificas[0].hora)}`;
    }
    return `${fechasEspecificas.length} fechas programadas`;
  };

  const getScheduleInfo = () => {
    // Modo recurrente
    if (clase.modoProgramacion === 'recurrente' && clase.diasSemana && clase.diasSemana.length > 0) {
      return {
        type: 'recurrente',
        days: formatDays(clase.diasSemana),
        time: formatTime(clase.horaInicio)
      };
    }
    // Modo específico
    if (clase.modoProgramacion === 'especifica' && clase.fechasEspecificas && clase.fechasEspecificas.length > 0) {
      return {
        type: 'especifica',
        dates: formatSpecificDates(clase.fechasEspecificas)
      };
    }
    // Compatibilidad con formato antiguo
    if (clase.diasSemana && clase.diasSemana.length > 0) {
      return {
        type: 'recurrente',
        days: formatDays(clase.diasSemana),
        time: formatTime(clase.horaInicio)
      };
    }
    return null;
  };

  // Vista compacta para calendario con efecto hover
  if (compact) {
    const scheduleInfo = getScheduleInfo();
    
    return (
      <div
        className={`group relative p-2 rounded-lg border-l-4 cursor-pointer transition-all duration-200 ${getTypeColor(clase.tipo)} hover:shadow-xl hover:z-50`}
        onClick={() => onView && onView(clase)}
      >
        {/* Vista compacta (predeterminada) */}
        <div className="group-hover:hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/50 truncate">
              {getTypeLabel(clase.tipo)}
            </span>
          </div>
          
          <h3 className="font-semibold text-gray-800 text-[11px] leading-tight line-clamp-2 mb-1">
            {clase.nombre}
          </h3>
          
          {scheduleInfo && scheduleInfo.type === 'recurrente' && scheduleInfo.time && (
            <div className="flex items-center gap-1 text-gray-600">
              <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium">{scheduleInfo.time}</span>
            </div>
          )}
          {scheduleInfo && scheduleInfo.type === 'especifica' && (
            <div className="flex items-center gap-1 text-gray-600">
              <FontAwesomeIcon icon={faCalendar} className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium truncate">{scheduleInfo.dates}</span>
            </div>
          )}
        </div>

        {/* Vista expandida (hover) */}
        <div className="hidden group-hover:block">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
              {getTypeLabel(clase.tipo)}
            </span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(clase);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(clase);
                }}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTrash2} className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <h3 className="font-semibold text-gray-800 text-sm mb-2">
            {clase.nombre}
          </h3>
          
          <div className="space-y-1.5 text-gray-600 text-xs">
            {scheduleInfo && scheduleInfo.type === 'recurrente' && (
              <>
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                  <span>{scheduleInfo.days}</span>
                </div>
                {scheduleInfo.time && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    <span className="font-medium">{scheduleInfo.time}</span>
                    {clase.duracion && <span className="text-gray-500">({clase.duracion} min)</span>}
                  </div>
                )}
              </>
            )}
            {scheduleInfo && scheduleInfo.type === 'especifica' && (
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                <span className="font-medium">{scheduleInfo.dates}</span>
              </div>
            )}
            
            {clase.ubicacion && (
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                <span className="truncate">{clase.ubicacion}</span>
              </div>
            )}
            
            {clase.tipo === 'grupal' && clase.maxParticipantes && (
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                <span>Max: {clase.maxParticipantes}</span>
              </div>
            )}
            
            {clase.instructor && (
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                <span className="truncate">{clase.instructor}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista normal (lista)
  const scheduleInfo = getScheduleInfo();
  
  return (
    <div
      className="p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onView && onView(clase)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium px-2 py-1 rounded-full bg-white/50 text-xs">
          {getTypeLabel(clase.tipo)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(clase);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(clase);
            }}
            disabled={isDeleting}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTrash2} className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 text-sm">
        {clase.nombre}
      </h3>
      
      <div className="space-y-1 text-gray-600 text-xs">
        {scheduleInfo && scheduleInfo.type === 'recurrente' && (
          <>
            <div className="flex items-center gap-1">
              <FontAwesomeIcon icon={faCalendar} className="w-2.5 h-2.5" />
              <span className="truncate">{scheduleInfo.days}</span>
            </div>
            {scheduleInfo.time && (
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5" />
                <span>{scheduleInfo.time}</span>
                {clase.duracion && <span className="text-gray-500">({clase.duracion} min)</span>}
              </div>
            )}
          </>
        )}
        {scheduleInfo && scheduleInfo.type === 'especifica' && (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faCalendar} className="w-2.5 h-2.5" />
            <span className="truncate">{scheduleInfo.dates}</span>
          </div>
        )}
        
        {clase.ubicacion && (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-2.5 h-2.5" />
            <span className="truncate">{clase.ubicacion}</span>
          </div>
        )}
        
        {clase.tipo === 'grupal' && clase.maxParticipantes && (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faUsers} className="w-2.5 h-2.5" />
            <span>Max: {clase.maxParticipantes}</span>
          </div>
        )}
        
        {clase.instructor && (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faUsers} className="w-2.5 h-2.5" />
            <span className="truncate">{clase.instructor}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassCard;