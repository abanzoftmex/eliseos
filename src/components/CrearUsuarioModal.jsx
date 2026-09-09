import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faEnvelope, faLock, faShield, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default function CrearUsuarioModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'personal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const roles = [
    { value: 'admin', label: 'Rol', displayLabel: 'Administrador', color: 'bg-[#1c4040]', textColor: 'text-white', description: 'Acceso total al sistema' },
    { value: 'coach', label: 'Rol', displayLabel: 'Coaches/Staff', color: 'bg-[#265555]', textColor: 'text-white', description: 'Acceso a miembros, actividades y sesiones' },
    { value: 'personal', label: 'Rol', displayLabel: 'Personal Interno', color: 'bg-[#e8f2f2]', textColor: 'text-[#1c4040]', description: 'Acceso operativo y miembros' },
    { value: 'invitado', label: 'Rol', displayLabel: 'Invitado', color: 'bg-gray-100', textColor: 'text-gray-700', description: 'Solo visualización del dashboard' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/crear-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      setSuccess(true);
      setTimeout(() => {
        onUserCreated(data.usuario);
        handleClose();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: '', email: '', password: '', rol: 'personal' });
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e8f2f2] rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-[#1c4040]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
                <p className="text-sm text-gray-600">Asigna credenciales y permisos en Elíseos</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error al crear usuario</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="bg-[#f4f8f8] border border-[#c6dfdf] rounded-lg p-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#1c4040] flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0d1f1f]">¡Usuario creado exitosamente!</p>
                <p className="text-sm text-[#357070] mt-1">El usuario ha sido agregado al sistema</p>
              </div>
            </div>
          )}

          {/* Campo: Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-[#1c4040] transition-colors"
                placeholder="Ej: Juan Pérez"
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Campo: Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-[#1c4040] transition-colors"
                placeholder="usuario@ejemplo.com"
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña Temporal
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c4040] focus:border-[#1c4040] transition-colors"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                disabled={loading || success}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">El usuario deberá cambiarla en su primer acceso</p>
          </div>

          {/* Campo: Rol */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Rol y Permisos
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((rol) => (
                <label
                  key={rol.value}
                  className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.rol === rol.value
                      ? 'border-[#1c4040] bg-[#f4f8f8]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${loading || success ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="rol"
                    value={rol.value}
                    checked={formData.rol === rol.value}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="mt-1 text-[#1c4040] focus:ring-[#1c4040]"
                    disabled={loading || success}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{rol.label}</span>
                      <span className={`px-2.5 py-0.5 ${rol.color} ${rol.textColor} font-black text-xs rounded-full`}>
                        {rol.displayLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{rol.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#1c4040] hover:bg-[#143030] text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : success ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Creado
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShield} className="w-5 h-5 text-[#c2ef03]" />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
