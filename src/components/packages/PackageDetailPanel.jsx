import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes as faX, 
  faBox as faPackage, 
  faCalendar, 
  faCreditCard, 
  faUsers, 
  faFileText, 
  faCheckCircle, 
  faTimesCircle as faXCircle, 
  faPencil, 
  faCheck, 
  faSpinner as faLoader2 
} from '@fortawesome/free-solid-svg-icons';

const PackageDetailPanel = ({ isOpen, onClose, packageData, userId, onPackageUpdated }) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editedDate, setEditedDate] = useState('');
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el panel está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset estados cuando se abre/cierra el panel o cambia el paquete
  useEffect(() => {
    if (isOpen && packageData) {
      setIsEditingDate(false);
      setSaveMessage({ type: '', text: '' });
      // Inicializar la fecha editada con el valor actual
      if (packageData.fechaAsignacion) {
        const date = getDateValue(packageData.fechaAsignacion);
        setEditedDate(date);
      }
    }
  }, [isOpen, packageData]);

  if (!isOpen || !packageData) return null;

  // Debug: Ver qué datos estamos recibiendo
  console.log('PackageDetailPanel - packageData:', packageData);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    // Si es un Timestamp de Firebase con método toDate
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Si es una cadena ISO o un objeto Date
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Fecha no disponible';
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Convertir timestamp a formato YYYY-MM-DD para el input date
  const getDateValue = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) return '';
      
      // Formatear como YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  // Guardar la nueva fecha de asignación
  const handleSaveDate = async () => {
    if (!editedDate || !userId || !packageData.id) {
      setSaveMessage({ type: 'error', text: 'Datos incompletos para actualizar' });
      return;
    }

    setIsSavingDate(true);
    setSaveMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/clientes/${userId}/paquetes/${packageData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaAsignacion: editedDate
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Fecha actualizada correctamente' });
        setIsEditingDate(false);
        // Notificar al componente padre para recargar los datos
        if (onPackageUpdated) {
          onPackageUpdated();
        }
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Error al actualizar' });
      }
    } catch (error) {
      console.error('Error updating date:', error);
      setSaveMessage({ type: 'error', text: 'Error al actualizar la fecha' });
    } finally {
      setIsSavingDate(false);
    }
  };

  // Adaptador para manejar tanto paquetes asignados como maestros
  const adaptedData = {
    nombre: packageData.nombre || packageData.name,
    descripcion: packageData.descripcion || packageData.description,
    price: packageData.price || packageData.precioFinal || packageData.precioOriginal,
    sessionsIncluded: packageData.sessionsIncluded || packageData.numeroServicios || packageData.sessions,
    validityDays: packageData.validityDays,
    targetAudience: packageData.targetAudience || packageData.tipoUsuario,
    paymentType: packageData.paymentType,
    discounts: packageData.discounts,
    createdAt: packageData.createdAt,
    isActive: packageData.isActive ?? packageData.activo ?? true,
    // Para paquetes asignados
    precioOriginal: packageData.precioOriginal,
    precioFinal: packageData.precioFinal,
    descuento: packageData.descuento,
    descuentoNombre: packageData.descuentoNombre,
    descuentoPorcentaje: packageData.descuentoPorcentaje,
    descuentoAplicado: packageData.descuentoAplicado,
    fechaAsignacion: packageData.fechaAsignacion
  };

  const getDiscountDisplay = (data) => {
    if (!data.descuento && !data.descuentoPorcentaje) return '';
    const pct = data.descuentoPorcentaje ?? (
      data.precioOriginal && data.precioFinal && data.precioOriginal > data.precioFinal
        ? Math.round((1 - data.precioFinal / data.precioOriginal) * 10000) / 100
        : null
    );
    const name = data.descuentoNombre || data.descuento;
    if (name && pct !== null) {
      if (String(name).includes('%')) return `${name} de descuento`;
      return `${name} - ${pct}% de descuento`;
    }
    if (pct !== null) return `${pct}% de descuento`;
    return `${name} (descuento aplicado)`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Side Panel */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faPackage} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Detalles del Paquete</h2>
              <p className="text-cyan-100 text-sm">Información completa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
            title="Cerrar (Esc)"
          >
            <FontAwesomeIcon icon={faX} className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content - Scrollable con padding-bottom para el botón */}
        <div className="h-[calc(100vh-88px)] overflow-y-auto pb-20">
          <div className="p-6 space-y-6">
            {/* Nombre del Paquete */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {adaptedData.nombre || 'Sin nombre'}
              </h3>
              {adaptedData.descripcion ? (
                <p className="text-gray-600 leading-relaxed">
                  {adaptedData.descripcion}
                </p>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                  <p className="text-amber-700 text-sm flex items-start gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>Este paquete no tiene una descripción registrada. Puedes editarlo para agregar más información.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Precio */}
            <div className="bg-gradient-to-r from-cyan-50 to-cyan-50 rounded-xl p-4 border-2 border-cyan-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-semibold text-gray-700">Precio</span>
                </div>
                <div className="text-right">
                  {adaptedData.descuento && adaptedData.precioOriginal ? (
                    <>
                      <span className="text-sm text-gray-500 line-through block">
                        {formatPrice(adaptedData.precioOriginal)}
                      </span>
                      <span className="text-2xl font-bold text-cyan-600">
                        {formatPrice(adaptedData.precioFinal)}
                      </span>
                      <span className="text-xs text-cyan-700 font-medium block">
                        {getDiscountDisplay(adaptedData)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-cyan-600">
                      {formatPrice(adaptedData.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Información General */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Información General
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {/* Tipo de Usuario / Público Objetivo */}
                {adaptedData.targetAudience && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Público Objetivo</p>
                      <p className="text-sm text-gray-900 font-medium capitalize truncate">
                        {adaptedData.targetAudience}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tipo de Pago */}
                {adaptedData.paymentType && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Tipo de Pago</p>
                      <p className="text-sm text-gray-900 font-medium capitalize truncate">
                        {adaptedData.paymentType}
                      </p>
                    </div>
                  </div>
                )}

                {/* Número de Servicios/Sesiones */}
                {adaptedData.sessionsIncluded && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faFileText} className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Sesiones Incluidas</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {adaptedData.sessionsIncluded} {adaptedData.sessionsIncluded === 1 ? 'sesión' : 'sesiones'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vigencia */}
                {adaptedData.validityDays && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Vigencia</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {adaptedData.validityDays} {adaptedData.validityDays === 1 ? 'día' : 'días'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fecha de Asignación (solo paquetes asignados) */}
                {adaptedData.fechaAsignacion && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Fecha de Asignación</p>
                      {isEditingDate ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="date"
                            value={editedDate}
                            onChange={(e) => setEditedDate(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            disabled={isSavingDate}
                          />
                          <button
                            onClick={handleSaveDate}
                            disabled={isSavingDate}
                            className="p-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                            title="Guardar"
                          >
                            {isSavingDate ? (
                              <FontAwesomeIcon icon={faLoader2} className="w-4 h-4 animate-spin" />
                            ) : (
                              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingDate(false);
                              setEditedDate(getDateValue(packageData.fechaAsignacion));
                              setSaveMessage({ type: '', text: '' });
                            }}
                            disabled={isSavingDate}
                            className="p-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                            title="Cancelar"
                          >
                            <FontAwesomeIcon icon={faX} className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900 font-medium">
                            {formatDate(adaptedData.fechaAsignacion)}
                          </p>
                          {userId && (
                            <button
                              onClick={() => setIsEditingDate(true)}
                              className="p-1 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-all duration-200 hover:scale-110"
                              title="Editar fecha"
                            >
                              <FontAwesomeIcon icon={faPencil} className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mensaje de guardado */}
                {saveMessage.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    saveMessage.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {saveMessage.text}
                  </div>
                )}

                {/* Fecha de Creación (paquetes maestros o si no hay fecha de asignación) */}
                {adaptedData.createdAt && !adaptedData.fechaAsignacion && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Fecha de Creación</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {formatDate(adaptedData.createdAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estado */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {adaptedData.isActive ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <FontAwesomeIcon icon={faXCircle} className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Estado</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      adaptedData.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {adaptedData.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descuento Aplicado (solo paquetes asignados con descuento) */}
            {adaptedData.descuento && adaptedData.precioOriginal && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Descuento Aplicado
                </h4>
                <div className="bg-cyan-50 rounded-lg p-4 border-2 border-cyan-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Descuento activo en este paquete</p>
                      <p className="text-lg font-bold text-cyan-700 mt-1">
                        {getDiscountDisplay(adaptedData)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Precio original</p>
                      <p className="text-lg text-gray-600 line-through">
                        {formatPrice(adaptedData.precioOriginal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Descuentos Disponibles (paquetes maestros) */}
            {adaptedData.discounts && adaptedData.discounts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Descuentos Disponibles
                </h4>
                <div className="space-y-2">
                  {adaptedData.discounts.map((discount, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="font-medium text-gray-900">{discount.name}</span>
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-md text-sm font-semibold">
                        {discount.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer fijo con sombra superior */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default PackageDetailPanel;
