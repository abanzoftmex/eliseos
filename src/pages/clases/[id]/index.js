import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faUsers,
  faClock,
  faMapMarkerAlt,
  faDollarSign,
  faArrowLeft,
  faUser,
  faMagnifyingGlass as faSearch,
  faEnvelope as faMail,
  faEdit,
  faTrash as faTrash2,
  faUserPlus,
  faCog as faBackpack,
  faThumbsUp,
  faClipboard,
  faEye,
  faPhone
} from '@fortawesome/free-solid-svg-icons';

import DataTable from '../../../components/common/DataTable';
import AgregarParticipantesModal from '../../../components/AgregarParticipantesModal';
import useSucursalStore from '../../../store/sucursalStore';
import {
  getClassById,
  getClassAssignedUsers,
  removeUserFromClass,
  CLASS_TYPE_LABELS,
  CLASS_STATUS_LABELS,
  formatPrice,
  formatDateTime
} from '../../../../lib/firebase/classesService';

function ClassDetailPage({ classData, initialUsers, initialPagination, initialFilters }) {
  const router = useRouter();
  const { id: classId } = router.query;
  const sucursales = useSucursalStore((state) => state.sucursales);

  // Función para obtener el nombre de la sucursal
  const getSucursalName = (sucursalId) => {
    if (!sucursalId) return 'Sin sucursal';
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal ? sucursal.name : sucursalId;
  };

  const [users, setUsers] = useState(initialUsers || []);
  const [pagination, setPagination] = useState(initialPagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState(initialFilters || {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [loading, setLoading] = useState(false);
  const [removingUsers, setRemovingUsers] = useState(new Set());
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  // Función para cargar datos desde la API
  const loadUsers = async (newFilters = {}, newPage = pagination.currentPage) => {
    if (!classId) return;

    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: newPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: newFilters.search !== undefined ? newFilters.search : (filters.search || ''),
        sortBy: newFilters.sortBy || filters.sortBy || 'name',
        sortOrder: newFilters.sortOrder || filters.sortOrder || 'asc'
      });

      const response = await fetch(`/api/clases/${classId}/usuarios?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
        setFilters(result.data.filters);
      } else {
        console.error('Error loading users:', result.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de búsqueda
  const handleSearchChange = (searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    loadUsers(newFilters, 1);
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    loadUsers(filters, page);
  };

  // Mostrar mensaje temporal
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Manejar eliminación de usuario de la clase
  const handleRemoveUser = async (user) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar a "${user.name}" de esta clase?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setRemovingUsers(prev => new Set([...prev, user.assignmentId]));

    try {
      const response = await fetch(`/api/clases/${classId}/usuarios/${user.assignmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar la lista de usuarios
        setUsers(prev => prev.filter(u => u.assignmentId !== user.assignmentId));

        // Actualizar la paginación
        setPagination(prev => ({
          ...prev,
          totalItems: prev.totalItems - 1,
          totalPages: Math.ceil((prev.totalItems - 1) / prev.itemsPerPage)
        }));

        showMessage('success', `Usuario "${user.name}" eliminado exitosamente de la clase`);
      } else {
        showMessage('error', result.error || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      showMessage('error', 'Error al eliminar el usuario. Inténtalo de nuevo.');
    } finally {
      setRemovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.assignmentId);
        return newSet;
      });
    }
  };

  // Manejar éxito al agregar participantes
  const handleAddSuccess = (data) => {
    showMessage('success', `Se agregaron ${data.totalAdded} participante(s) exitosamente`);
    // Recargar la lista de usuarios
    loadUsers(filters, pagination.currentPage);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Configuración de columnas para la tabla
  const columns = [
    {
      key: 'name',
      title: 'Usuario',
      render: (user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {user.name}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Tipo',
      render: (user) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.type === 'Cliente'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
          }`}>
          {user.type}
        </span>
      ),
      className: 'text-center'
    },
    {
      key: 'email',
      title: 'Email',
      render: (user) => (
        <div className="flex items-center">
          <FontAwesomeIcon icon={faMail} className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-900">{user.email}</span>
        </div>
      )
    },
    {
      key: 'telefono',
      title: 'Teléfono',
      render: (user) => (
        <div className="flex items-center">
          <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-900">{user.telefono || 'No disponible'}</span>
        </div>
      )
    },
    {
      key: 'estado',
      title: 'Estado',
      render: (user) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.estado === 'activa'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
          }`}>
          {user.estado === 'activa' ? 'Activa' : 'Inactiva'}
        </span>
      ),
      className: 'text-center'
    },
    {
      key: 'assignedAt',
      title: 'Fecha Asignación',
      render: (user) => (
        <div className="flex items-center">
          <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-900">
            {formatDate(user.assignedAt)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (user) => {
        const isRemoving = removingUsers.has(user.assignmentId);
        const detailUrl = `/clientes/${user.id}`;

        return (
          <div className="flex items-center justify-center gap-2">
            {/* Botón Ver */}
            <div className="relative group">
              <Link
                href={detailUrl}
                className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm transform hover:scale-110"
                title="Ver detalles del usuario"
              >
                <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
              </Link>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Ver detalles
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* Botón Eliminar */}
            <div className="relative group">
              <button
                onClick={() => handleRemoveUser(user)}
                disabled={isRemoving}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 shadow-sm transform ${isRemoving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 hover:scale-110'
                  }`}
                title={isRemoving ? 'Eliminando...' : 'Eliminar usuario de la clase'}
              >
                {isRemoving ? (
                  <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FontAwesomeIcon icon={faTrash2} className="w-3.5 h-3.5" />
                )}
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {isRemoving ? 'Eliminando...' : 'Eliminar de clase'}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        );
      },
      className: 'text-center'
    }
  ];

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faCalendar} className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Clase no encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            La clase solicitada no existe o no tienes permisos para verla.
          </p>
          <div className="mt-6">
            <Link
              href="/clases"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
              Volver a Actividades
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'programada':
        return 'bg-blue-100 text-blue-800';
      case 'en_progreso':
        return 'bg-yellow-100 text-yellow-800';
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Encabezado con información de la clase */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/clases"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-2" />
              Volver a Clases
            </Link>
          </div>

          <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-cyan-100 p-3 rounded-lg mr-4">
                  <FontAwesomeIcon icon={faCalendar} className="h-8 w-8 text-cyan-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {classData.nombre}
                    </h1>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(classData.status)}`}>
                      {CLASS_STATUS_LABELS[classData.status]}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {classData.descripcion}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="font-semibold text-cyan-600 mr-2">Tipo:</span>
                      <span>{CLASS_TYPE_LABELS[classData.tipo]}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4 mr-1 text-cyan-600" />
                      <span className="font-semibold">{formatPrice(classData.precio)}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-1 text-cyan-600" />
                      <span>{classData.duracion} minutos</span>
                    </div>
                    {classData.ubicacion && (
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 mr-1 text-cyan-600" />
                        <span>{classData.ubicacion}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 mr-1 text-emerald-600" />
                      <span className="font-semibold text-emerald-700">{getSucursalName(classData.sucursal)}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-1 text-cyan-600" />
                      <span>{pagination.totalItems} participante{pagination.totalItems !== 1 ? 's' : ''}</span>
                      {classData.maxParticipantes > 1 && (
                        <span className="text-gray-500">/{classData.maxParticipantes}</span>
                      )}
                    </div>
                  </div>

                  {/* Información de Horarios */}
                  {classData.modoProgramacion === 'recurrente' && classData.diasSemana && classData.diasSemana.length > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />
                        Horario Recurrente
                      </span>
                      <div className="text-base font-medium text-gray-900 mt-2">
                        {classData.diasSemana.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1)).join(', ')}
                      </div>
                      {classData.horaInicio && (
                        <div className="text-lg font-bold text-emerald-700 mt-1">
                          {classData.horaInicio} hrs
                        </div>
                      )}
                    </div>
                  )}

                  {classData.modoProgramacion === 'especifica' && classData.fechasEspecificas && classData.fechasEspecificas.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm text-cyan-700 font-semibold flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />
                        Fechas Específicas ({classData.fechasEspecificas.length})
                      </span>
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                        {classData.fechasEspecificas.map((item, index) => {
                          const fecha = new Date(item.fecha + 'T00:00:00');
                          const fechaStr = fecha.toLocaleDateString('es-MX', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-cyan-700" />
                              <span className="font-medium text-gray-900">{fechaStr}</span>
                              <span className="text-cyan-700 font-semibold">{item.hora} hrs</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {classData.fechaHora && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Fecha y hora programada:</span>
                      <div className="text-lg font-semibold text-gray-900 mt-1">
                        {formatDateTime(classData.fechaHora)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4 mr-2" />
                  Agregar Participantes
                </button>
                <button
                  onClick={() => router.push(`/clases/editar/${classData.id}`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-2" />
                  Editar
                </button>
              </div>
            </div>

            {/* Información adicional según el tipo */}
            {classData.instructor && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="flex gap-0.5 text-gray-600">
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-1 text-cyan-600" />
                      Responsable (Personal Interno)
                    </span>
                    <p className="font-medium text-gray-900">{classData.instructor}</p>
                  </div>

                  {classData.equipamientoNecesario && classData.equipamientoNecesario.length > 0 && (
                    <div>

                      <span className="flex gap-0.5 text-gray-600">
                        <FontAwesomeIcon icon={faBackpack} className="w-4 h-4 mr-1 text-cyan-600" />
                        Equipamiento:
                      </span>
                      <p className="font-medium text-gray-900">
                        {classData.equipamientoNecesario.join(', ')}
                      </p>
                    </div>
                  )}

                  {classData.objetivos && classData.objetivos.length > 0 && (
                    <div>
                      <span className="flex gap-0.5 text-gray-600">
                        <FontAwesomeIcon icon={faThumbsUp} className="w-4 h-4 mr-1 text-cyan-600" />
                        Objetivos:
                      </span>
                      <p className="font-medium text-gray-900">
                        {classData.objetivos.join(', ')}
                      </p>
                    </div>
                  )}


                  {classData.plan && (
                    <div>
                      <span className="flex gap-0.5 text-gray-600">
                        <FontAwesomeIcon icon={faClipboard} className="w-4 h-4 mr-1 text-cyan-600" />
                        Plan de entrenamiento:
                      </span>
                      <p className="font-medium text-gray-900">
                        {classData.plan}
                      </p>
                    </div>
                  )}

                  {classData.notas && (
                    <div>
                      <span className="flex gap-0.5 text-gray-600">
                        <FontAwesomeIcon icon={faClipboard} className="w-4 h-4 mr-1 text-cyan-600" />Notas:
                      </span>
                      <p className="font-medium text-gray-900">
                        {classData.notas}
                      </p>
                    </div>

                  )}
                </div>


              </div>
            )}
          </div>
        </div>

        {/* Mensajes de estado */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabla de usuarios asignados */}
        <DataTable
          data={users}
          columns={columns}
          searchTerm={filters.search}
          onSearchChange={handleSearchChange}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading}
          headerTitle="Participantes asignados a esta actividad"
          searchPlaceholder="Busca miembros..."
          emptyStateTitle="No hay participantes asignados"
          emptyStateDescription={
            filters.search
              ? "No se encontraron participantes que coincidan con la búsqueda"
              : "Esta clase aún no tiene participantes asignados"
          }
        />

        {/* Modal para agregar participantes */}
        <AgregarParticipantesModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          classId={classId}
          classType={classData.tipo}
          onSuccess={handleAddSuccess}
        />
      </main>
    </div>
  );
}

// Server-Side Rendering
export async function getServerSideProps(context) {
  const { id } = context.params;
  const { page = 1, search = '', sortBy = 'name', sortOrder = 'asc' } = context.query;

  try {
    // Construir URL completa para la API
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      search: search.toString(),
      sortBy: sortBy.toString(),
      sortOrder: sortOrder.toString()
    });

    const response = await fetch(`${baseUrl}/api/clases/${id}/usuarios?${queryParams}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          props: {
            classData: null,
            initialUsers: [],
            initialPagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
            initialFilters: { search: '', sortBy: 'name', sortOrder: 'asc' }
          }
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      props: {
        classData: result.data.class,
        initialUsers: result.data.users,
        initialPagination: result.data.pagination,
        initialFilters: result.data.filters,
        title: `Participantes - ${result.data.class.nombre} - Elíseos Box & Fitness`,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Actividades', href: '/clases' },
          { label: result.data.class.nombre, href: `/clases/${id}`, isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        activeSection: "clases"
      }
    };

  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    console.error('Class ID:', id);
    console.error('Full error details:', error.message);

    return {
      props: {
        classData: null,
        initialUsers: [],
        initialPagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
        initialFilters: { search: '', sortBy: 'name', sortOrder: 'asc' },
        errorDetails: {
          classId: id,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}

export default ClassDetailPage;