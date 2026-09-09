import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CrearUsuarioModal from '../components/CrearUsuarioModal';
import EditarRolModal from '../components/EditarRolModal';
import useAuthStore from '../store/authStore';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faPlus,
  faShieldAlt,
  faEnvelope,
  faCalendarAlt,
  faSearch,
  faFilter,
  faEllipsisV,
  faEdit,
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faCrown,
  faStethoscope,
  faEye,
  faUserCog,
  faKey,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

function Configuracion() {
  const router = useRouter();
  const { isAdmin, hasAccess } = useAuthStore();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('todos');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId]);

  // Verificar acceso
  useEffect(() => {
    if (!hasAccess('configuracion')) {
      router.push('/dashboard');
    }
  }, [hasAccess, router]);

  // Cargar usuarios
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('fechaCreacion', 'desc'));
      const querySnapshot = await getDocs(q);
      const usuariosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = (nuevoUsuario) => {
    cargarUsuarios();
  };

  // Alternar estado activo / inactivo
  const handleToggleActivo = async (usuario) => {
    setActiveMenuId(null);
    const nuevoEstado = usuario.activo === false;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!confirm(`¿Estás seguro de que deseas ${accion} al usuario "${usuario.nombre}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      if (!response.ok) {
        await updateDoc(doc(db, 'users', usuario.id), {
          activo: nuevoEstado,
          actualizadoEl: new Date().toISOString(),
        });
      }

      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: nuevoEstado } : u));
      showSuccessToast(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err) {
      console.error(`Error al ${accion} usuario:`, err);
      showErrorToast(`Error al ${accion} usuario: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Actualizar rol de usuario
  const handleRoleUpdated = async (userId, nuevoRol) => {
    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const roleFinanciero = nuevoRol === 'admin' ? 'administrativo' : (['coach', 'staff'].includes(nuevoRol) ? 'operativo' : 'personal');
        const sistemas = nuevoRol === 'admin' ? ['eliseos_core', 'eliseos_financiero'] : ['eliseos_core'];

        await updateDoc(doc(db, 'users', userId), {
          rol: nuevoRol,
          role: roleFinanciero,
          sistemas,
          actualizadoEl: new Date().toISOString(),
        });
      }

      const roleFinanciero = nuevoRol === 'admin' ? 'administrativo' : (['coach', 'staff'].includes(nuevoRol) ? 'operativo' : 'personal');
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol, role: roleFinanciero } : u));
      showSuccessToast('Rol de usuario actualizado exitosamente');
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      showErrorToast(`Error al actualizar rol: ${err.message}`);
      throw err;
    }
  };

  // Restablecer contraseña
  const handleResetPassword = async (usuario) => {
    setActiveMenuId(null);
    if (!confirm(`¿Enviar correo de recuperación de contraseña a "${usuario.email}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await sendPasswordResetEmail(auth, usuario.email);
      showSuccessToast(`Correo de restablecimiento enviado a ${usuario.email}`);
    } catch (err) {
      console.error('Error al enviar correo de recuperación:', err);
      showErrorToast(`No se pudo enviar el correo: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (usuario) => {
    setActiveMenuId(null);

    const esAdmin = usuario.rol === 'admin' || usuario.email === 'admin@eliseos.mx';
    const advertencia = esAdmin
      ? `ADVERTENCIA: "${usuario.nombre}" tiene rol de Administrador. ¿Realmente deseas eliminar su cuenta y accesos?`
      : `¿Estás seguro de que deseas eliminar permanentemente a "${usuario.nombre}"? Esta acción no se puede deshacer.`;

    if (!confirm(advertencia)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo eliminar el usuario de Authentication');
      }

      setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
      showSuccessToast('Usuario eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showErrorToast(`Error al eliminar usuario: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = filterRol === 'todos' || 
      usuario.rol === filterRol ||
      (filterRol === 'coach' && ['coach', 'staff', 'medico'].includes(usuario.rol)) ||
      (filterRol === 'personal' && ['personal', 'asistente'].includes(usuario.rol));
    return matchesSearch && matchesRol;
  });

  // Configuración de badges por rol
  const getRolBadge = (rol) => {
    const configs = {
      admin: {
        color: 'bg-[#1c4040] text-white border-[#1c4040]',
        label: 'Administrador',
        icon: faCrown,
      },
      coach: {
        color: 'bg-[#265555] text-white border-[#1c4040]',
        label: 'Coaches / Staff',
        icon: faUsers,
      },
      staff: {
        color: 'bg-[#265555] text-white border-[#1c4040]',
        label: 'Coaches / Staff',
        icon: faUsers,
      },
      medico: {
        color: 'bg-[#265555] text-white border-[#1c4040]',
        label: 'Coaches / Staff',
        icon: faUsers,
      },
      personal: {
        color: 'bg-[#e8f2f2] text-[#1c4040] border-[#c6dfdf]',
        label: 'Personal Interno',
        icon: faUserCog,
      },
      asistente: {
        color: 'bg-[#e8f2f2] text-[#1c4040] border-[#c6dfdf]',
        label: 'Personal Interno',
        icon: faUserCog,
      },
      invitado: {
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        label: 'Invitado',
        icon: faEye,
      },
    };
    return configs[rol] || configs.invitado;
  };

  // Formatear fecha
  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-8">
        <div className="container mx-auto ">

          {/* Header Principal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#e8f2f2] rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-[#1c4040]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuración de Usuarios</h1>
                    <p className="text-sm text-gray-600 mt-1">Gestiona usuarios, roles y permisos del sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#1c4040] hover:bg-[#143030] text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-5 h-5 text-[#c2ef03]" />
                  Nuevo Usuario
                </button>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Búsqueda */}
                <div className="flex-1 relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  />
                </div>

                {/* Filtro por rol */}
                <div className="relative min-w-[200px]">
                  <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={filterRol}
                    onChange={(e) => setFilterRol(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none bg-white transition-all duration-200"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="admin">Administrador</option>
                    <option value="coach">Coaches / Staff</option>
                    <option value="personal">Personal Interno</option>
                    <option value="invitado">Invitado</option>
                  </select>
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-cyan-600" />
                <span>
                  Mostrando <span className="font-semibold text-gray-900">{usuariosFiltrados.length}</span> de{' '}
                  <span className="font-semibold text-gray-900">{usuarios.length}</span> usuarios
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[360px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <svg className="animate-spin h-10 w-10 mx-auto text-[#1c4040]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 mt-4 text-sm">Cargando usuarios...</p>
                </div>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron usuarios</h3>
                <p className="text-gray-600 text-center text-sm">
                  {searchTerm || filterRol !== 'todos'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Crea tu primer usuario para comenzar'}
                </p>
              </div>
            ) : (
              <div className="overflow-visible min-h-[300px]">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha de Creación
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuariosFiltrados.map((usuario) => {
                      const rolBadge = getRolBadge(usuario.rol);
                      return (
                        <tr key={usuario.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#265555] to-[#1c4040] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-semibold text-gray-900">{usuario.nombre}</div>
                                <div className="text-xs text-gray-500">ID: {usuario.uid?.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                              {usuario.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${rolBadge.color}`}>
                              <FontAwesomeIcon icon={rolBadge.icon} className="w-3.5 h-3.5" />
                              {rolBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-gray-400" />
                              {formatearFecha(usuario.fechaCreacion)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {usuario.activo !== false ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e8f2f2] text-[#1c4040] rounded-full text-xs font-semibold">
                                <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3" />
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === usuario.id ? null : usuario.id);
                                }}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  activeMenuId === usuario.id
                                    ? 'bg-[#e8f2f2] text-[#1c4040]'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                                title="Acciones de usuario"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} className="w-4 h-4" />
                              </button>

                              {activeMenuId === usuario.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100"
                                >
                                  <div className="px-3.5 py-2 bg-gray-50/80">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acciones</p>
                                    <p className="text-xs font-semibold text-gray-800 truncate">{usuario.nombre}</p>
                                  </div>

                                  <div className="py-1">
                                    {/* Editar Rol */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setEditingUser(usuario);
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-[#e8f2f2]/60 hover:text-[#1c4040] flex items-center gap-2.5 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5 text-[#1c4040]" />
                                      <span>Editar Rol</span>
                                    </button>

                                    {/* Activar / Desactivar */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleActivo(usuario)}
                                      className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${
                                        usuario.activo !== false
                                          ? 'text-amber-700 hover:bg-amber-50'
                                          : 'text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                    >
                                      <FontAwesomeIcon
                                        icon={usuario.activo !== false ? faTimesCircle : faCheckCircle}
                                        className="w-3.5 h-3.5"
                                      />
                                      <span>{usuario.activo !== false ? 'Desactivar Usuario' : 'Activar Usuario'}</span>
                                    </button>

                                    {/* Restablecer Contraseña */}
                                    <button
                                      type="button"
                                      onClick={() => handleResetPassword(usuario)}
                                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Restablecer Contraseña</span>
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    {/* Eliminar */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(usuario)}
                                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5 text-red-500" />
                                      <span>Eliminar Acceso</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info de permisos por rol */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 text-[#1c4040]" />
                Permisos por Rol
              </h3>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { rol: 'admin', permisos: ['Dashboard', 'Personal Interno', 'Miembros', 'Paquetes', 'Configuración', 'Sucursales'] },
                { rol: 'medico', permisos: ['Dashboard', 'Personal Interno', 'Miembros', 'Actividades'] },
                { rol: 'asistente', permisos: ['Dashboard', 'Miembros', 'Actividades'] },
                { rol: 'invitado', permisos: ['Dashboard'] }
              ].map(({ rol, permisos }) => {
                const badge = getRolBadge(rol);
                return (
                  <div key={rol} className="border border-gray-200 rounded-lg p-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color} mb-3`}>
                      <FontAwesomeIcon icon={badge.icon} className="w-3.5 h-3.5" />
                      {badge.label}
                    </div>
                    <ul className="space-y-1.5">
                      {permisos.map((permiso) => (
                        <li key={permiso} className="flex items-center gap-2 text-xs text-gray-700">
                          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-[#1c4040] flex-shrink-0" />
                          {permiso}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Crear Usuario */}
      <CrearUsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* Modal Editar Rol */}
      <EditarRolModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        usuario={editingUser}
        onRoleUpdated={handleRoleUpdated}
      />
    </>
  );
}

// Implementar SSR para configuración de usuarios
export async function getServerSideProps(context) {
  return {
    props: {
      title: "Configuración de Usuarios - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Configuración', href: '/configuracion', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin'] // Solo administradores pueden acceder a configuración
    }
  };
}

// Proteger la ruta - requiere permiso 'configuracion'
// Roles permitidos: admin
export default Configuracion;