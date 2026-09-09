import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, Calendar, Loader2, ChevronLeft, ChevronRight, Package } from 'lucide-react';

// Tipos de paquetes - deben coincidir exactamente con classesService.js y packagesService.js
const PACKAGE_TYPES = {
  GRUPAL: 'grupal',
  PERSONALIZADO: 'personalizado',
  SESION: 'sesion'
};

const PACKAGE_TYPE_LABELS = {
  [PACKAGE_TYPES.GRUPAL]: 'Clase Grupal',
  [PACKAGE_TYPES.PERSONALIZADO]: 'Entrenamiento Personalizado',
  [PACKAGE_TYPES.SESION]: 'Sesión de Rehabilitación/Masaje'
};

/**
 * Modal para agregar participantes (clientes) a una clase
 * Permite seleccionar múltiples clientes y asignarlos a un día específico
 * Ahora incluye selección de paquete compatible con la clase
 */
export default function AgregarParticipantesModal({ isOpen, onClose, classId, classType, onSuccess }) {
  const [clientes, setClientes] = useState([]);
  const [clientePackages, setClientePackages] = useState({}); // {clienteId: [packages]}
  const [clientePackagesDebug, setClientePackagesDebug] = useState({}); // {clienteId: debugInfo}
  const [selectedPackages, setSelectedPackages] = useState({}); // {clienteId: packageId}
  const [loadingPackages, setLoadingPackages] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [fechaAsignacion, setFechaAsignacion] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState({});

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const itemsPerPage = 10;

  // Cargar clientes cuando se abre el modal o cambia la página
  useEffect(() => {
    if (isOpen) {
      loadClientes();
      // Establecer fecha actual por defecto solo al abrir
      if (!fechaAsignacion) {
        const today = new Date().toISOString().split('T')[0];
        setFechaAsignacion(today);
      }
    }
  }, [isOpen, currentPage, debouncedSearchTerm]);

  // Debounce para la búsqueda - espera 600ms después del último cambio
  useEffect(() => {
    if (!isOpen) return;

    // Mostrar que está escribiendo
    if (searchTerm !== debouncedSearchTerm) {
      setIsTyping(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsTyping(false);
      if (currentPage !== 1) {
        setCurrentPage(1); // Resetear a página 1 cuando busca
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const loadClientes = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        status: 'active'
      });

      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }

      const response = await fetch(`/api/clientes?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        const clientesData = Array.isArray(result.data) ? result.data : [];
        setClientes(clientesData);
        setTotalClientes(result.pagination?.totalItems || 0);
        setTotalPages(Math.ceil((result.pagination?.totalItems || 0) / itemsPerPage));

        // Cargar paquetes compatibles para cada cliente
        clientesData.forEach(cliente => {
          loadClientePackages(cliente.id);
        });
      } else {
        setError('Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error loading clientes:', error);
      setError('Error al cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar paquetes compatibles de un cliente
  const loadClientePackages = async (clienteId) => {
    if (!classType) return;

    setLoadingPackages(prev => new Set([...prev, clienteId]));

    try {
      const response = await fetch(`/api/clientes/${clienteId}/paquetes?classType=${classType}&debug=true`);
      const result = await response.json();

      if (result.success) {
        setClientePackages(prev => ({
          ...prev,
          [clienteId]: result.packages || []
        }));

        // Guardar info de debug si está disponible
        if (result.debug) {
          setClientePackagesDebug(prev => ({
            ...prev,
            [clienteId]: result.debug
          }));
        }
      }
    } catch (error) {
      console.error(`Error loading packages for client ${clienteId}:`, error);
    } finally {
      setLoadingPackages(prev => {
        const newSet = new Set(prev);
        newSet.delete(clienteId);
        return newSet;
      });
    }
  };

  // Manejar selección de cliente
  const handleToggleCliente = (clienteId) => {
    setSelectedClientes(prev => {
      if (prev.includes(clienteId)) {
        // Si se deselecciona, también remover el paquete seleccionado
        setSelectedPackages(prevPackages => {
          const newPackages = { ...prevPackages };
          delete newPackages[clienteId];
          return newPackages;
        });
        return prev.filter(id => id !== clienteId);
      } else {
        return [...prev, clienteId];
      }
    });
  };

  // Manejar selección de paquete para un cliente
  const handleSelectPackage = (clienteId, packageId) => {
    setSelectedPackages(prev => ({
      ...prev,
      [clienteId]: packageId
    }));
  };

  // Seleccionar todos los clientes de la página actual
  const handleSelectAll = () => {
    const currentPageIds = clientes.map(c => c.id);
    const allSelected = currentPageIds.every(id => selectedClientes.includes(id));

    if (allSelected) {
      // Deseleccionar todos de esta página
      setSelectedClientes(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Seleccionar todos de esta página
      setSelectedClientes(prev => {
        const newIds = currentPageIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  // Cambiar página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Manejar cambio en búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Guardar asignaciones
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedClientes.length === 0) {
      setError('Debes seleccionar al menos un cliente');
      return;
    }

    if (!fechaAsignacion) {
      setError('Debes seleccionar una fecha');
      return;
    }

    // Validar que cada cliente seleccionado tenga un paquete asignado
    const clientesSinPaquete = selectedClientes.filter(
      clienteId => !selectedPackages[clienteId]
    );

    if (clientesSinPaquete.length > 0) {
      setError('Todos los clientes seleccionados deben tener un paquete asignado');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/clases/${classId}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarios: selectedClientes.map(clienteId => ({
            userId: clienteId,
            userType: 'cliente',
            packageAssignmentId: selectedPackages[clienteId]
          })),
          fechaAsignacion: fechaAsignacion,
          notas: notas.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Llamar callback de éxito
        if (onSuccess) {
          onSuccess(result.data);
        }
        // Cerrar modal y resetear estado
        handleClose();
      } else {
        setError(result.error || 'Error al agregar participantes');
      }
    } catch (error) {
      console.error('Error adding participants:', error);
      setError('Error al agregar participantes. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Cerrar modal y resetear estado
  const handleClose = () => {
    setSelectedClientes([]);
    setSearchTerm('');
    setFechaAsignacion('');
    setNotas('');
    setError('');
    setCurrentPage(1);
    setClientes([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                <UserPlus className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Agregar Participantes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Selecciona los clientes que deseas agregar a esta clase
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-180px)]">
            {/* Configuración de asignación */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Fecha de asignación *
                  </label>
                  <input
                    type="date"
                    value={fechaAsignacion}
                    onChange={(e) => setFechaAsignacion(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Ej: Clase de prueba, Sesión especial..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Búsqueda y selección de clientes */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Barra de búsqueda */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Contador y seleccionar todos */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedClientes.length} seleccionado(s) • {totalClientes} total(es)
                </div>
                {clientes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    {clientes.every(c => selectedClientes.includes(c.id)) ? 'Deseleccionar página' : 'Seleccionar página'}
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Lista de clientes */}
              {loading || isTyping ? (
                <div className="space-y-2">
                  {/* Skeleton loaders */}
                  {[...Array(itemsPerPage)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 border border-gray-200 rounded-lg animate-pulse"
                    >
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="ml-3 flex items-center flex-1">
                        <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <Search className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea un cliente primero'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {clientes.map((cliente) => {
                      const packages = clientePackages[cliente.id] || [];
                      const isLoadingPackages = loadingPackages.has(cliente.id);
                      const isSelected = selectedClientes.includes(cliente.id);
                      const selectedPackageId = selectedPackages[cliente.id];

                      return (
                        <div
                          key={cliente.id}
                          className={`border rounded-lg transition-all ${isSelected
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-gray-200'
                            }`}
                        >
                          {/* Cliente header con checkbox */}
                          <label
                            className="flex items-center p-4 cursor-pointer"
                            onClick={(e) => {
                              // Solo toggle si se hace click en el label, no en los paquetes
                              if (e.target === e.currentTarget || e.target.tagName === 'DIV') {
                                handleToggleCliente(cliente.id);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCliente(cliente.id)}
                              className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-semibold mr-3">
                                  {cliente.nombre?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {cliente.email}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </label>

                          {/* Paquetes disponibles */}
                          {isSelected && (
                            <div className="px-4 pb-4 border-t border-gray-200 pt-3 bg-white">
                              <div className="flex items-center mb-2">
                                <Package className="w-4 h-4 text-gray-600 mr-1" />
                                <span className="text-sm font-medium text-gray-700">
                                  Selecciona un paquete:
                                </span>
                              </div>

                              {isLoadingPackages ? (
                                <div className="space-y-2">
                                  {[1, 2].map(i => (
                                    <div key={i} className="animate-pulse">
                                      <div className="h-16 bg-gray-100 rounded-lg"></div>
                                    </div>
                                  ))}
                                </div>
                              ) : packages.length === 0 ? (
                                <div className="space-y-3">
                                  <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="font-semibold mb-1">
                                      ⚠️ Este cliente no tiene paquetes compatibles con esta clase
                                    </div>
                                    <div className="text-xs text-amber-700">
                                      Se requiere un paquete tipo: <span className="font-bold">{PACKAGE_TYPE_LABELS[classType] || classType}</span>
                                    </div>
                                  </div>

                                  {/* Botón de debug */}
                                  {clientePackagesDebug[cliente.id] && (
                                    <button
                                      type="button"
                                      onClick={() => setShowDebugInfo(prev => ({
                                        ...prev,
                                        [cliente.id]: !prev[cliente.id]
                                      }))}
                                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                                    >
                                      {showDebugInfo[cliente.id] ? '🔽 Ocultar detalles técnicos' : '🔍 Ver detalles técnicos'}
                                    </button>
                                  )}

                                  {/* Info de debug */}
                                  {showDebugInfo[cliente.id] && clientePackagesDebug[cliente.id] && (
                                    <div className="text-xs bg-gray-50 border border-gray-300 rounded-lg p-3 font-mono">
                                      <div className="font-semibold text-gray-700 mb-2">Información de Debug:</div>
                                      <div className="space-y-1 text-gray-600">
                                        <div>• Tipo de clase: <span className="text-cyan-600 font-semibold">{clientePackagesDebug[cliente.id].classType}</span></div>
                                        <div>• Total de paquetes: {clientePackagesDebug[cliente.id].totalPackages}</div>
                                        <div>• Paquetes activos: {clientePackagesDebug[cliente.id].activePackages}</div>
                                        <div>• Paquetes compatibles: {clientePackagesDebug[cliente.id].compatiblePackages}</div>

                                        {clientePackagesDebug[cliente.id].allPackages?.length > 0 && (
                                          <div className="mt-2 pt-2 border-t border-gray-300">
                                            <div className="font-semibold mb-1">Todos los paquetes:</div>
                                            {clientePackagesDebug[cliente.id].allPackages.map((pkg, idx) => (
                                              <div key={idx} className="ml-2 text-[11px] py-1">
                                                <div>"{pkg.nombre}"</div>
                                                <div className="ml-2 text-gray-500">
                                                  Tipo: <span className={pkg.tipo === 'NO DEFINIDO' ? 'text-red-600 font-bold' : 'text-blue-600'}>{pkg.tipo}</span>
                                                  {' | '}Activo: {pkg.activo ? '✓' : '✗'}
                                                  {' | '}Sesiones: {pkg.numeroServicios - pkg.sessionsTaken}/{pkg.numeroServicios}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {packages.map((pkg) => {
                                    const isPackageSelected = selectedPackageId === pkg.id;
                                    const hasAvailableSessions = pkg.availableSessions > 0;

                                    return (
                                      <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => hasAvailableSessions && handleSelectPackage(cliente.id, pkg.id)}
                                        disabled={!hasAvailableSessions}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${isPackageSelected
                                          ? 'border-cyan-600 bg-cyan-100'
                                          : hasAvailableSessions
                                            ? 'border-gray-300 hover:border-cyan-400 bg-white'
                                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                          }`}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900 text-sm">
                                              {pkg.nombre}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              {pkg.descripcion}
                                            </div>
                                          </div>
                                          <div className="ml-3 text-right">
                                            <div className={`text-sm font-semibold ${hasAvailableSessions ? 'text-cyan-600' : 'text-red-600'
                                              }`}>
                                              {pkg.availableSessions} / {pkg.totalSessions}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {hasAvailableSessions ? 'disponibles' : 'sin sesiones'}
                                            </div>
                                          </div>
                                        </div>
                                        {isPackageSelected && (
                                          <div className="mt-2 text-xs text-cyan-700 font-medium">
                                            ✓ Paquete seleccionado
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || selectedClientes.length === 0}
                className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar {selectedClientes.length} participante(s)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
