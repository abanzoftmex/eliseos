import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faUserShield,
  faCrown,
  faUsers,
  faUserCog,
  faEye,
  faCheck,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

const ROLES = [
  {
    value: 'admin',
    label: 'Administrador',
    icon: faCrown,
    badgeBg: 'bg-[#1c4040] text-white',
    description: 'Acceso total y configuración del sistema',
  },
  {
    value: 'coach',
    label: 'Coaches / Staff',
    icon: faUsers,
    badgeBg: 'bg-[#265555] text-white',
    description: 'Acceso a miembros, actividades y sesiones de entrenamiento',
  },
  {
    value: 'personal',
    label: 'Personal Interno',
    icon: faUserCog,
    badgeBg: 'bg-[#e8f2f2] text-[#1c4040]',
    description: 'Acceso operativo y gestión de miembros',
  },
  {
    value: 'invitado',
    label: 'Invitado',
    icon: faEye,
    badgeBg: 'bg-gray-100 text-gray-700',
    description: 'Solo visualización del dashboard',
  },
];

export default function EditarRolModal({ isOpen, onClose, usuario, onRoleUpdated }) {
  const [selectedRole, setSelectedRole] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      // Normalizar roles heredados
      let currentRol = usuario.rol || 'personal';
      if (currentRol === 'medico' || currentRol === 'staff') currentRol = 'coach';
      if (currentRol === 'asistente') currentRol = 'personal';
      setSelectedRole(currentRol);
      setError('');
    }
  }, [usuario]);

  if (!isOpen || !usuario) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onRoleUpdated(usuario.id, selectedRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e8f2f2] rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faUserShield} className="w-5 h-5 text-[#1c4040]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editar Rol de Usuario</h2>
              <p className="text-xs text-gray-500">{usuario.nombre} ({usuario.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Selecciona el nuevo rol:
          </p>

          <div className="space-y-2.5">
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.value;
              return (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                    isSelected
                      ? 'border-[#1c4040] bg-[#e8f2f2]/40 shadow-sm ring-1 ring-[#1c4040]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${r.badgeBg}`}>
                      <FontAwesomeIcon icon={r.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{r.label}</div>
                      <div className="text-xs text-gray-500">{r.description}</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${
                      isSelected
                        ? 'border-[#1c4040] bg-[#1c4040] text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#1c4040] hover:bg-[#265555] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              {loading && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
