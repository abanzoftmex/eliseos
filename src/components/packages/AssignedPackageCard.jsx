import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCalendar, faTag, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import { calcularDiasRestantes, formatearDiasRestantes } from '../../utils/packageUtils';

const AssignedPackageCard = ({ 
  nombre, 
  precio, 
  precioOriginal,
  descuento, 
  descuentoPorcentaje,
  fecha, 
  onDelete, 
  packageId,
  onClick // Nueva prop para abrir el panel de detalles
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    // Si es un Timestamp de Firebase
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Si es una cadena ISO o un Date
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Fecha no disponible';
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Calcular días restantes
  const diasRestantes = calcularDiasRestantes(fecha);
  const estadoDias = formatearDiasRestantes(diasRestantes);

  return (
    <div 
      className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-2 border-cyan-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-cyan-300 relative cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-between">
        {/* Sección izquierda - Información principal */}
        <div className="flex-1 space-y-4">
          {/* Nombre del paquete */}
          <div>
            <h3 className="font-semibold text-slate-800 text-lg leading-tight">
              {nombre}
            </h3>
          </div>

          {/* Información del paquete */}
          <div className="space-y-3">
            {/* Precio */}
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-emerald-600" />
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold text-lg">
                  {formatPrice(precio)}
                </span>
                
                {/* Línea divisoria */}
                {descuento && (
                  <>
                    <div className="w-px h-4 bg-slate-300"></div>
                    
                    {/* Badge de descuento */}
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                      <FontAwesomeIcon icon={faTag} className="w-3 h-3 inline mr-1" />
                      {(() => {
                        const pct = descuentoPorcentaje ?? (
                          precioOriginal && precio && precioOriginal > precio
                            ? Math.round((1 - precio / precioOriginal) * 10000) / 100
                            : null
                        );
                        if (pct !== null && !String(descuento).includes('%')) {
                          return `${descuento} (${pct}%)`;
                        }
                        return descuento;
                      })()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Fecha de asignación */}
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-slate-400" />
              <span className="text-slate-500 text-sm">
                Asignado: {formatDate(fecha)}
              </span>
            </div>

            {/* Días restantes */}
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="w-5 h-5 text-slate-400" />
              <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${estadoDias.clase}`}>
                {estadoDias.icono} {estadoDias.texto}
              </span>
            </div>
          </div>
        </div>

        {/* Sección derecha - Acciones */}
        <div className="ml-6">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevenir que el click abra el panel
              onDelete(packageId);
            }}
            className="p-3 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
            title="Eliminar paquete"
          >
            <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignedPackageCard;