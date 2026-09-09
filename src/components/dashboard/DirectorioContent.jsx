'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faPlus,
  faEnvelope,
  faUser,
  faMagnifyingGlass,
  faMobileAlt,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import useViewStore from '../../store/viewStore';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';
import DirectorioSkeleton from '../common/DirectorioSkeleton';
import { showSuccessToast, showErrorToast } from '../../utils/toast';

const DirectorioContent = ({ searchTerm = '', initialProfesionales = [] }) => {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const sucursales = useSucursalStore((state) => state.sucursales);
  const [profesionales, setProfesionales] = useState(initialProfesionales);
  const [profesionalesLoading, setProfesionalesLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(initialProfesionales.length > 0);

  // Helper para obtener nombres de sucursales
  const getSucursalesNames = (profesional) => {
    const sucursalesArray = Array.isArray(profesional.sucursales) 
      ? profesional.sucursales 
      : (profesional.sucursal ? [profesional.sucursal] : []);
    
    if (sucursalesArray.length === 0) return ['Sin sucursal'];
    
    return sucursalesArray.map(sucursalId => {
      const sucursal = sucursales.find(s => s.id === sucursalId);
      return sucursal ? sucursal.name : sucursalId;
    });
  };

  // Estados para eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profesionalToDelete, setProfesionalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Función para cargar profesionales usando API
  const fetchProfesionales = async (search = '') => {
    try {
      setProfesionalesLoading(true);

      const url = new URL('/api/directorio', window.location.origin);
      if (search.trim()) {
        url.searchParams.set('search', search.trim());
      } else {
        // Sin búsqueda, cargar todos los profesionales
        url.searchParams.set('limit', 'all');
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setProfesionales(result.data);
      } else {
        console.error('Error fetching profesionales:', result.error);
        setProfesionales([]);
      }
    } catch (error) {
      console.error('Error fetching profesionales:', error);
      setProfesionales([]);
    } finally {
      setProfesionalesLoading(false);
    }
  };

  useEffect(() => {
    // Solo hacer fetch inicial si no tenemos datos SSR
    if (!hasInitialData) {
      fetchProfesionales();
    }
  }, [hasInitialData]);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    if (!searchTerm) {
      // Si no hay término de búsqueda, cargar todos los profesionales
      // Solo usar datos iniciales en la primera carga
      if (hasInitialData && profesionales.length === 0) {
        setProfesionales(initialProfesionales);
        setSearchLoading(false);
      } else if (!hasInitialData || profesionales.length > 0) {
        // Si ya hicimos búsquedas antes, cargar todos los profesionales
        setSearchLoading(true);
        fetchProfesionales('').finally(() => {
          setSearchLoading(false);
        });
      }
      return;
    }

    setSearchLoading(true);

    // Debounce de 500ms para evitar muchas llamadas a la API
    const timeoutId = setTimeout(() => {
      fetchProfesionales(searchTerm).finally(() => {
        setSearchLoading(false);
      });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, initialProfesionales, hasInitialData]);

  const selectedSucursal = useSucursalStore((state) => state.selectedSucursal);

  // Filtrar profesionales en tiempo real basándose en el término de búsqueda y sucursal
  const filteredProfesionales = useMemo(() => {
    let data = [];

    // Si estamos buscando o no hay datos iniciales, usar los datos del estado
    if (searchTerm.trim() || initialProfesionales.length === 0) {
      data = profesionales;
    } else {
      // Si no hay búsqueda y tenemos datos iniciales, usar esos datos sin filtrar
      data = profesionales.length > 0 ? profesionales : initialProfesionales;
    }

    // Filtrar por sucursal
    if (selectedSucursal && selectedSucursal !== ALL_SUCURSALES_ID) {
      console.log('🔍 Filtrando por sucursal:', selectedSucursal);
      console.log('📋 Profesionales antes de filtrar:', data.map(p => ({ nombre: p.nombre, sucursales: p.sucursales, sucursal: p.sucursal })));
      data = data.filter(p => {
        // Manejar tanto el formato nuevo (array) como el antiguo (string)
        const sucursalesArray = Array.isArray(p.sucursales) 
          ? p.sucursales 
          : (p.sucursal ? [p.sucursal] : []);
        return sucursalesArray.includes(selectedSucursal);
      });
      console.log('✅ Profesionales después de filtrar:', data.map(p => ({ nombre: p.nombre, sucursales: p.sucursales })));
    }

    return data;
  }, [profesionales, searchTerm, initialProfesionales, selectedSucursal]);

  // Calcular la paginación
  const totalPages = Math.ceil(filteredProfesionales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProfesionales = filteredProfesionales.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el filtro de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1);

      // Calcular el rango alrededor de la página actual
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 3) {
        endPage = 4;
      }

      // Ajustar si estamos cerca del final
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }

      // Agregar puntos suspensivos al inicio si es necesario
      if (startPage > 2) {
        pages.push('...');
      }

      // Agregar páginas del rango
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Agregar puntos suspensivos al final si es necesario
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Siempre mostrar la última página
      pages.push(totalPages);
    }

    return pages;
  };

  const handleDirectorSuccess = async () => {
    setHasInitialData(false); // Forzar refresh después de crear/editar profesional
    await fetchProfesionales(searchTerm);
  };

  // Manejar edición de profesional
  const handleEditProfesional = (profesional) => {
    router.push(`/directorio/editar/${profesional.id}`);
  };

  // Manejar eliminación de profesional
  const handleDeleteProfesional = (profesional) => {
    setProfesionalToDelete(profesional);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!profesionalToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/directorio/${profesionalToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showSuccessToast('Profesional eliminado exitosamente');
        await fetchProfesionales(searchTerm);
        setIsDeleteModalOpen(false);
        setProfesionalToDelete(null);
      } else {
        showErrorToast(result.error || 'Error al eliminar el profesional');
      }
    } catch (error) {
      console.error('Error deleting professional:', error);
      showErrorToast('Error al eliminar el profesional');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProfesionalToDelete(null);
  };

  // Manejar vista de detalle
  const handleViewDetail = (profesionalId) => {
    router.push(`/directorio/${profesionalId}`);
  };

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-base text-gray-500">
          {(profesionalesLoading || searchLoading)
            ? 'Cargando...'
            : `${filteredProfesionales.length} integrante${filteredProfesionales.length === 1 ? '' : 's'} de personal interno${searchTerm ? ` para "${searchTerm}"` : ''}`
          }
        </p>
        <button
          onClick={() => router.push('/directorio/nuevo')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c4040] hover:bg-[#143030] text-white text-base font-medium rounded-lg transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4 text-[#c2ef03]" />
          Nuevo Coach / Staff
        </button>
      </div>

      {/* Content area */}
      <div>
        {(profesionalesLoading || searchLoading) ? (
          <DirectorioSkeleton viewMode={viewMode} count={6} />
        ) : filteredProfesionales.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#f4f8f8] flex items-center justify-center mx-auto mb-3">
              {searchTerm ? (
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5 text-gray-300" />
              ) : (
                <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-[#1c4040]" />
              )}
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">
              {searchTerm ? 'Sin coincidencias' : 'Sin personal interno registrado'}
            </p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {searchTerm
                ? `No se encontraron resultados para "${searchTerm}".`
                : 'Agrega a tu primer coach o integrante de personal interno.'
              }
            </p>
          </div>
        ) : (
          <div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentProfesionales.map((profesional) => (
                  <div
                    key={profesional.id}
                    className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-4 transition-all duration-200 cursor-pointer"
                    onClick={() => handleViewDetail(profesional.id)}
                  >
                    <div className="flex items-start gap-3.5">
                      {profesional.foto ? (
                        <img
                          src={profesional.foto}
                          alt={`${profesional.nombre} ${profesional.apellidoPaterno}`}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-gray-900 truncate">
                            {profesional.nombre} {profesional.apellidoPaterno} {profesional.apellidoMaterno}
                          </h4>
                          <span className={`shrink-0 w-2 h-2 rounded-full ${profesional.status === 'active' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{profesional.puesto || profesional.ocupacion || 'Profesional'}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                      {profesional.email && (
                        <div className="flex items-center gap-2 truncate">
                          <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          <span className="truncate">{profesional.email}</span>
                        </div>
                      )}
                      {profesional.telefonoContacto && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faMobileAlt} className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          <span>{profesional.telefonoContacto}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {profesional.especialidad && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-50 text-cyan-700">{profesional.especialidad}</span>
                        )}
                        {profesional.area && (
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-600">{profesional.area}</span>
                        )}
                        {getSucursalesNames(profesional).map((nombre, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500">{nombre}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditProfesional(profesional); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteProfesional(profesional); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Profesional</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Especialidad</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[180px]">Sucursales</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Área</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-5 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProfesionales.map((profesional) => (
                      <tr
                        key={profesional.id}
                        className="group border-b border-gray-50 last:border-0 hover:bg-cyan-50/40 transition-colors cursor-pointer"
                        onClick={() => handleViewDetail(profesional.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {profesional.foto ? (
                              <img src={profesional.foto} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-base font-medium text-gray-900 truncate">{profesional.nombre} {profesional.apellidoPaterno} {profesional.apellidoMaterno}</p>
                              {profesional.puesto && <p className="text-xs text-gray-400">{profesional.puesto}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-base text-gray-600">{profesional.especialidad || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm text-gray-600 truncate max-w-[200px]">{profesional.email || '—'}</div>
                          {profesional.telefonoContacto && <div className="text-xs text-gray-400 mt-0.5">{profesional.telefonoContacto}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {getSucursalesNames(profesional).map((nombre, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500">{nombre}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {profesional.area ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-600">{profesional.area}</span>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${profesional.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${profesional.status === 'active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                            {profesional.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditProfesional(profesional); }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteProfesional(profesional); }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {startIndex + 1}–{Math.min(endIndex, filteredProfesionales.length)} de {filteredProfesionales.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Anterior
                  </button>
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2.5 py-2 text-sm text-gray-400">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 text-sm font-medium rounded-md transition-colors ${currentPage === pageNum ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        profesional={profesionalToDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DirectorioContent;
