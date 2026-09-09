import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox as faPackage,
  faUsers,
  faCreditCard,
  faCalendar,
  faEnvelope as faMail,
  faArrowLeft,
  faUser,
  faMagnifyingGlass as faSearch
} from '@fortawesome/free-solid-svg-icons';

import DataTable from '../../../components/common/DataTable';
import { formatPrice } from '../../../../lib/firebase/packagesService';

function PackageUsersPage({ packageData, initialUsers, initialPagination, initialFilters, errorDetails }) {
  const router = useRouter();
  const { id: packageId } = router.query;

  // Debug: mostrar información del error en la consola
  useEffect(() => {
    if (errorDetails) {
      console.error('Error details from server:', errorDetails);
    }
    if (!packageData && packageId) {
      console.log('Package ID from router:', packageId);
      console.log('Package data received:', packageData);
    }
  }, [errorDetails, packageData, packageId]);

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

  // Función para cargar datos desde la API
  const loadUsers = async (newFilters = {}, newPage = pagination.currentPage) => {
    if (!packageId) return;

    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: newPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: newFilters.search || filters.search || '',
        sortBy: newFilters.sortBy || filters.sortBy || 'name',
        sortOrder: newFilters.sortOrder || filters.sortOrder || 'asc'
      });

      const response = await fetch(`/api/paquetes/${packageId}/usuarios?${queryParams}`);
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

  // Manejar eliminación de usuario del paquete
  const handleRemoveUser = async (user) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar a "${user.name}" de este paquete?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setRemovingUsers(prev => new Set([...prev, user.assignmentId]));

    try {
      const response = await fetch(`/api/paquetes/${packageId}/usuarios/${user.assignmentId}`, {
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

        showMessage('success', `Usuario "${user.name}" eliminado exitosamente del paquete`);
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
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold">
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
      key: 'discount',
      title: 'Descuento',
      render: (user) => {
        if (!user.discount) {
          return <span className="text-gray-400">Sin descuento</span>;
        }
        const pct = user.discountPorcentaje ?? (
          user.originalPrice && user.finalPrice && user.originalPrice > user.finalPrice
            ? Math.round((1 - user.finalPrice / user.originalPrice) * 10000) / 100
            : null
        );
        const text = (pct !== null && !String(user.discount).includes('%'))
          ? `${user.discount} (${pct}%)`
          : user.discount;

        return (
          <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
            {text}
          </span>
        );
      },
      className: 'text-center'
    },
    {
      key: 'finalPrice',
      title: 'Precio Final',
      render: (user) => (
        <div className="flex items-center">
          <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(user.finalPrice)}
          </span>
        </div>
      )
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
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleRemoveUser(user)}
              disabled={isRemoving}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${isRemoving
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }`}
              title="Eliminar usuario del paquete"
            >
              {isRemoving ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              <span className="ml-1">
                {isRemoving ? 'Eliminando...' : 'Eliminar'}
              </span>
            </button>
          </div>
        );
      },
      className: 'text-center'
    }
  ];

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <FontAwesomeIcon icon={faPackage} className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Paquete no encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            El paquete solicitado no existe o no tienes permisos para verlo.
          </p>
          {errorDetails && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-left">
              <h4 className="text-sm font-medium text-red-800 mb-2">Detalles del error:</h4>
              <p className="text-xs text-red-600">ID del paquete: {errorDetails.packageId}</p>
              <p className="text-xs text-red-600">Error: {errorDetails.errorMessage}</p>
              <p className="text-xs text-red-600">Timestamp: {errorDetails.timestamp}</p>
            </div>
          )}
          {packageId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-left">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Información de debug:</h4>
              <p className="text-xs text-blue-600">ID actual: {packageId}</p>
            </div>
          )}
          <div className="mt-6">
            <Link
              href="/paquetes"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
              Volver a Paquetes/Planes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Encabezado con información del paquete */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/paquetes"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5 mr-2" />
              Volver a Paquetes/Planes
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                  <FontAwesomeIcon icon={faPackage} className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {packageData.name}
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {packageData.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 mr-2 text-emerald-600" />
                      <span className="font-semibold">{formatPrice(packageData.price)}</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 mr-2 text-emerald-600" />
                      <span>{packageData.sessionsIncluded} sesiones</span>
                    </div>
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-emerald-600" />
                      <span>{pagination.totalItems} usuario{pagination.totalItems !== 1 ? 's' : ''} asignado{pagination.totalItems !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          headerTitle="Usuarios asignados a este paquete"
          searchPlaceholder="Buscar usuarios asignados..."
          emptyStateTitle="No hay usuarios asignados"
          emptyStateDescription={
            filters.search
              ? "No se encontraron usuarios que coincidan con la búsqueda"
              : "Este paquete aún no tiene usuarios asignados"
          }
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

    const response = await fetch(`${baseUrl}/api/paquetes/${id}/usuarios?${queryParams}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          props: {
            packageData: null,
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
        packageData: result.data.package,
        initialUsers: result.data.users,
        initialPagination: result.data.pagination,
        initialFilters: result.data.filters,
        title: `Miembros - ${result.data.package.name} - Elíseos Box & Fitness`,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Paquetes y Planes', href: '/paquetes' },
          { label: result.data.package.name, href: `/paquetes/${id}`, isLast: true }
        ],
        showBreadcrumbs: true,
        requireAuth: true,
        allowedRoles: ['admin', 'medico'],
        activeSection: "paquetes"
      }
    };

  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    console.error('Package ID:', id);
    console.error('Full error details:', error.message);

    return {
      props: {
        packageData: null,
        initialUsers: [],
        initialPagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 },
        initialFilters: { search: '', sortBy: 'name', sortOrder: 'asc' },
        errorDetails: {
          packageId: id,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      }
    };
  }
}

export default PackageUsersPage;