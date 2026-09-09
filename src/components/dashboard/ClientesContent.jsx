'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import useAuthStore from '../../store/authStore';
import { hasPermission } from '../../utils/permissionsUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faPlus,
  faEnvelope,
  faFileText,
  faCalendar,
  faBox,
  faSearch,
  faPhone,
  faEdit,
  faTrashAlt,
  faUser,
  faNoteSticky,
  faChevronLeft,
  faChevronRight,
  faPersonRunning,
  faHeartPulse,
  faEllipsisV,
  faTimes,
  faFileClipboard,
  faAward,
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import useViewStore from '../../store/viewStore';
import useSucursalStore from '../../store/sucursalStore';
import ClientesSkeleton from '../common/ClientesSkeleton';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import NotasSidePanel from '../NotasSidePanel';

// Función global para invalidar el caché de clientes (se usa al crear nuevo paciente)
export const invalidateClientesCache = () => {
  // Invalida todas las URLs que empiecen con /api/clientes
  mutate(
    key => typeof key === 'string' && key.startsWith(window.location.origin + '/api/clientes'),
    undefined,
    { revalidate: true }
  );
};

const ClientesContent = ({ searchTerm = '', initialClientes = [], initialDrafts = { normalDrafts: {}, atletaDrafts: {} }, filterType = null, sortBy = 'nombre' }) => {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const sucursales = useSucursalStore((state) => state.sucursales);
  const explicitSucursalFilter =
    typeof router.query.sucursal === 'string' ? router.query.sucursal : '';

  // Helper para obtener nombres de sucursales
  const getSucursalesNames = (cliente) => {
    const sucursalesArray = Array.isArray(cliente.sucursales)
      ? cliente.sucursales
      : (cliente.sucursal ? [cliente.sucursal] : []);

    if (sucursalesArray.length === 0) return ['Sin sucursal'];

    return sucursalesArray.map(sucursalId => {
      // Si sucursalId ya es un nombre (string largo), devolverlo directamente
      if (typeof sucursalId === 'string' && sucursalId.length > 25) {
        return sucursalId;
      }

      const sucursal = sucursales.find(s => s.id === sucursalId);
      if (!sucursal) {
        // Si no se encuentra, devolver el ID tal cual (podría ser un nombre guardado directamente)
        return sucursalId;
      }
      return sucursal.name;
    });
  };
  const { userRole } = useAuthStore();
  // REMOVED: Draft states - draft functionality has been eliminated

  // Estados para paginación - ANTES de usarlos
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Estados para eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para sidepanel de notas
  const [isNotasPanelOpen, setIsNotasPanelOpen] = useState(false);
  const [clienteForNotas, setClienteForNotas] = useState(null);

  // Estado para panel de acciones en móviles
  const [activeActionPanel, setActiveActionPanel] = useState(null);

  // Estado para modal de acciones en vista de tabla
  const [activeTableModal, setActiveTableModal] = useState(null);
  const [tableModalPosition, setTableModalPosition] = useState({ top: 0, right: 0 });

  // Close modal on scroll or resize
  useEffect(() => {
    const handleClose = () => {
      if (activeTableModal) setActiveTableModal(null);
    };

    if (activeTableModal) {
      window.addEventListener('scroll', handleClose, true);
      window.addEventListener('resize', handleClose);
    }

    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeTableModal]);

  // Fetcher function para SWR
  const fetcher = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching data');
    return response.json();
  };

  // Construir URL para el cache key
  const buildClientesUrl = (page, search, sucursalFilter, tipoFilter, sortByParam) => {
    const url = new URL('/api/clientes', window.location.origin);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('pageSize', itemsPerPage.toString());
    const hasExplicitSearch = Boolean(search?.trim());

    if (hasExplicitSearch) {
      url.searchParams.set('search', search.trim());
    }

    // Solo aplicar filtro de sucursal cuando sea explícito en esta pantalla.
    if (sucursalFilter && sucursalFilter !== 'todas') {
      url.searchParams.set('sucursal', sucursalFilter);
    }

    if (tipoFilter && tipoFilter !== 'todos') {
      url.searchParams.set('tipo', tipoFilter);
    }

    // Filtrar solo clientes con consultas cuando el filtro es "pacientes-atletas"
    if (filterType === 'pacientes-atletas') {
      url.searchParams.set('hasConsulta', 'true');
    } else if (filterType === 'clientes') {
      // Filtrar solo clientes SIN consultas
      url.searchParams.set('hasConsulta', 'false');
    }

    if (sortByParam && sortByParam !== 'nombre') {
      url.searchParams.set('sortBy', sortByParam);
    }

    return url.toString();
  };

  // Usar SWR para caché automático
  const clientesUrl = buildClientesUrl(currentPage, searchTerm, explicitSucursalFilter, filterType, sortBy);
  const { data: clientesData, error, isLoading } = useSWR(
    clientesUrl,
    fetcher,
    {
      revalidateOnMount: true,      // Revalidar datos cada vez que el componente se monta
      revalidateOnFocus: true,      // Revalidar cuando el usuario regresa a la pestaña/ventana
      revalidateOnReconnect: true,  // Revalidar cuando se reconecta la conexión
      dedupingInterval: 3000,       // Evitar requests duplicados en 3 segundos
      refreshInterval: 60000,       // Refrescar en segundo plano cada 60 segundos (sync entre dispositivos)
    }
  );

  // Extraer datos del response de SWR
  const clientes = clientesData?.data || [];
  const totalPages = clientesData?.pagination?.totalPages || 1;
  const totalCount = clientesData?.pagination?.totalItems || 0;

  // REMOVED: loadDrafts function - draft functionality has been eliminated

  // REMOVED: useEffects for loading drafts - draft functionality has been eliminated

  // Reset a página 1 cuando cambian los filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      router.replace({ pathname: router.pathname, query: { ...router.query, page: 1 } }, undefined, { shallow: true });
    }
  }, [explicitSucursalFilter, filterType]);

  // Búsqueda en tiempo real
  useEffect(() => {
    setCurrentPage(1); // Reset a primera página

    // Actualizar URL sin page cuando hay búsqueda
    const query = { ...router.query };
    delete query.page;
    if (searchTerm) query.search = searchTerm;
    else delete query.search;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [searchTerm]);

  // Los datos ya vienen filtrados y paginados del backend
  const displayClientes = useMemo(() => {
    return clientes;
  }, [clientes]);

  // Funciones de paginación - SWR se encarga de fetch automáticamente
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      router.push({ pathname: router.pathname, query: { ...router.query, page: nextPage } }, undefined, { shallow: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      router.push({ pathname: router.pathname, query: { ...router.query, page: prevPage } }, undefined, { shallow: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToPage = (page) => {
    setCurrentPage(page);
    router.push({ pathname: router.pathname, query: { ...router.query, page } }, undefined, { shallow: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenClienteModal = () => {
    router.push('/clientes/nuevo');
  };

  // Manejar edición de cliente - navegar a página de edición
  const handleEditCliente = (cliente) => {
    router.push(`/clientes/${cliente.id}/editar`);
  };

  // Manejar eliminación de cliente
  const handleDeleteCliente = (cliente) => {
    setClienteToDelete(cliente);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;

    try {
      setIsDeleting(true);

      console.log('🗑️ Eliminando cliente:', clienteToDelete.id);

      const response = await fetch(`/api/clientes/${clienteToDelete.id}`, {
        method: 'DELETE',
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const result = await response.json();
      console.log('📡 Response data:', result);

      if (result.success) {
        showSuccessToast(result.message || 'Cliente eliminado exitosamente');

        if (result.warning) {
          showErrorToast(`La baja en el sistema administrativo falló: ${result.warning}`);
        }

        // Invalidar caché para recargar la lista
        invalidateClientesCache();
        setIsDeleteModalOpen(false);
        setClienteToDelete(null);
      } else {
        showErrorToast(result.error || 'Error al eliminar el cliente');
      }
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      showErrorToast('Error de conexión al eliminar el cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setClienteToDelete(null);
  };

  // Manejar apertura del sidepanel de notas
  const handleOpenNotas = (cliente) => {
    setClienteForNotas(cliente);
    setIsNotasPanelOpen(true);
  };

  const handleCloseNotas = () => {
    setIsNotasPanelOpen(false);
    setClienteForNotas(null);
  };

  // Funciones para wizard de historia clínica - navegar a página
  const handleOpenConsultaModal = async (cliente) => {
    // Siempre crear nueva consulta
    router.push(`/clientes/${cliente.id}/citas`);
  };

  // Funciones para manejar consultas de atleta - navegar a página
  const handleOpenAtletaModal = async (cliente) => {
    // Siempre crear nueva consulta
    router.push(`/clientes/${cliente.id}/citas-deportivas`);
  };

  // Placeholder para wizardSteps (si es necesario para mostrar el progreso)
  const wizardSteps = Array(8).fill(null); // Ajustar según sea necesario

  return (
    <>
      {/* Filter Banner */}
      {filterType === 'clientes' && (
        <div className="mb-4 flex items-center justify-between px-3 py-2.5 bg-[#f4f8f8] border border-[#c6dfdf] rounded-lg">
          <p className="text-sm text-[#1c4040] font-medium">Mostrando Miembros <span className="text-[#357070] font-normal">— sin fichas registradas</span></p>
          <button onClick={() => router.push('/clientes')} className="text-xs text-[#1c4040] hover:text-[#0d1f1f] font-medium px-2.5 py-1 hover:bg-[#e8f2f2] rounded-md transition-colors">Ver todos</button>
        </div>
      )}

      {filterType === 'pacientes-atletas' && (
        <div className="mb-4 flex items-center justify-between px-3 py-2.5 bg-[#e8f2f2] border border-[#c6dfdf] rounded-lg">
          <p className="text-sm text-[#1c4040] font-medium">Mostrando Miembros Activos <span className="text-[#357070] font-normal">— con fichas registradas</span></p>
          <button onClick={() => router.push('/clientes')} className="text-xs text-[#1c4040] hover:text-[#0d1f1f] font-medium px-2.5 py-1 hover:bg-[#e8f2f2] rounded-md transition-colors">Ver todos</button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-base text-gray-500">
          {totalCount === 0
            ? 'Sin miembros registrados'
            : `${totalCount} miembro${totalCount === 1 ? '' : 's'}${searchTerm ? ` para "${searchTerm}"` : ''}`
          }
        </p>
        <button
          onClick={handleOpenClienteModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c4040] hover:bg-[#143030] text-white text-base font-medium rounded-lg transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4 text-[#c2ef03]" />
          Nuevo Miembro
        </button>
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <ClientesSkeleton viewMode={viewMode} count={6} />
        ) : displayClientes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#f4f8f8] flex items-center justify-center mx-auto mb-3">
              {searchTerm ? (
                <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-gray-300" />
              ) : (
                <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-[#1c4040]" />
              )}
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">
              {searchTerm ? 'Sin coincidencias' : 'Sin miembros registrados'}
            </p>
            <p className="text-sm text-gray-400">
              {searchTerm
                ? `No se encontraron resultados para "${searchTerm}".`
                : 'Registra tu primer miembro en Elíseos Box & Fitness.'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {displayClientes.map((cliente) => {
              const isPanelActive = activeActionPanel === cliente.id;
              return (
                <div
                  key={cliente.id}
                  className={`group relative bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-200 ${isPanelActive ? 'ring-2 ring-[#c2ef03]' : ''}`}
                >
                  {/* Action toggle */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveActionPanel(isPanelActive ? null : cliente.id);
                    }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm text-gray-400 hover:text-gray-600 rounded-lg shadow-sm flex items-center justify-center transition-all border border-gray-100"
                    title="Acciones rápidas"
                  >
                    <FontAwesomeIcon icon={isPanelActive ? faTimes : faEllipsisV} className="w-3.5 h-3.5" />
                  </button>

                  {/* Card content */}
                  <div className="p-4 cursor-pointer" onClick={() => router.push(`/clientes/${cliente.id}`)}>
                    <div className="flex items-start gap-3.5">
                      {/* Photo */}
                      <div className="shrink-0">
                        {cliente.foto ? (
                          <img
                            src={cliente.foto}
                            alt={`${cliente.nombre} ${cliente.apellidoPaterno}`}
                            loading="lazy"
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const iconDiv = e.target.parentNode.querySelector('.fallback-icon');
                              if (iconDiv) iconDiv.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`fallback-icon w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center ${cliente.foto ? 'hidden' : 'flex'}`}>
                          <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                        </h4>
                        <p className="text-sm text-gray-500 mt-0.5">{cliente.ocupacion || 'Sin especificar'}</p>
                        {cliente.numeroExpediente && (
                          <span className="text-xs text-violet-600 font-medium mt-1 inline-block">Exp: {cliente.numeroExpediente}</span>
                        )}
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                      <div className="flex items-center gap-2 truncate">
                        <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="truncate">{cliente.email || 'Sin email'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span>{cliente.telefonoContacto || 'Sin teléfono'}</span>
                      </div>
                      {cliente.responsable && (
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          <span className="font-medium text-gray-600">{cliente.responsable}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags row */}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                      {getSucursalesNames(cliente).map((nombre, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500">{nombre}</span>
                      ))}
                      {cliente.ultimaConsulta?.diagnostico && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 truncate max-w-[150px]">{cliente.ultimaConsulta.diagnostico}</span>
                      )}
                      {cliente.ultimaConsulta?.objetivo && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 truncate max-w-[150px]">{cliente.ultimaConsulta.objetivo}</span>
                      )}
                    </div>
                  </div>

                  {/* Overlay de Acciones */}
                  <div className={`absolute inset-0 bg-gray-900/90 backdrop-blur-sm transition-opacity duration-200 ${isPanelActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {[
                          { icon: faNoteSticky, label: 'Notas', color: 'bg-amber-500 hover:bg-amber-600', action: () => handleOpenNotas(cliente) },
                          { icon: faCalendar, label: 'Agendar', color: 'bg-teal-600 hover:bg-teal-700', action: () => router.push(`/clientes/${cliente.id}/clases/agendar`) },
                          { icon: faCalendarCheck, label: 'Actividades', color: 'bg-emerald-600 hover:bg-emerald-700', action: () => router.push(`/clientes/${cliente.id}/historial-actividades`) },
                          { icon: faFileText, label: 'N. Clínicas', color: 'bg-slate-700 hover:bg-slate-800', action: () => router.push(`/clientes/${cliente.id}/notas-clinicas`) },
                          { icon: faBox, label: 'Paquetes', color: 'bg-violet-600 hover:bg-violet-700', action: () => router.push(`/clientes/${cliente.id}/paquetes`) },
                          { icon: faAward, label: 'Pasaporte', color: 'bg-amber-600 hover:bg-amber-700', action: () => router.push(`/clientes/${cliente.id}/pasaporte`) },
                          { icon: faEdit, label: 'Editar', color: 'bg-blue-600 hover:bg-blue-700', action: () => handleEditCliente(cliente) },
                          { icon: faTrashAlt, label: 'Borrar', color: 'bg-red-500 hover:bg-red-600', action: () => handleDeleteCliente(cliente) },
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); btn.action(); }}
                            className={`flex flex-col items-center justify-center gap-1 p-2 ${btn.color} text-white rounded-lg transition-colors`}
                          >
                            <FontAwesomeIcon icon={btn.icon} className="w-4 h-4" />
                            <span className="text-[10px] font-medium leading-tight">{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Expediente</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contacto</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sucursal</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Diagnóstico / Objetivo</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="group border-b border-gray-50 last:border-0 hover:bg-cyan-50/40 transition-colors cursor-pointer"
                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cliente.foto ? (
                          <img
                            src={cliente.foto}
                            alt={`${cliente.nombre} ${cliente.apellidoPaterno}`}
                            loading="lazy"
                            className="w-9 h-9 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const iconDiv = e.target.parentNode.querySelector('.fallback-icon');
                              if (iconDiv) iconDiv.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`fallback-icon w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center ${cliente.foto ? 'hidden' : 'flex'}`}>
                          <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-medium text-gray-900 truncate">
                            {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                          </p>
                          <p className="text-sm text-gray-400">{cliente.ocupacion || 'Sin especificar'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {cliente.numeroExpediente ? (
                        <span className="text-sm font-medium text-violet-600">{cliente.numeroExpediente}</span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">{cliente.email || 'Sin email'}</p>
                        <p className="text-xs text-gray-400">{cliente.telefonoContacto || 'Sin teléfono'}</p>
                        {cliente.responsable && (
                          <p className="text-xs text-gray-500 font-medium">{cliente.responsable}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {getSucursalesNames(cliente).map((nombre, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs font-medium rounded-md bg-cyan-50 text-cyan-700">{nombre}</span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 max-w-[280px]">
                      <div className="space-y-1">
                        {cliente.ultimaConsulta?.diagnostico ? (
                          <p className="text-sm text-gray-600 line-clamp-1">{cliente.ultimaConsulta.diagnostico}</p>
                        ) : (
                          <p className="text-sm text-gray-300">Sin diagnóstico</p>
                        )}
                        {cliente.ultimaConsulta?.objetivo && (
                          <p className="text-xs text-blue-500 line-clamp-1">{cliente.ultimaConsulta.objetivo}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuHeight = 300;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const showAbove = spaceBelow < menuHeight;
                            let finalTop = showAbove ? (rect.top - menuHeight) : (rect.bottom + 5);
                            if (finalTop < 10) finalTop = 10;
                            setTableModalPosition({ top: finalTop, right: (window.innerWidth - rect.right) + 5 });
                            setActiveTableModal(activeTableModal === cliente.id ? null : cliente.id);
                          }}
                          className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-md transition-colors"
                          title="Acciones"
                        >
                          <FontAwesomeIcon icon={faEllipsisV} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditCliente(cliente); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCliente(cliente); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">Pág. {currentPage} / {totalPages}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => handleGoToPage(page)} className={`min-w-[32px] py-1.5 text-sm rounded-lg font-medium transition-colors ${page === currentPage ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-1 text-gray-300">…</span>;
                  }
                  return null;
                })}
              </div>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
              </button>
              <select value={currentPage} onChange={(e) => handleGoToPage(Number(e.target.value))} className="sm:hidden px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <option key={page} value={page}>Pág. {page}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Actions Modal - Fixed Position */}
      {activeTableModal && (() => {
        const activeCliente = displayClientes.find(c => c.id === activeTableModal);
        if (!activeCliente) return null;

        const modalActions = [
          { icon: faNoteSticky, label: 'Notas', color: 'text-amber-600 bg-amber-50', action: () => { handleOpenNotas(activeCliente); setActiveTableModal(null); } },
          { icon: faCalendar, label: 'Agendar', color: 'text-teal-600 bg-teal-50', action: () => { router.push(`/clientes/${activeCliente.id}/clases/agendar`); setActiveTableModal(null); } },
          { icon: faCalendarCheck, label: 'Actividades', color: 'text-emerald-600 bg-emerald-50', action: () => { router.push(`/clientes/${activeCliente.id}/historial-actividades`); setActiveTableModal(null); } },
          { icon: faFileText, label: 'Notas Clínicas', color: 'text-slate-700 bg-slate-100', action: () => { router.push(`/clientes/${activeCliente.id}/notas-clinicas`); setActiveTableModal(null); } },
          { icon: faBox, label: 'Paquetes', color: 'text-violet-600 bg-violet-50', action: () => { router.push(`/clientes/${activeCliente.id}/paquetes`); setActiveTableModal(null); } },
          { icon: faAward, label: 'Pasaporte', color: 'text-amber-600 bg-amber-50', action: () => { router.push(`/clientes/${activeCliente.id}/pasaporte`); setActiveTableModal(null); } },
          { icon: faEdit, label: 'Editar', color: 'text-blue-600 bg-blue-50', action: () => { handleEditCliente(activeCliente); setActiveTableModal(null); } },
          { icon: faTrashAlt, label: 'Borrar', color: 'text-red-600 bg-red-50', action: () => { handleDeleteCliente(activeCliente); setActiveTableModal(null); } },
        ];

        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveTableModal(null)} />
            <div
              className="fixed w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              style={{ top: `${tableModalPosition.top}px`, right: `${tableModalPosition.right}px` }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Acciones</p>
                <button onClick={(e) => { e.stopPropagation(); setActiveTableModal(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                  <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 grid grid-cols-3 gap-1.5">
                {modalActions.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.preventDefault(); btn.action(); }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg ${btn.color} hover:opacity-80 transition-opacity`}
                  >
                    <FontAwesomeIcon icon={btn.icon} className="w-4 h-4" />
                    <span className="text-[10px] font-medium leading-tight">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      })()}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        cliente={clienteToDelete}
        isDeleting={isDeleting}
      />

      {/* Sidepanel de Notas */}
      <NotasSidePanel
        isOpen={isNotasPanelOpen}
        onClose={handleCloseNotas}
        cliente={clienteForNotas}
      />
    </>
  );
};

export default ClientesContent;
