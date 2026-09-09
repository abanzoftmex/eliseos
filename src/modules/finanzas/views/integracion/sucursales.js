import { useState, useEffect } from 'react';
import AdminLayout from '@finanzas/components/layout/AdminLayout';
import { BuildingOfficeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sucursales');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setSucursales(data.data);
      } else {
        console.error('Error al cargar sucursales:', data.error || 'Respuesta inválida');
        setSucursales([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setSucursales([]);
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
        body: JSON.stringify({ type: 'sucursales' })
      });

      const data = await response.json();

      if (data.success && data.results.sucursales) {
        const { created, updated, errors } = data.results.sucursales;
        alert(`✅ Sincronización completada:\n${created} sucursales creadas\n${updated} sucursales actualizadas\n${errors.length} errores`);
        await fetchSucursales();
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
            <h1 className="text-2xl font-bold text-gray-900">Sucursales Sincronizadas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sucursales sincronizadas desde el sistema externo
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>

        {/* Alert */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Solo lectura:</strong> Las sucursales se gestionan desde el sistema externo. 
                No puedes agregar, editar o eliminar sucursales desde aquí.
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="bg-white shadow rounded-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : sucursales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BuildingOfficeIcon className="h-12 w-12 mb-3" />
              <p>No hay sucursales sincronizadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sucursales.map((sucursal) => (
                <div 
                  key={sucursal.id} 
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                        <BuildingOfficeIcon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {sucursal.name}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        {sucursal.direccion && (
                          <div className="flex items-start">
                            <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-gray-600">{sucursal.direccion}</span>
                          </div>
                        )}
                        
                        {sucursal.ciudad && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-gray-600">{sucursal.ciudad}</span>
                            {sucursal.codigoPostal && (
                              <span className="text-gray-500 ml-1">({sucursal.codigoPostal})</span>
                            )}
                          </div>
                        )}
                        
                        {sucursal.telefono && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-gray-600">{sucursal.telefono}</span>
                          </div>
                        )}
                        
                        {sucursal.email && (
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600">{sucursal.email}</span>
                          </div>
                        )}
                      </div>
                      
                      {sucursal.syncedAt && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Última sincronización: {new Date(sucursal.syncedAt).toLocaleString('es-MX')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && sucursales.length > 0 && (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total de sucursales: <span className="font-semibold text-gray-900">{sucursales.length}</span>
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
