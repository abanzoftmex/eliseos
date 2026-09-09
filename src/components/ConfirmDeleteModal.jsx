import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, profesional, cliente, title, message, isDeleting = false }) => {
  const [confirmationName, setConfirmationName] = useState('');

  if (!isOpen) return null;

  // Si se proporciona title y message, usar esos (para casos como sucursales)
  if (title && message) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-700 mb-3">
                {message}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Advertencia:</strong> Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lógica original para profesionales y clientes
  const person = profesional || cliente;
  const entityType = profesional ? 'profesional' : 'paciente';
  const entityName = profesional ? 'directorio' : 'registro de pacientes';

  // Nombre completo esperado para confirmación
  const expectedName = person ? `${person.nombre} ${person.apellidoPaterno}`.trim() : '';

  // Función para normalizar texto: quitar acentos, normalizar espacios, lowercase
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .trim()
      // Normalizar caracteres Unicode (quitar acentos)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Reemplazar múltiples espacios con uno solo
      .replace(/\s+/g, ' ');
  };

  // Verificar si el nombre coincide (con normalización)
  const isNameConfirmed = normalizeText(confirmationName) === normalizeText(expectedName);

  const handleConfirm = () => {
    if (cliente && !isNameConfirmed) {
      return; // No permitir confirmar si es cliente y el nombre no coincide
    }
    onConfirm();
  };

  const handleClose = () => {
    setConfirmationName(''); // Limpiar campo al cerrar
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Confirmar Eliminación
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-3">
              ¿Estás seguro de que deseas eliminar el siguiente {entityType} del {entityName}?
            </p>

            {person && (
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-400">
                <div className="flex items-center gap-3">
                  {person.foto ? (
                    <img
                      src={person.foto}
                      alt={`${person.nombre} ${person.apellidoPaterno}`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {person.nombre?.charAt(0)}{person.apellidoPaterno?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {person.nombre} {person.apellidoPaterno} {person.apellidoMaterno || ''}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {profesional
                        ? (profesional.especialidad || profesional.puesto || 'Profesional médico')
                        : (cliente?.ocupacion || cliente?.tipo || 'Paciente/Atleta')
                      }
                    </p>
                    {person.email && (
                      <p className="text-xs text-gray-500">{person.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. El {entityType} será eliminado permanentemente del {entityName}
              {cliente ? ', incluyendo todo su historial médico, consultas, citas, paquetes y cualquier dato relacionado.' : '.'}
            </p>
            {cliente && (
              <ul className="text-xs text-red-700 mt-2 ml-4 list-disc">
                <li>Consultas médicas y deportivas</li>
                <li>Historial clínico completo</li>
                <li>Citas y agendas</li>
                <li>Paquetes asignados</li>
                <li>Inscripciones en clases</li>
              </ul>
            )}
          </div>

          {/* Campo de confirmación para pacientes */}
          {cliente && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Para confirmar la eliminación, escribe el nombre completo del paciente:
              </label>
              <p className="text-sm text-gray-600 mb-2 font-medium bg-gray-50 px-3 py-2 rounded border">
                {expectedName}
              </p>
              <input
                type="text"
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                placeholder="Escribe el nombre completo aquí..."
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors ${confirmationName && !isNameConfirmed
                    ? 'border-red-300 bg-red-50'
                    : isNameConfirmed
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                disabled={isDeleting}
              />
              {confirmationName && !isNameConfirmed && (
                <p className="text-xs text-red-600 mt-1">
                  El nombre no coincide. Debe escribir exactamente: {expectedName}
                </p>
              )}
              {isNameConfirmed && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  ✓ Nombre confirmado correctamente
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || (cliente && !isNameConfirmed)}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Eliminando...
              </>
            ) : (
              `Eliminar ${entityType}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;