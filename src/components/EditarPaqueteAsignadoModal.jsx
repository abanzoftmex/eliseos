import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, Save } from 'lucide-react';

const EditarPaqueteAsignadoModal = ({ isOpen, onClose, assignment, onUpdate }) => {
  const [formData, setFormData] = useState({
    fechaAsignacion: '',
    descuento: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && assignment) {
      // Convertir la fecha de Timestamp a string YYYY-MM-DD
      let fechaStr = '';
      if (assignment.fechaAsignacion) {
        try {
          if (assignment.fechaAsignacion.toDate && typeof assignment.fechaAsignacion.toDate === 'function') {
            const date = assignment.fechaAsignacion.toDate();
            fechaStr = date.toISOString().split('T')[0];
          } else if (assignment.fechaAsignacion instanceof Date) {
            fechaStr = assignment.fechaAsignacion.toISOString().split('T')[0];
          } else if (typeof assignment.fechaAsignacion === 'string') {
            fechaStr = new Date(assignment.fechaAsignacion).toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error parsing date:', error);
          fechaStr = new Date().toISOString().split('T')[0];
        }
      } else {
        fechaStr = new Date().toISOString().split('T')[0];
      }

      let descuentoValue = '';
      if (assignment.descuento || assignment.descuentoPorcentaje) {
        // Si ya es un JSON, dejarlo así
        if (typeof assignment.descuento === 'string' && assignment.descuento.startsWith('{')) {
          descuentoValue = assignment.descuento;
        } else {
          // Buscar coincidencia exacta de nombre y porcentaje en discounts
          const pct = assignment.descuentoPorcentaje ?? (
            assignment.precioOriginal && assignment.precioFinal && assignment.precioOriginal > assignment.precioFinal
              ? Math.round((1 - assignment.precioFinal / assignment.precioOriginal) * 10000) / 100
              : null
          );
          const name = assignment.descuentoNombre || assignment.descuento;
          const discount = (assignment.discounts || []).find(d => 
            (pct !== null && d.percentage === pct && d.name === name) ||
            (pct !== null && d.percentage === pct) ||
            (d.name === name)
          );
          if (discount) {
            descuentoValue = JSON.stringify({ name: discount.name, percentage: discount.percentage });
          } else if (pct !== null) {
            descuentoValue = JSON.stringify({ name: name || `${pct}%`, percentage: pct });
          } else {
            descuentoValue = assignment.descuento || '';
          }
        }
      }

      setFormData({
        fechaAsignacion: fechaStr,
        descuento: descuentoValue
      });
    }
  }, [isOpen, assignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Error updating assignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getAvailableDiscounts = () => {
    return assignment.discounts || [];
  };

  const calculatePreviewPrice = () => {
    if (!formData.descuento) {
      return assignment.precioOriginal;
    }

    try {
      const discount = JSON.parse(formData.descuento);
      if (discount && discount.percentage) {
        const discountAmount = (assignment.precioOriginal * discount.percentage) / 100;
        return assignment.precioOriginal - discountAmount;
      }
    } catch (e) {
      // Si no se puede parsear, intentar buscar por nombre (retrocompatibilidad)
      const discount = getAvailableDiscounts().find(d => d.name === formData.descuento);
      if (discount) {
        const discountAmount = (assignment.precioOriginal * discount.percentage) / 100;
        return assignment.precioOriginal - discountAmount;
      }
    }

    return assignment.precioOriginal;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Editar Paquete Asignado
                  </h3>
                  <p className="text-cyan-100 text-sm">
                    {assignment.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información actual */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Información Actual
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Precio original:</span> {formatPrice(assignment.precioOriginal)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Precio actual:</span> {formatPrice(assignment.precioFinal)}
                </p>
                {assignment.descuento && (
                  <p className="text-gray-600">
                    <span className="font-medium">Descuento actual:</span> {(() => {
                      const pct = assignment.descuentoPorcentaje ?? (
                        assignment.precioOriginal && assignment.precioFinal && assignment.precioOriginal > assignment.precioFinal
                          ? Math.round((1 - assignment.precioFinal / assignment.precioOriginal) * 10000) / 100
                          : null
                      );
                      if (pct !== null && !String(assignment.descuento).includes('%')) {
                        return `${assignment.descuento} (${pct}%)`;
                      }
                      return assignment.descuento;
                    })()}
                  </p>
                )}
              </div>
            </div>

            {/* Campo de Fecha */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-cyan-600" />
                Fecha de Asignación
              </label>
              <input
                type="date"
                value={formData.fechaAsignacion}
                onChange={(e) => setFormData({ ...formData, fechaAsignacion: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-gray-50 hover:bg-white font-medium"
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Selecciona una fecha anterior si fue asignado previamente
              </p>
            </div>

            {/* Campo de Descuento */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Tag className="w-4 h-4 text-cyan-600" />
                Descuento (Opcional)
              </label>
              <select
                value={formData.descuento}
                onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-gray-50 hover:bg-white font-medium"
              >
                <option value="">Sin descuento</option>
                {getAvailableDiscounts().map((discount, index) => (
                  <option key={index} value={JSON.stringify({ name: discount.name, percentage: discount.percentage })}>
                    {discount.name} - {discount.percentage}% de descuento
                  </option>
                ))}
              </select>
            </div>

            {/* Preview del precio */}
            <div className="bg-cyan-50 rounded-xl p-4 border-2 border-cyan-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Precio final (después de editar):</span>
                <div className="text-right">
                  {formData.descuento && (
                    <span className="text-sm text-gray-500 line-through block">
                      {formatPrice(assignment.precioOriginal)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-cyan-600">
                    {formatPrice(calculatePreviewPrice())}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditarPaqueteAsignadoModal;
