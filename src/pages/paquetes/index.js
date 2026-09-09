import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBox as faPackage, faMagnifyingGlass as faSearch, faTrash as faTrash2, faEdit, faUsers as faUsersIcon, faEye, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

import PackageCard from '../../components/packages/PackageCard';
import PackageDetailPanel from '../../components/packages/PackageDetailPanel';
import ViewToggle from '../../components/common/ViewToggle';
import useViewStore from '../../store/viewStore';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';
import { MapPinIcon } from '@heroicons/react/24/solid';
import {
  getPackages,
  deletePackage,
  getPackageAssignmentCounts,
  formatPrice
} from '../../../lib/firebase/packagesService';

function PaquetesPage() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const selectedSucursal = useSucursalStore(state => state.selectedSucursal);
  const getSucursal = useSucursalStore(state => state.getSucursal);
  const sucursales = useSucursalStore(state => state.sucursales);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [deletingPackages, setDeletingPackages] = useState(new Set());
  const [assignedCounts, setAssignedCounts] = useState({});
  const [totalActiveAssignments, setTotalActiveAssignments] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [affectedUsersModal, setAffectedUsersModal] = useState({ open: false, users: [] });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para el side panel de detalles
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState(null);

  const loadAssignedCounts = useCallback(async () => {
    try {
      const result = await getPackageAssignmentCounts();
      if (result.success) {
        setAssignedCounts(result.counts);
        setTotalActiveAssignments(result.totalActive);
      }
    } catch (error) {
      console.error('Error loading assigned counts:', error);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPackages();
      if (result.success) {
        setPackages(result.packages);
        await loadAssignedCounts();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      showMessage('error', 'Error al cargar los paquetes');
    } finally {
      setLoading(false);
    }
  }, [loadAssignedCounts]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleDeletePackage = async (packageId) => {
    setDeletingPackages(prev => new Set([...prev, packageId]));

    try {
      const result = await deletePackage(packageId);
      if (result.success) {
        setPackages(prev => prev.filter(pkg => pkg.id !== packageId));

        // Mostrar usuarios afectados si los hay
        if (result.affectedUsers && result.affectedUsers.length > 0) {
          setAffectedUsersModal({
            open: true,
            users: result.affectedUsers
          });
          showMessage('success', result.message || 'Paquete eliminado exitosamente');
        } else {
          showMessage('success', 'Paquete eliminado exitosamente (sin asignaciones)');
        }

        // Recargar conteos
        await loadAssignedCounts();
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      showMessage('error', 'Error al eliminar el paquete');
    } finally {
      setDeletingPackages(prev => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    }
  };

  const handleCreateNew = () => {
    router.push('/paquetes/nuevo');
  };

  const handleViewUsers = (packageData) => {
    router.push(`/paquetes/${packageData.id}`);
  };

  const handleViewDetails = (packageData) => {
    setSelectedPackageForDetail(packageData);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedPackageForDetail(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Fecha no disponible';
    return timestamp.toDate().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAudienceLabel = (targetAudience) => {
    const labels = {
      clientes: 'Miembro',
      atletas: 'Atleta',
      ambos: 'General / Todos'
    };
    return labels[targetAudience] || targetAudience || 'No especificado';
  };

  // Helper para obtener nombres de sucursales de un paquete
  const getPackageSucursalesNames = (pkg) => {
    if (!pkg.sucursales || pkg.sucursales.length === 0) {
      return 'Todas las sucursales';
    }
    return pkg.sucursales
      .map(sucId => {
        const suc = sucursales.find(s => s.id === sucId);
        return suc ? suc.name : sucId;
      })
      .join(', ');
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'todos' || pkg.tipo === typeFilter;

    // Filtrado por sucursal
    const matchesSucursal = selectedSucursal === ALL_SUCURSALES_ID ||
      (!pkg.sucursales || pkg.sucursales.length === 0) ||
      pkg.sucursales.includes(selectedSucursal);

    return matchesSearch && matchesType && matchesSucursal;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPackages = filteredPackages.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, selectedSucursal]);

  // Función para generar números de página inteligentes
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando paquetes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
          <div className="flex items-center ml-16 lg:ml-0">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-[#1c4040] flex items-center gap-3">
                  <FontAwesomeIcon icon={faPackage} className="w-8 h-8 text-[#1c4040]" />
                  Gestión de Paquetes / Planes
                </h1>
                {/* Badge de sucursal activa */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  selectedSucursal === ALL_SUCURSALES_ID 
                    ? 'bg-gray-100 text-gray-700 border border-gray-300'
                    : 'bg-[#e8f2f2] text-[#1c4040] border border-[#c6dfdf]'
                }`}>
                  <MapPinIcon className="w-4 h-4" />
                  {getSucursal(selectedSucursal)?.name || 'Todas'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSucursal === ALL_SUCURSALES_ID 
                  ? 'Mostrando paquetes de todas las sucursales'
                  : `Mostrando paquetes de ${getSucursal(selectedSucursal)?.name}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle />
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-[#1c4040] hover:bg-[#143030] text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5 text-[#c2ef03]" />
              Nuevo paquete / plan
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="container mx-auto">

          {/* Mensaje de estado */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
              }`}>
              {message.text}
            </div>
          )}

          {/* Barra de búsqueda y estadísticas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1 max-w-md">
                  <div className="relative flex-1">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar paquetes / planes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="min-w-[200px]">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="grupal">Grupal / Exos Training</option>
                    <option value="personalizado">Personalizado</option>
                    <option value="sesion">Terapia / Therapy</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-6 text-sm text-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-700">{filteredPackages.length}</div>
                  <div>
                    {selectedSucursal === ALL_SUCURSALES_ID 
                      ? 'Paquetes / Planes' 
                      : `En ${getSucursal(selectedSucursal)?.name}`
                    }
                  </div>
                </div>
                {selectedSucursal !== ALL_SUCURSALES_ID && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">{packages.length}</div>
                    <div>Total general</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {totalActiveAssignments}
                  </div>
                  <div>Asignaciones activas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de paquetes */}
          {filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <FontAwesomeIcon icon={faPackage} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No se encontraron paquetes/planes
                  </h3>
                  <p className="text-gray-400">
                    Intenta con otros términos de búsqueda
                  </p>
                </div>
              ) : (
                <div>
                  <FontAwesomeIcon icon={faPackage} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No hay paquetes/planes creados
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Crea tu primer paquete/plan para comenzar a gestionar servicios
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                    Crear primer paquete
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {currentPackages.map(pkg => (
                    <div key={pkg.id} className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-2 border-cyan-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-cyan-300 relative overflow-hidden">
                      {/* Imagen del paquete y tipo */}
                      <div className="w-full h-[150px] bg-gray-100 overflow-hidden relative group">
                        {/* Chip tipo de paquete arriba */}
                        {pkg.tipo && (
                          <span className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold shadow-md ${pkg.tipo === 'grupal' ? 'bg-emerald-100 text-emerald-700' :
                            pkg.tipo === 'personalizado' ? 'bg-orange-100 text-orange-700' :
                              pkg.tipo === 'sesion' ? 'bg-pink-100 text-pink-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {pkg.tipo === 'grupal' ? 'Grupal / Exos Training' :
                             pkg.tipo === 'personalizado' ? 'Personalizado' :
                             pkg.tipo === 'sesion' ? 'Terapia / Therapy' :
                             pkg.tipo.charAt(0).toUpperCase() + pkg.tipo.slice(1)}
                          </span>
                        )}
                        {/* Badge de sesiones debajo del tipo de paquete */}
                        <span className="absolute left-3 top-10 z-10 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-600 text-white shadow-md">
                          {pkg.sessions || pkg.sessionsIncluded || 0} sesiones
                        </span>
                        {pkg.imageUrl ? (
                          <img
                            src={pkg.imageUrl}
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        {/* Placeholder cuando no hay imagen */}
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-150 to-cyan-200 ${pkg.imageUrl ? 'hidden' : 'flex'}`}>
                          <FontAwesomeIcon icon={faPackage} className="w-12 h-12 text-cyan-400" />
                        </div>
                      </div>
                      {/* Contenido de la tarjeta */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-slate-700 mb-1 leading-tight line-clamp-1">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                          )}
                          <hr className="my-4 border-cyan-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-6 h-6 text-cyan-500 mr-2" />
                            <span className="text-sm font-bold text-cyan-700">{formatPrice(pkg.price)}</span>
                            {pkg.paymentType && (
                              <span className="text-xs text-gray-500 ml-2">Tipo pago: <span className="font-bold text-cyan-700">{pkg.paymentType}</span></span>
                            )}
                          </div>
                          <div className="flex items-center whitespace-nowrap">
                            <FontAwesomeIcon icon={faUsersIcon} className="w-5 h-5 text-cyan-500 mr-2" />
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-600 text-white">
                              {assignedCounts[pkg.id] || 0}
                            </span>
                            <span className="text-sm font-bold text-cyan-700 ml-2">asignados</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-semibold text-cyan-700 mr-1">Público objetivo:</span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${pkg.targetAudience === 'atletas' ? 'bg-blue-800 text-blue-100' :
                                pkg.targetAudience === 'clientes' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-purple-100 text-purple-800'}
                      `}>
                              {getAudienceLabel(pkg.targetAudience)}
                            </span>
                          </div>
                          {/* Sucursales del paquete */}
                          <div className="flex items-start gap-2 pt-1">
                            <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600 line-clamp-2">
                              {getPackageSucursalesNames(pkg)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Botones de acción */}
                      <div className="pt-4 border-t border-cyan-200" style={{ padding: '15px' }}>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Ver detalles */}
                          <div className="relative group">
                            <button
                              onClick={() => handleViewDetails(pkg)}
                              className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-xl hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                              title="Ver detalles"
                            >
                              <FontAwesomeIcon icon={faEye} className="w-5 h-5 text-white" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Ver detalles
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                          {/* Ver usuarios asignados */}
                          <div className="relative group">
                            <button
                              onClick={() => handleViewUsers(pkg)}
                              className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                              title="Ver usuarios asignados"
                              disabled={assignedCounts[pkg.id] === 0}
                            >
                              <FontAwesomeIcon icon={faUsersIcon} className="w-5 h-5 text-white" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Ver usuarios asignados
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                          {/* Editar */}
                          <div className="relative group">
                            <button
                              onClick={() => router.push(`/paquetes/editar/${pkg.id}`)}
                              className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                              title="Editar"
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Editar
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                          {/* Eliminar */}
                          <div className="relative group">
                            <button
                              onClick={() => {
                                const usersCount = assignedCounts[pkg.id] || 0;
                                const confirmMessage = usersCount > 0
                                  ? `¿Estás seguro de eliminar el paquete "${pkg.name}"?\n\nEste paquete está asignado a ${usersCount} usuario(s) y será removido de todos ellos.\n\nEsta acción no se puede deshacer.`
                                  : `¿Estás seguro de eliminar el paquete "${pkg.name}"?\n\nEsta acción no se puede deshacer.`;
                                if (window.confirm(confirmMessage)) {
                                  handleDeletePackage(pkg.id);
                                }
                              }}
                              disabled={deletingPackages.has(pkg.id)}
                              className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar"
                            >
                              {deletingPackages.has(pkg.id) ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FontAwesomeIcon icon={faTrash2} className="w-5 h-5" />
                              )}
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Eliminar
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Vista de Tabla HTML
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Paquete
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Precio
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Sesiones
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Asignaciones
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Clientes
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Sucursales
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentPackages.map(pkg => (
                        <tr key={pkg.id} className="hover:bg-gray-50 transition-colors duration-150">
                          {/* Columna: Paquete (nombre + descripción) */}
                          <td className="px-6 py-4">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {pkg.name}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {pkg.description}
                              </div>
                            </div>
                          </td>

                          {/* Columna: Precio */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(pkg.price)}
                              </span>
                            </div>
                          </td>

                          {/* Columna: Sesiones */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                              {pkg.sessions || pkg.sessionsIncluded || 0}
                            </span>
                          </td>

                          {/* Columna: Asignaciones */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-end justify-end gap-1">
                              <FontAwesomeIcon icon={faUsersIcon} className="w-3.5 h-3.5 text-cyan-600" />
                              <span className="text-sm text-gray-700 font-medium">
                                {assignedCounts[pkg.id] || 0}
                              </span>
                            </div>
                          </td>

                          {/* Columna: Clientes (tipo de público) */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${pkg.targetAudience === 'clientes'
                              ? 'bg-cyan-100 text-cyan-800'
                              : pkg.targetAudience === 'atletas'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-teal-100 text-teal-800'
                              }`}>
                              {getAudienceLabel(pkg.targetAudience)}
                            </span>
                          </td>

                          {/* Columna: Sucursales */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 max-w-[180px]">
                              <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600 truncate" title={getPackageSucursalesNames(pkg)}>
                                {getPackageSucursalesNames(pkg)}
                              </span>
                            </div>
                          </td>

                          {/* Columna: Estado */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${pkg.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {pkg.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          {/* Columna: Acciones */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-start gap-1">
                              {/* Ver detalles */}
                              <div className="relative group">
                                <button
                                  onClick={() => handleViewDetails(pkg)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm transform hover:scale-110"
                                  title="Ver detalles"
                                >
                                  <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5 text-white" />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                  Ver detalles
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                              {/* Ver usuarios asignados */}
                              {(assignedCounts[pkg.id] || 0) > 0 && (
                                <div className="relative group">
                                  <button
                                    onClick={() => handleViewUsers(pkg)}
                                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-sm transform hover:scale-110"
                                    title={`Ver ${assignedCounts[pkg.id]} usuario(s) asignado(s)`}
                                  >
                                    <FontAwesomeIcon icon={faUsersIcon} className="w-3.5 h-3.5 text-white" />
                                  </button>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    Ver usuarios asignados
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              )}
                              {/* Editar */}
                              <div className="relative group">
                                <button
                                  onClick={() => router.push(`/paquetes/editar/${pkg.id}`)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm transform hover:scale-110"
                                  title="Editar"
                                >
                                  <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                  Editar
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                              {/* Eliminar */}
                              <div className="relative group">
                                <button
                                  onClick={() => {
                                    const usersCount = assignedCounts[pkg.id] || 0;
                                    const confirmMessage = usersCount > 0
                                      ? `¿Estás seguro de eliminar el paquete \"${pkg.name}\"?\n\nEste paquete está asignado a ${usersCount} usuario(s) y será removido de todos ellos.\n\nEsta acción no se puede deshacer.`
                                      : `¿Estás seguro de eliminar el paquete \"${pkg.name}\"?\n\nEsta acción no se puede deshacer.`;
                                    if (window.confirm(confirmMessage)) {
                                      handleDeletePackage(pkg.id);
                                    }
                                  }}
                                  disabled={deletingPackages.has(pkg.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Eliminar"
                                >
                                  {deletingPackages.has(pkg.id) ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FontAwesomeIcon icon={faTrash2} className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                  Eliminar
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Controles de paginación */}
              {filteredPackages.length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{startIndex + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(endIndex, filteredPackages.length)}</span> de{' '}
                    <span className="font-semibold">{filteredPackages.length}</span> paquetes
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === pageNum
                            ? 'bg-cyan-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>


      {/* Side Panel de Detalles del Paquete */}
      <PackageDetailPanel
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        packageData={selectedPackageForDetail}
      />

      {/* Modal de Usuarios Afectados */}
      {affectedUsersModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faUsersIcon} className="w-7 h-7" />
                Usuarios Afectados por la Eliminación
              </h3>
              <p className="text-amber-50 mt-2">
                El paquete ha sido eliminado y desasignado de los siguientes usuarios:
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {affectedUsersModal.users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No había usuarios con este paquete asignado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {affectedUsersModal.users.map((user, index) => (
                    <div
                      key={`${user.userId}-${index}`}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-800">
                              {user.userName}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.userCollection === 'clientes'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                              }`}>
                              {user.userCollection === 'clientes' ? 'Cliente' : 'Atleta'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                              }`}>
                              {user.status || 'Sin estado'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Paquete:</strong> {user.packageName}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Sesiones restantes:</strong> {user.sesionesRestantes}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resumen */}
              {affectedUsersModal.users.length > 0 && (
                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-emerald-800 font-medium">
                    Total de usuarios afectados: <strong>{affectedUsersModal.users.length}</strong>
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Todos los paquetes han sido eliminados de estos usuarios.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setAffectedUsersModal({ open: false, users: [] })}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Implementar SSR para la página de paquetes
export async function getServerSideProps(context) {
  return {
    props: {
      title: "Gestión de Paquetes / Planes - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Paquetes y Planes', href: '/paquetes', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico'], // Admin y médicos pueden gestionar paquetes
      activeSection: "paquetes"
    }
  };
}

export default PaquetesPage;
