/**
 * Componente para mostrar resultados de filtros de Science Motion
 * Muestra datos de ventas, cuentas por cobrar, etc.
 */

import { useState } from 'react';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const ScienceMotionResults = ({ filterType, data, filters, selectionName }) => {
  if (!data || !filterType) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Selecciona un filtro para ver los resultados
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFilterTitle = () => {
    if (selectionName) {
      return `Resultados para: ${selectionName}`;
    }
    const titles = {
      general: 'Venta General de Productos',
      tipoProducto: 'Venta por Tipo de Producto',
      producto: 'Venta por Producto Específico',
      planes: 'Venta por Planes y Paquetes',
      tipoPlan: 'Venta por Tipo de Plan',
      cliente: 'Ventas a Cliente Específico',
      cuentasPorCobrar: 'Total Cuentas por Cobrar',
      deudaCliente: 'Deuda de Cliente',
      concentrados: 'Resumen Concentrado de Ingresos',
    };
    return titles[filterType] || 'Resultados';
  };

  const renderSummaryCards = () => {
    // Para deudaCliente o cuentasPorCobrar, usar los totales del endpoint
    if (filterType === 'deudaCliente' || filterType === 'cuentasPorCobrar') {
      const totales = data.totales || {};
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Por Cobrar</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(totales.totalPorCobrar || 0)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Cobrado</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(totales.totalCobrado || 0)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(totales.saldoPendiente || 0)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      );
    }
    
    const totales = data.totales || data.resumen || {};
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {totales.totalVentas !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Ventas</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totales.totalVentas)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        )}

        {totales.cantidadVentas !== undefined && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Cantidad de Ventas</p>
                <p className="text-2xl font-bold text-green-900">
                  {totales.cantidadVentas}
                </p>
              </div>
              <ShoppingBagIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        )}

        {totales.faltantePorCobrar !== undefined && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Faltante por Cobrar</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(totales.faltantePorCobrar)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        )}

        {totales.totalPorCobrar !== undefined && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Por Cobrar</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(totales.totalPorCobrar)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        )}

        {totales.totalCobrado !== undefined && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Cobrado</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(totales.totalCobrado)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVentasTable = () => {
    let ventas = data.ventas || data.data || [];
    
    // Para cuentasPorCobrar y deudaCliente, usar data.cuentas
    if (filterType === 'deudaCliente' || filterType === 'cuentasPorCobrar') {
      ventas = data.cuentas || [];
    }
    
    if (!Array.isArray(ventas) || ventas.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {filterType === 'deudaCliente' || filterType === 'cuentasPorCobrar'
            ? 'No hay cuentas pendientes por cobrar'
            : 'No se encontraron ventas con los filtros aplicados'
          }
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto/Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              {(filterType === 'deudaCliente' || filterType === 'cuentasPorCobrar') && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.map((venta, index) => {
              // Para cuentas por cobrar, adaptamos los nombres de campos
              const esCuentaPorCobrar = filterType === 'deudaCliente' || filterType === 'cuentasPorCobrar';
              const fecha = esCuentaPorCobrar ? venta.fechaVenta : venta.fecha;
              const productoNombre = esCuentaPorCobrar ? venta.paqueteNombre : (venta.productoNombre || venta.planNombre || venta.descripcion);
              const total = esCuentaPorCobrar ? venta.totalVenta : (venta.total || venta.monto);
              
              return (
                <tr key={venta.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {venta.clienteNombre || venta.cliente || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {productoNombre || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {venta.cantidad || 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(total)}
                  </td>
                  {(filterType === 'deudaCliente' || filterType === 'cuentasPorCobrar') && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {formatCurrency(venta.pagado || venta.montoPagado || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        {formatCurrency(venta.saldo || 0)}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        venta.saldo === 0 || venta.pagado || venta.estado === 'pagado'
                          ? 'bg-green-100 text-green-800'
                          : (venta.pagado || venta.montoPagado || 0) > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {venta.saldo === 0 || venta.pagado
                        ? 'Pagado'
                        : (venta.pagado || venta.montoPagado || 0) > 0
                        ? 'Parcial'
                        : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCuentasPorCobrarTable = () => {
    const cuentas = data.cuentas || data.data || [];
    
    if (!Array.isArray(cuentas) || cuentas.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay cuentas por cobrar
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo Pendiente
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cuentas.map((cuenta, index) => (
              <tr key={cuenta.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cuenta.clienteNombre || cuenta.cliente || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(cuenta.fechaVenta || cuenta.fecha)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(cuenta.totalVenta || cuenta.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  {formatCurrency(cuenta.pagado || cuenta.montoPagado)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                  {formatCurrency(cuenta.saldo || cuenta.pendiente)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderConcentradosTable = () => {
    const concentrados = data.concentrados || [];
    const totales = data.totales || {};
    
    if (!Array.isArray(concentrados) || concentrados.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay datos de concentrados disponibles
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Card con el total general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">
                  Total General de Ingresos
                </p>
                <p className="text-4xl font-bold text-green-900 mt-2">
                  {formatCurrency(totales.totalGeneral || 0)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-16 w-16 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-semibold uppercase tracking-wide">
                  Faltante por Cobrar
                </p>
                <p className="text-4xl font-bold text-orange-900 mt-2">
                  {formatCurrency(totales.totalPendiente || 0)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-16 w-16 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Tabla de concentrados */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Ingresos
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pendiente
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  % del Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {concentrados.map((item, index) => {
                const porcentaje = totales.totalGeneral > 0 
                  ? ((item.total / totales.totalGeneral) * 100).toFixed(1)
                  : 0;
                
                // Colores alternados para mejorar la legibilidad
                const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                
                return (
                  <tr key={item.id} className={`${rowClass} hover:bg-green-50 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-700 font-bold text-sm">
                            {item.categoria.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{item.categoria}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.tipo === 'plan' 
                          ? 'bg-blue-100 text-blue-800'
                          : item.tipo === 'plataforma'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.tipo === 'plan' ? 'Plan' : item.tipo === 'plataforma' ? 'Plataforma' : 'Producto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 font-medium">
                      {item.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-base font-bold text-gray-900">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                      {formatCurrency(item.pendiente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end">
                        <span className="text-sm font-semibold text-green-700 mr-2">
                          {porcentaje}%
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gradient-to-r from-green-50 to-emerald-50">
              <tr>
                <td colSpan="2" className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase">
                  Total General
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  {concentrados.reduce((sum, item) => sum + item.cantidad, 0)}
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-green-900">
                  {formatCurrency(totales.totalGeneral || 0)}
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-red-600">
                  {formatCurrency(totales.totalPendiente || 0)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-green-700">
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {getFilterTitle()}
          </h3>
          {filters.startDate && filters.endDate && (
            <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <span className="font-medium">Período:</span> {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
            </p>
          )}
        </div>
      </div>

      {/* Summary Cards - Only for non-concentrados views */}
      {filterType !== 'concentrados' && renderSummaryCards()}

      {/* Main Content */}
      {filterType === 'concentrados'
        ? renderConcentradosTable()
        : filterType === 'cuentasPorCobrar' || filterType === 'deudaCliente'
        ? renderCuentasPorCobrarTable()
        : renderVentasTable()}

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Datos obtenidos de Science Motion
        </p>
      </div>
    </div>
  );
};

export default ScienceMotionResults;
