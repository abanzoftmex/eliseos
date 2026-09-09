import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faShoppingBag, faMagnifyingGlass as faSearch, faTrash as faTrash2, faEdit, faUsers as faUsersIcon, faEye } from '@fortawesome/free-solid-svg-icons';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

import ViewToggle from '../../components/common/ViewToggle';
import useViewStore from '../../store/viewStore';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';
import {
  getProductos,
  deleteProducto,
  getProductoAssignmentCounts,
  getAllProductosInventario,
  formatPrice
} from '../../../lib/firebase/productosService';

function ProductosPage() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const selectedSucursal = useSucursalStore(state => state.selectedSucursal);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingProductos, setDeletingProductos] = useState(new Set());
  const [assignedCounts, setAssignedCounts] = useState({});
  const [inventarios, setInventarios] = useState({});
  const [totalActiveAssignments, setTotalActiveAssignments] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [affectedUsersModal, setAffectedUsersModal] = useState({ open: false, users: [] });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sincronizar página con URL
  useEffect(() => {
    if (router.isReady) {
      const page = parseInt(router.query.page) || 1;
      setCurrentPage(page);
    }
  }, [router.isReady, router.query.page]);

  const handlePageChange = (newPage) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: newPage }
    }, undefined, { shallow: true });
  };

  const loadAssignedCounts = useCallback(async () => {
    try {
      const result = await getProductoAssignmentCounts();
      if (result.success) {
        setAssignedCounts(result.counts);
        setTotalActiveAssignments(result.totalActive);
      }
    } catch (error) {
      console.error('Error loading assigned counts:', error);
    }
  }, []);

  const loadProductos = useCallback(async () => {
    setLoading(true);
    try {
      const [productosResult, inventariosResult] = await Promise.all([
        getProductos(),
        getAllProductosInventario()
      ]);

      if (productosResult.success) {
        setProductos(productosResult.productos);
        await loadAssignedCounts();
      } else {
        showMessage('error', productosResult.error);
      }

      if (inventariosResult.success) {
        setInventarios(inventariosResult.inventarios);
      } else {
        console.error('Error loading inventarios:', inventariosResult.error);
      }
    } catch (error) {
      console.error('Error loading productos:', error);
      showMessage('error', 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [loadAssignedCounts]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleDeleteProducto = async (productoId) => {
    setDeletingProductos(prev => new Set([...prev, productoId]));

    try {
      const result = await deleteProducto(productoId);
      if (result.success) {
        setProductos(prev => prev.filter(prod => prod.id !== productoId));

        if (result.affectedUsers && result.affectedUsers.length > 0) {
          setAffectedUsersModal({
            open: true,
            users: result.affectedUsers
          });
          showMessage('success', result.message || 'Producto eliminado exitosamente');
        } else {
          showMessage('success', 'Producto eliminado exitosamente (sin asignaciones)');
        }

        await loadAssignedCounts();
        // Recargar inventarios después de eliminar
        try {
          const inventariosResult = await getAllProductosInventario();
          if (inventariosResult.success) {
            setInventarios(inventariosResult.inventarios);
          }
        } catch (error) {
          console.error('Error reloading inventarios:', error);
        }
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error deleting producto:', error);
      showMessage('error', 'Error al eliminar el producto');
    } finally {
      setDeletingProductos(prev => {
        const newSet = new Set(prev);
        newSet.delete(productoId);
        return newSet;
      });
    }
  };

  const handleCreateNew = () => {
    router.push('/productos/nuevo');
  };

  // Filtrado de productos
  const filteredProductos = productos.filter(producto => {
    // Filtrado por buscador
    const matchesSearch = producto.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrado por sucursal
    const matchesSucursal = selectedSucursal === ALL_SUCURSALES_ID ||
      (!producto.sucursales || producto.sucursales.length === 0) ||
      producto.sucursales.includes(selectedSucursal);

    return matchesSearch && matchesSucursal;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProductos = filteredProductos.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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
          <p className="mt-4 text-gray-600">Cargando productos...</p>
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
              <h1 className="text-3xl font-bold text-[#1c4040] flex items-center gap-3">
                <FontAwesomeIcon icon={faShoppingBag} className="w-8 h-8 text-[#1c4040]" />
                Gestión de Productos Únicos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Administra productos con cargo único y sin sesiones
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
              Nuevo producto
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
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 text-sm text-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-700">{productos.length}</div>
                  <div>Productos creados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {totalActiveAssignments}
                  </div>
                  <div>Asignaciones activas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          {filteredProductos.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <FontAwesomeIcon icon={faShoppingBag} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-gray-400">
                    Intenta con otros términos de búsqueda
                  </p>
                </div>
              ) : (
                <div>
                  <FontAwesomeIcon icon={faShoppingBag} className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No hay productos creados
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Crea tu primer producto para comenzar a gestionar servicios únicos
                  </p>
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                    Crear primer producto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {currentProductos.map(producto => (
                    <div key={producto.id} className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-2 border-cyan-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-cyan-300 relative overflow-hidden">
                      {/* Imagen del producto */}
                      <div className="w-full h-[150px] bg-gray-100 overflow-hidden relative group">
                        {producto.imageUrl ? (
                          <img
                            src={producto.imageUrl}
                            alt={producto.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        {/* Placeholder cuando no hay imagen */}
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-200 ${producto.imageUrl ? 'hidden' : 'flex'}`}>
                          <FontAwesomeIcon icon={faShoppingBag} className="w-12 h-12 text-cyan-400" />
                        </div>
                      </div>
                      {/* Contenido de la tarjeta */}
                      <div className="p-6">
                        <div className="mb-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-slate-700 mb-1 leading-tight line-clamp-1">{producto.name}</h3>
                            {producto.tipo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {producto.tipo}
                              </span>
                            )}
                          </div>
                          {producto.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{producto.description}</p>
                          )}
                          <hr className="my-4 border-cyan-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-6 h-6 text-cyan-500 mr-2" />
                            <span className="text-sm font-bold text-cyan-700">{formatPrice(producto.price)}</span>
                            <span className="text-xs text-gray-500 ml-2">Cargo único</span>
                          </div>
                          <div className="flex items-center whitespace-nowrap">
                            <FontAwesomeIcon icon={faUsersIcon} className="w-5 h-5 text-cyan-500 mr-2" />
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-600 text-white">
                              {assignedCounts[producto.id]?.total || 0}
                            </span>
                            <span className="text-sm font-bold text-cyan-700 ml-2">asignados</span>
                          </div>
                          {/* Inventario */}
                          <div className="flex items-center whitespace-nowrap">
                            <FontAwesomeIcon icon={faShoppingBag} className="w-5 h-5 text-purple-500 mr-2" />
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${inventarios[producto.id]?.disponible > 0
                              ? 'bg-green-600 text-white'
                              : inventarios[producto.id]?.disponible === 0
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-400 text-white'
                              }`}>
                              {inventarios[producto.id]?.disponible ?? 'N/A'}
                            </span>
                            <span className="text-sm font-bold text-purple-700 ml-2">disponibles</span>
                          </div>
                        </div>
                      </div>
                      {/* Botones de acción */}
                      <div className="pt-4 border-t border-cyan-200" style={{ padding: '15px' }}>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Editar */}
                          <div className="relative group">
                            <button
                              onClick={() => router.push(`/productos/editar/${producto.id}`)}
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
                                const usersCount = assignedCounts[producto.id]?.total || 0;
                                const confirmMessage = usersCount > 0
                                  ? `¿Estás seguro de eliminar el producto "${producto.name}"?\n\nEste producto está asignado a ${usersCount} usuario(s) y será removido de todos ellos.\n\nEsta acción no se puede deshacer.`
                                  : `¿Estás seguro de eliminar el producto "${producto.name}"?\n\nEsta acción no se puede deshacer.`;
                                if (window.confirm(confirmMessage)) {
                                  handleDeleteProducto(producto.id);
                                }
                              }}
                              disabled={deletingProductos.has(producto.id)}
                              className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar"
                            >
                              {deletingProductos.has(producto.id) ? (
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
                // Vista de Tabla
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Producto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Precio
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Asignaciones
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Tipo
                          Inventario
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
                      {currentProductos.map(producto => (
                        <tr key={producto.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {producto.name}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {producto.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(producto.price)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FontAwesomeIcon icon={faUsersIcon} className="w-3.5 h-3.5 text-cyan-600" />
                              <span className="text-sm text-gray-700 font-medium">
                                {assignedCounts[producto.id]?.total || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {
                              producto.tipo ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {producto.tipo}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )
                            }
                            <div className="flex items-center justify-center gap-1">
                              <FontAwesomeIcon icon={faShoppingBag} className="w-3.5 h-3.5 text-purple-600" />
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${inventarios[producto.id]?.disponible > 0
                                ? 'bg-green-100 text-green-800'
                                : inventarios[producto.id]?.disponible === 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                {inventarios[producto.id]?.disponible ?? 'N/A'}
                              </span>
                            </div>
                          </td >
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${producto.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {producto.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="relative group">
                                <button
                                  onClick={() => router.push(`/productos/editar/${producto.id}`)}
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
                              <div className="relative group">
                                <button
                                  onClick={() => {
                                    const usersCount = assignedCounts[producto.id]?.total || 0;
                                    const confirmMessage = usersCount > 0
                                      ? `¿Estás seguro de eliminar el producto "${producto.name}"?\n\nEste producto está asignado a ${usersCount} usuario(s) y será removido de todos ellos.\n\nEsta acción no se puede deshacer.`
                                      : `¿Estás seguro de eliminar el producto "${producto.name}"?\n\nEsta acción no se puede deshacer.`;
                                    if (window.confirm(confirmMessage)) {
                                      handleDeleteProducto(producto.id);
                                    }
                                  }}
                                  disabled={deletingProductos.has(producto.id)}
                                  className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Eliminar"
                                >
                                  {deletingProductos.has(producto.id) ? (
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
                        </tr >
                      ))
                      }
                    </tbody >
                  </table >
                </div >
              )}

              {/* Controles de paginación */}
              {
                filteredProductos.length > itemsPerPage && (
                  <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <div className="text-sm text-gray-600">
                      Mostrando <span className="font-semibold">{startIndex + 1}</span> a{' '}
                      <span className="font-semibold">{Math.min(endIndex, filteredProductos.length)}</span> de{' '}
                      <span className="font-semibold">{filteredProductos.length}</span> productos
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                            onClick={() => handlePageChange(pageNum)}
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
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )
              }
            </>
          )}
        </div >
      </main >

      {/* Modal de Usuarios Afectados */}
      {
        affectedUsersModal.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsersIcon} className="w-7 h-7" />
                  Usuarios Afectados por la Eliminación
                </h3>
                <p className="text-amber-50 mt-2">
                  El producto ha sido eliminado y desasignado de los siguientes usuarios:
                </p>
              </div>

              <div className="flex-1 overflow-auto p-6">
                {affectedUsersModal.users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No había usuarios con este producto asignado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {affectedUsersModal.users.map((user, index) => (
                      <div
                        key={`${user.userId}-${index}`}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-cyan-300 transition-colors"
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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'activo'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}>
                                {user.status || 'Sin estado'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <strong>Producto:</strong> {user.productoName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {affectedUsersModal.users.length > 0 && (
                  <div className="mt-6 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <p className="text-cyan-800 font-medium">
                      Total de usuarios afectados: <strong>{affectedUsersModal.users.length}</strong>
                    </p>
                    <p className="text-sm text-cyan-600 mt-1">
                      Todos los productos han sido eliminados de estos usuarios.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setAffectedUsersModal({ open: false, users: [] })}
                  className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      title: "Gestión de Productos Únicos - Elíseos Box & Fitness",
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Productos Únicos', href: '/productos', isLast: true }
      ],
      showBreadcrumbs: true,
      requireAuth: true,
      allowedRoles: ['admin', 'medico'],
      activeSection: "productos"
    }
  };
}

export default ProductosPage;
