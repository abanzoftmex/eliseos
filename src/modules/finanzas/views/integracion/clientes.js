import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { UsersIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Leer filtros desde la URL
  const searchTerm = router.query.search || '';
  const filters = {
    sucursal: router.query.sucursal || '',
    tipo: router.query.tipo || ''
  };

  // Actualizar URL con los filtros
  const updateURL = useCallback((newFilters) => {
    const query = {};
    if (newFilters.search) query.search = newFilters.search;
    if (newFilters.sucursal) query.sucursal = newFilters.sucursal;
    if (newFilters.tipo) query.tipo = newFilters.tipo;
    
    router.replace({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  }, [router]);

  const setSearchTerm = (value) => {
    updateURL({ ...filters, search: value });
  };

  const setFilters = (newFilters) => {
    updateURL({ search: searchTerm, ...newFilters });
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  useEffect(() => {
    // Solo cargar clientes cuando el router esté listo
    if (router.isReady && !initialized) {
      setInitialized(true);
      fetchClientes();
    }
  }, [router.isReady, initialized]);

  // Cargar clientes cuando cambien los filtros (después de inicializar)
  useEffect(() => {
    if (initialized) {
      fetchClientes();
    }
  }, [filters.sucursal, filters.tipo]);

  const fetchSucursales = async () => {
    try {
      const response = await fetch('/api/sucursales');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setSucursales(data.data);
      } else {
        setSucursales([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setSucursales([]);
    }
  };

  const getSucursalName = (sucursalId) => {
    if (!sucursalId) return '-';
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal ? sucursal.name : sucursalId;
  };

  // Obtener nombres de múltiples sucursales
  const getSucursalesNames = (sucursalesArray) => {
    if (!Array.isArray(sucursalesArray) || sucursalesArray.length === 0) return '-';
    return sucursalesArray.map(id => getSucursalName(id)).join(', ');
  };

  // Filtrar clientes por búsqueda
  const filteredClientes = clientes.filter(cliente => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const nombreCompleto = `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`.toLowerCase();
    const email = (cliente.email || '').toLowerCase();
    const telefono = (cliente.telefono || '').toLowerCase();
    const sucursalesNames = getSucursalesNames(cliente.sucursales).toLowerCase();
    
    return nombreCompleto.includes(search) || 
           email.includes(search) || 
           telefono.includes(search) ||
           sucursalesNames.includes(search);
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.sucursal) params.append('sucursal', filters.sucursal);
      if (filters.tipo) params.append('tipo', filters.tipo);

      const response = await fetch(`/api/clientes?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setClientes(data.data);
      } else {
        console.error('Error al cargar clientes:', data.error || 'Respuesta inválida');
        setClientes([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/integration/trigger-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'clientes' })
      });

      const data = await response.json();
      console.log('📡 Respuesta de sincronización:', data);

      if (data.success && data.results.clientes) {
        // Verificar si hay un error en los resultados
        if (data.results.clientes.error) {
          alert('❌ Error en la sincronización de clientes: ' + data.results.clientes.error);
        } else {
          const { created, updated, errors } = data.results.clientes;
          alert(`✅ Sincronización completada:\n${created} clientes creados\n${updated} clientes actualizados\n${errors.length} errores`);
          await fetchClientes();
        }
      } else {
        alert('❌ Error en la sincronización: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al sincronizar:', error);
      alert('❌ Error de conexión al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Miembros Sincronizados</h1>
            <p className="mt-1 text-sm text-gray-500">
              Miembros registrados en el sistema principal de ELISEOS
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#153131] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>

        {/* Alert */}
        <div className="bg-[#f4f8f8] border-l-4 border-primary p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Solo lectura:</strong> Los miembros se gestionan desde el sistema principal de ELISEOS. 
                No puedes agregar, editar o eliminar miembros desde aquí.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono o sucursal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal
              </label>
              <select
                value={filters.sucursal}
                onChange={(e) => setFilters({ ...filters, sucursal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {sucursales.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="cliente">Cliente</option>
                <option value="atleta">Atleta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <UsersIcon className="h-12 w-12 mb-3" />
              <p>{searchTerm ? 'No se encontraron clientes con ese criterio' : 'No hay clientes sincronizados'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cliente.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cliente.telefono || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {Array.isArray(cliente.sucursales) && cliente.sucursales.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {cliente.sucursales.map((sucursalId, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {getSucursalName(sucursalId)}
                                </span>
                              ))}
                            </div>
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cliente.tipo === 'atleta' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cliente.tipo || 'cliente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && clientes.length > 0 && (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total de clientes: <span className="font-semibold text-gray-900">{clientes.length}</span>
              </p>
              <p className="text-xs text-gray-500">
                Última actualización: {new Date().toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
