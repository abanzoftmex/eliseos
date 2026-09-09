import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import useSidebarStore from "@finanzas/stores/sidebarStore";
import {
  HomeIcon,
  DocumentTextIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  UsersIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import useSucursalStore, { GLOBAL_SUCURSAL_ID } from "@finanzas/stores/sucursalStore";

const Sidebar = ({
  isOpen,
  collapsed,
  onClose,
  onToggleCollapse,
  isMobile,
}) => {
  const router = useRouter();
  const { checkPermission, userRole } = useAuth();
  

  
  // Usar el store de Zustand para el estado de los menús
  const { expandedSections, toggleSection, autoExpandFromPath } = useSidebarStore();
  
  // Usar el store de sucursales
  const { selectedSucursal, setSelectedSucursal, sucursales, loadSucursales } = useSucursalStore();

  useEffect(() => {
    loadSucursales();
  }, [loadSucursales]);

  const handleSectionClick = (section, fallbackUrl = null) => {
    // Si la sección está colapsada, la expandimos
    if (!expandedSections[section]) {
      toggleSection(section);
    } else if (fallbackUrl) {
      // Si está expandida y tenemos una URL de respaldo, navegamos a ella
      handleNavigation(fallbackUrl);
    } else {
      // Si no hay URL de respaldo, solo colapsamos/expandimos
      toggleSection(section);
    }
  };

  // Efecto para expandir automáticamente la sección actual basada en la ruta
  useEffect(() => {
    autoExpandFromPath(router.pathname);
  }, [router.pathname, autoExpandFromPath]);

  const handleNavigation = (href) => {
    router.push(href);
    // Solo cerrar el sidebar en móvil, no colapsar las secciones del menú
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ${
          collapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex flex-col w-full bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center justify-center px-4 py-6 border-b border-gray-200">
            {!collapsed ? (
              <img src="/logo_light.png" alt="Logo" className="h-16 w-auto" />
            ) : (
              <img src="/logo_light.png" alt="Logo" className="w-12 h-auto" />
            )}
          </div>

          {/* Switcher back to sports panel */}
          {!collapsed && (
            <div className="px-3 pt-3 pb-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold tracking-wider text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-all"
              >
                <span>← Panel Deportivo</span>
              </button>
            </div>
          )}

          {/* Selector de Sucursal Activa */}
          {!collapsed ? (
            <div className="px-3 pt-2 pb-1 border-b border-gray-100 bg-slate-50/50">
              <div className="bg-white border border-gray-200/80 rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5 text-primary" />
                    Sucursal Activa
                  </span>
                  {selectedSucursal !== GLOBAL_SUCURSAL_ID && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Filtrada
                    </span>
                  )}
                </div>
                <select
                  value={selectedSucursal}
                  onChange={(e) => setSelectedSucursal(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-gray-800 text-xs rounded-lg py-1.5 px-2 font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-white"
                >
                  <option value={GLOBAL_SUCURSAL_ID}>🌐 Global (Todas las sedes)</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      🏢 {s.name || s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="px-2 pt-3 pb-2 flex justify-center border-b border-gray-100">
              <button
                type="button"
                title={`Sucursal: ${selectedSucursal === GLOBAL_SUCURSAL_ID ? 'Global (Todas las sedes)' : (sucursales.find(s => s.id === selectedSucursal)?.name || 'Sede')}`}
                className={`p-2 rounded-lg transition-colors ${
                  selectedSucursal === GLOBAL_SUCURSAL_ID 
                    ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-700' 
                    : 'bg-emerald-50 text-emerald-700 font-semibold'
                }`}
                onClick={() => onToggleCollapse && onToggleCollapse()}
              >
                <BuildingOffice2Icon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-2">
            {/* Dashboard */}
            <button
              onClick={() => handleNavigation("/finanzas/dashboard")}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                router.pathname === "/finanzas/dashboard"
                  ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">Dashboard Financiero</span>}
            </button>

            {/* Transacciones Section */}
            {!collapsed &&
              (checkPermission("canViewEntradas") ||
                checkPermission("canViewSalidas") ||
                checkPermission("canViewHistorial")) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleSectionClick('transacciones')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="ml-3">Transacciones</span>
                    </div>
                    {expandedSections.transacciones ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {/* Submenú de Transacciones */}
                  {expandedSections.transacciones && (
                    <div className="space-y-1 transition-all duration-300 ease-in-out">
                      {/* Ingresos - Solo si tiene permiso */}
                      {checkPermission("canViewEntradas") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/transacciones/entradas")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/transacciones/entradas"
                              ? "bg-cyan-50 text-primary"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <PlusIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Ingreso</span>
                        </button>
                      )}

                      {/* Solicitudes de Pago - Solo si tiene permiso */}
                      {checkPermission("canViewSalidas") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/transacciones/salidas")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/transacciones/salidas"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-cyan-50"
                          }`}
                        >
                          <MinusIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Gasto</span>
                        </button>
                      )}

                      {/* Historial - Solo si tiene permiso */}
                      {checkPermission("canViewHistorial") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/transacciones/historial")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/transacciones/historial"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <ClockIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Historial</span>
                        </button>
                      )}

                      
                    </div>
                  )}
                </div>
              )}

            {/* Gastos Recurrentes Section */}
            {!collapsed && checkPermission("canManageTransactions") && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/finanzas/transacciones/recurrentes")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    router.pathname === "/finanzas/transacciones/recurrentes"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="ml-3">Gastos Recurrentes</span>
                </button>
              </div>
            )}

            {/* Catalogos Section */}
            {!collapsed &&
              (checkPermission("canManageProviders") ||
                checkPermission("canManageConcepts") ||
                checkPermission("canManageDescriptions")) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleSectionClick('catalogos')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <TagIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="ml-3">Catálogos</span>
                    </div>
                    {expandedSections.catalogos ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>

                  {/* Submenú de Catálogos */}
                  {expandedSections.catalogos && (
                    <div className="space-y-1 transition-all duration-300 ease-in-out">
                      {/* Proveedores - Admin y Contador pueden ver */}
                      {checkPermission("canManageProviders") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/catalogos/proveedores")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/catalogos/proveedores"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <UserGroupIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Proveedores</span>
                        </button>
                      )}

                      {/* Generales - Solo Admin */}
                      {checkPermission("canManageConcepts") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/catalogos/generales")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/catalogos/generales"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <TagIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Generales</span>
                        </button>
                      )}

                      {/* Conceptos - Solo Admin */}
                      {checkPermission("canManageConcepts") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/catalogos/conceptos")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/catalogos/conceptos"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <TagIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Conceptos</span>
                        </button>
                      )}

                      {/* Subconceptos - Solo Admin */}
                      {checkPermission("canManageDescriptions") && (
                        <button
                          onClick={() =>
                            handleNavigation("/finanzas/catalogos/subconceptos")
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname === "/finanzas/catalogos/subconceptos"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3">Subconceptos</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Integración Section */}
            {!collapsed && checkPermission("canManageSettings") && (
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick('integracion')}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="ml-3">Integración</span>
                  </div>
                  {expandedSections.integracion ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Submenú de Integración */}
                {expandedSections.integracion && (
                  <div className="space-y-1 transition-all duration-300 ease-in-out">
                    {/* Clientes */}
                    <button
                      onClick={() =>
                        handleNavigation("/finanzas/integracion/clientes")
                      }
                      className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                        router.pathname === "/finanzas/integracion/clientes"
                          ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <UsersIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="ml-3">Clientes</span>
                    </button>

                    {/* Sucursales */}
                    <button
                      onClick={() =>
                        handleNavigation("/finanzas/integracion/sucursales")
                      }
                      className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                        router.pathname === "/finanzas/integracion/sucursales"
                          ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="ml-3">Sucursales</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Reportes - Solo Admin */}
            {checkPermission("canViewReports") && (
              <button
                onClick={() => handleNavigation("/finanzas/reportes")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  router.pathname === "/finanzas/reportes"
                    ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Reportes</span>}
              </button>
            )}

            {/* Análisis con IA - Solo Administrativo */}
            {checkPermission("canViewAnalisisIA") && (
              <button
                onClick={() => handleNavigation("/finanzas/analisis-ia")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  router.pathname === "/finanzas/analisis-ia"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <SparklesIcon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Análisis IA</span>}
              </button>
            )}

            {/* Portal ELISEOS - Enlace */}
            <a
              href={process.env.NEXT_PUBLIC_PORTAL_URL || "/portal"}
              target="_blank"
              rel="noopener noreferrer"
              title="Portal ELISEOS"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">Portal ELISEOS</span>}
            </a>

            {/* Configuración Section - Solo Admin */}
            {checkPermission("canManageSettings") &&
              (!collapsed ? (
                <div className="space-y-1">
                  <button
                    onClick={() => handleSectionClick('configuracion')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <CogIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="ml-3">Configuración</span>
                    </div>
                    {expandedSections.configuracion ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  {/* Submenú de Configuración */}
                  {expandedSections.configuracion && (
                    <div className="space-y-1 transition-all duration-300 ease-in-out">
                      <button
                        onClick={() =>
                          handleNavigation(
                            "/finanzas/configuracion/correos-notificacion"
                          )
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname ===
                          "/finanzas/configuracion/correos-notificacion"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <span className="ml-3">Correos de notificación</span>
                      </button>
                      <button
                        onClick={() =>
                          handleNavigation(
                            "/finanzas/configuracion/logs"
                          )
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname ===
                          "/finanzas/configuracion/logs"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <span className="ml-3">Registros de actividad</span>
                      </button>
                      {/* Dev Tools - Only in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <button
                          onClick={() =>
                            handleNavigation(
                              "/finanzas/configuracion/dev-tools"
                            )
                          }
                          className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                            router.pathname ===
                            "/finanzas/configuracion/dev-tools"
                              ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <span className="ml-3">🛠️ Dev Tools</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleNavigation("/finanzas/configuracion")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    router.pathname === "/finanzas/configuracion"
                      ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <CogIcon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-3">Configuración</span>}
                </button>
              ))}

            {/* Gestión de Usuarios - Solo Admin */}
            {checkPermission("canManageUsers") && (
              <button
                onClick={() => handleNavigation("/finanzas/usuarios")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  router.pathname === "/finanzas/usuarios"
                    ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <UsersIcon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">Usuarios</span>}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
            <img src="/logo_light.png" alt="Logo" className="h-16 w-auto" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Selector de Sucursal Activa Móvil */}
          <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 text-primary" />
                Sucursal Activa
              </span>
              {selectedSucursal !== GLOBAL_SUCURSAL_ID && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                  Filtrada
                </span>
              )}
            </div>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-800 text-sm rounded-lg py-2 px-3 font-medium focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value={GLOBAL_SUCURSAL_ID}>🌐 Global (Todas las sedes)</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  🏢 {s.name || s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {/* Same navigation items as desktop */}
            <button
              onClick={() => handleNavigation("/finanzas/dashboard")}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                router.pathname === "/finanzas/dashboard"
                  ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Dashboard</span>
            </button>

            {(checkPermission("canViewEntradas") ||
              checkPermission("canViewSalidas") ||
              checkPermission("canViewHistorial")) && (
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick('transacciones')}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3">Transacciones</span>
                  </div>
                  {expandedSections.transacciones ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Submenú de Transacciones */}
                {expandedSections.transacciones && (
                  <div className="space-y-1 transition-all duration-300 ease-in-out">
                    {checkPermission("canViewEntradas") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/transacciones/entradas")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/transacciones/entradas"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <PlusIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Ingresos</span>
                      </button>
                    )}

                    {checkPermission("canViewSalidas") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/transacciones/salidas")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/transacciones/salidas"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <MinusIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Gasto</span>
                      </button>
                    )}

                    {checkPermission("canViewHistorial") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/transacciones/historial")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/transacciones/historial"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <ClockIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Historial</span>
                      </button>
                    )}

                    {checkPermission("canViewHistorial") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/transacciones/historial")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/transacciones/historial"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <ClockIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Historial</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gastos Recurrentes Section - Mobile */}
            {checkPermission("canManageTransactions") && (
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation("/finanzas/transacciones/recurrentes")}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    router.pathname === "/finanzas/transacciones/recurrentes"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="ml-3">Gastos Recurrentes</span>
                </button>
              </div>
            )}

            {(checkPermission("canManageProviders") ||
              checkPermission("canManageConcepts") ||
              checkPermission("canManageDescriptions")) && (
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick('catalogos')}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <TagIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3">Catálogos</span>
                  </div>
                  {expandedSections.catalogos ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Submenú de Catálogos */}
                {expandedSections.catalogos && (
                  <div className="space-y-1 transition-all duration-300 ease-in-out">
                    {checkPermission("canManageProviders") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/catalogos/proveedores")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/catalogos/proveedores"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <UserGroupIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Proveedores</span>
                      </button>
                    )}

                    {checkPermission("canManageConcepts") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/catalogos/generales")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/catalogos/generales"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <TagIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Generales</span>
                      </button>
                    )}

                    {checkPermission("canManageConcepts") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/catalogos/conceptos")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/catalogos/conceptos"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <TagIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Conceptos</span>
                      </button>
                    )}

                    {checkPermission("canManageDescriptions") && (
                      <button
                        onClick={() =>
                          handleNavigation("/finanzas/catalogos/subconceptos")
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname === "/finanzas/catalogos/subconceptos"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">Subconceptos</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {checkPermission("canViewReports") && (
              <button
                onClick={() => handleNavigation("/finanzas/reportes")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  router.pathname === "/finanzas/reportes"
                    ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3">Reportes</span>
              </button>
            )}

            {/* Análisis con IA (mobile) - Admin y Viewer */}
            {(checkPermission("canViewReports") || checkPermission("canViewEntradas")) && (
              <button
                onClick={() => handleNavigation("/finanzas/analisis-ia")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  router.pathname === "/finanzas/analisis-ia"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <SparklesIcon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3">Análisis IA</span>
              </button>
            )}

            {/* Portal ELISEOS - Enlace (mobile) */}
            <a
              href={process.env.NEXT_PUBLIC_PORTAL_URL || "/portal"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">Portal ELISEOS</span>
            </a>

            {/* Integración Section (mobile) */}
            {checkPermission("canManageSettings") && (
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick('integracion')}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="ml-3">Integración</span>
                  </div>
                  {expandedSections.integracion ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Submenú de Integración */}
                {expandedSections.integracion && (
                  <div className="space-y-1">
                    {/* Clientes */}
                    <button
                      onClick={() =>
                        handleNavigation("/finanzas/integracion/clientes")
                      }
                      className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                        router.pathname === "/finanzas/integracion/clientes"
                          ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <UsersIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="ml-3">Clientes</span>
                    </button>

                    {/* Sucursales */}
                    <button
                      onClick={() =>
                        handleNavigation("/finanzas/integracion/sucursales")
                      }
                      className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                        router.pathname === "/finanzas/integracion/sucursales"
                          ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="ml-3">Sucursales</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Configuración Section (mobile) - Solo Admin */}
            {checkPermission("canManageSettings") && (
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick('configuracion')}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <CogIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3">Configuración</span>
                  </div>
                  {expandedSections.configuracion ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
                
                {/* Submenú de Configuración */}
                {expandedSections.configuracion && (
                  <div className="space-y-1">
                    <button
                      onClick={() =>
                        handleNavigation(
                          "/finanzas/configuracion/correos-notificacion"
                        )
                      }
                      className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                        router.pathname ===
                        "/finanzas/configuracion/correos-notificacion"
                          ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <span className="ml-3">Correos de notificación</span>
                    </button>
                    <button
                      onClick={() =>
                        handleNavigation(
                          "/finanzas/configuracion/logs"
                        )
                      }
                      className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                        router.pathname ===
                        "/finanzas/configuracion/logs"
                          ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <span className="ml-3">Registros de actividad</span>
                    </button>
                    {/* Dev Tools - Only in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <button
                        onClick={() =>
                          handleNavigation(
                            "/finanzas/configuracion/dev-tools"
                          )
                        }
                        className={`w-full flex items-center px-3 py-2 pl-10 text-sm font-medium rounded-lg transition-colors ${
                          router.pathname ===
                          "/finanzas/configuracion/dev-tools"
                            ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <span className="ml-3">🛠️ Dev Tools</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gestión de Usuarios (mobile) - Solo Admin */}
            {checkPermission("canManageUsers") && (
              <button
                onClick={() => handleNavigation("/finanzas/usuarios")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  router.pathname === "/finanzas/usuarios"
                    ? "bg-[#f4f8f8] text-primary font-bold border-l-2 border-[#c2ef03]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <UsersIcon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3">Usuarios</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
