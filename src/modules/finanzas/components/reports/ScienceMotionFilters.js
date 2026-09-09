/**
 * Componente de filtros para reportes de Science Motion
 * Permite filtrar ventas por diferentes criterios
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import {
  FunnelIcon,
  XMarkIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CalendarIcon,
  UserGroupIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const ScienceMotionFilters = ({ onApplyFilters, onClearFilters }) => {
  const { error, success } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' o 'cuentas'

  // Estados para los datos de las listas
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposProducto, setTiposProducto] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [tiposPlanes, setTiposPlanes] = useState([]);

  // Estados para los filtros seleccionados
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterValues, setFilterValues] = useState({
    startDate: '',
    endDate: '',
    clienteId: '',
    productoId: '',
    tipoProducto: '',
    planId: '',
    tipoPlan: '',
  });

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      // Cargar datos en paralelo
      const [
        clientesRes,
        productosRes,
        tiposProductoRes,
        planesRes,
        tiposPlanesRes,
      ] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/science-motion/productos'),
        fetch('/api/science-motion/productos/tipos'),
        fetch('/api/science-motion/planes'),
        fetch('/api/science-motion/planes/tipos'),
      ]);

      const [
        clientesData,
        productosData,
        tiposProductoData,
        planesData,
        tiposPlanesData,
      ] = await Promise.all([
        clientesRes.json(),
        productosRes.json(),
        tiposProductoRes.json(),
        planesRes.json(),
        tiposPlanesRes.json(),
      ]);

      // Verificar si hay errores en las respuestas
      if (productosData.error) {
        console.error('Error cargando productos:', productosData.message);
        error('Error al cargar productos de Science Motion. Verifica que el servidor esté corriendo.');
      }
      if (tiposProductoData.error) {
        console.error('Error cargando tipos de producto:', tiposProductoData.message);
      }
      if (planesData.error) {
        console.error('Error cargando planes:', planesData.message);
      }
      if (tiposPlanesData.error) {
        console.error('Error cargando tipos de planes:', tiposPlanesData.message);
      }

      setClientes(clientesData.data || []);
      setProductos(productosData.data || productosData.productos || []);
      setTiposProducto(tiposProductoData.data || tiposProductoData.tipos || []);
      setPlanes(planesData.data || planesData.planes || []);
      setTiposPlanes(tiposPlanesData.data || tiposPlanesData.tipos || []);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      error('No se puede conectar con Science Motion. Verifica que el servidor esté corriendo en localhost:3000');
    } finally {
      setLoadingData(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilter = async (filterType) => {
    try {
      setLoading(true);
      setActiveFilter(filterType);

      let endpoint = '';
      let params = new URLSearchParams();
      let filterSelectionName = null; // Para guardar el nombre de la selección

      // Agregar fechas si están disponibles
      if (filterValues.startDate) params.append('startDate', filterValues.startDate);
      if (filterValues.endDate) params.append('endDate', filterValues.endDate);

      switch (filterType) {
        case 'general':
          // Venta general de productos
          endpoint = '/api/science-motion/ventas/general';
          filterSelectionName = 'Resumen General de Ventas';
          break;

        case 'tipoProducto':
          // Venta por tipo de producto
          if (!filterValues.tipoProducto) {
            error('Selecciona un tipo de producto');
            setLoading(false);
            return;
          }
          params.append('tipoProducto', filterValues.tipoProducto);
          endpoint = '/api/science-motion/ventas';
          const selectedTipo = tiposProducto.find(t => (t.id || t) == filterValues.tipoProducto);
          filterSelectionName = selectedTipo ? `Categoría: ${selectedTipo.nombre || selectedTipo}` : 'Categoría no encontrada';
          break;

        case 'producto':
          // Venta por producto específico
          if (!filterValues.productoId) {
            error('Selecciona un producto');
            setLoading(false);
            return;
          }
          params.append('productoId', filterValues.productoId);
          endpoint = '/api/science-motion/ventas';
          const selectedProducto = productos.find(p => p.id == filterValues.productoId);
          filterSelectionName = selectedProducto ? `Producto: ${selectedProducto.nombre}` : 'Producto no encontrado';
          break;

        case 'planes':
          // Venta por planes y paquetes - usa endpoint específico
          if (filterValues.planId) {
            params.append('planId', filterValues.planId);
          }
          endpoint = '/api/science-motion/ventas/planes';
          filterSelectionName = 'Ventas de Planes y Paquetes';
          break;

        case 'tipoPlan':
          // Venta por tipo de plan - usa endpoint específico
          if (!filterValues.tipoPlan) {
            error('Selecciona un tipo de plan');
            setLoading(false);
            return;
          }
          params.append('tipoPlan', filterValues.tipoPlan);
          endpoint = '/api/science-motion/ventas/planes';
          const selectedTipoPlan = tiposPlanes.find(t => (t.id || t) == filterValues.tipoPlan);
          filterSelectionName = selectedTipoPlan ? `Tipo de Plan: ${selectedTipoPlan.nombre || selectedTipoPlan}` : 'Tipo de plan no encontrado';
          break;

        case 'cliente':
          // Ventas a un cliente específico (incluye planes + productos)
          if (!filterValues.clienteId) {
            error('Selecciona un cliente');
            setLoading(false);
            return;
          }
          params.append('clienteId', filterValues.clienteId);
          endpoint = '/api/science-motion/ventas/cliente';
          const selectedCliente = clientes.find(c => c.id == filterValues.clienteId);
          filterSelectionName = selectedCliente ? `Cliente: ${selectedCliente.nombre} ${selectedCliente.apellidoPaterno}`: 'Cliente no encontrado';
          break;

        case 'cuentasPorCobrar':
          // Cuentas por cobrar
          endpoint = '/api/science-motion/cuentas-por-cobrar';
          filterSelectionName = 'Resumen de Cuentas por Cobrar';
          break;

        case 'deudaCliente':
          // Deuda de un cliente específico
          if (!filterValues.clienteId) {
            error('Selecciona un cliente');
            setLoading(false);
            return;
          }
          params.append('clienteId', filterValues.clienteId);
          endpoint = '/api/science-motion/cuentas-por-cobrar';
          const selectedDeudaCliente = clientes.find(c => c.id == filterValues.clienteId);
          filterSelectionName = selectedDeudaCliente ? `Deuda de: ${selectedDeudaCliente.nombre} ${selectedDeudaCliente.apellidoPaterno}`: 'Cliente no encontrado';
          break;

        case 'concentrados':
          // Resumen concentrado de ingresos
          endpoint = '/api/science-motion/concentrados';
          filterSelectionName = 'Concentrado de Ingresos';
          break;

        default:
          error('Tipo de filtro no válido');
          setLoading(false);
          return;
      }

      // Hacer la petición
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        success('Filtro aplicado correctamente');
        onApplyFilters({ type: filterType, data, filters: filterValues, selectionName: filterSelectionName });
      } else {
        const errorMsg = data.message || data.error || 'Error al aplicar filtro';
        error(errorMsg);
        console.error('Error en respuesta:', data);
      }
    } catch (err) {
      console.error('Error aplicando filtro:', err);
      const errorMsg = err.message.includes('Science Motion')
        ? err.message
        : 'Error de conexión con Science Motion. Verifica que el servidor esté corriendo.';
      error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterValues({
      startDate: '',
      endDate: '',
      clienteId: '',
      productoId: '',
      tipoProducto: '',
      planId: '',
      tipoPlan: '',
    });
    setActiveFilter(null);
    onClearFilters();
    success('Filtros limpiados');
  };

  if (loadingData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando filtros...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FunnelIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Filtros de Reportes
              </h3>
              <p className="text-sm text-gray-500">
                Selecciona un filtro para ver información detallada
              </p>
            </div>
          </div>
          {activeFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`
              flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'ventas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Reportes de Ventas
          </button>
          <button
            onClick={() => setActiveTab('cuentas')}
            className={`
              flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'cuentas'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Cuentas por Cobrar
          </button>
          <button
            onClick={() => setActiveTab('concentrados')}
            className={`
              flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'concentrados'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Concentrados
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Selector de fechas global */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center mb-3">
            <CalendarIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-900">Rango de fechas (opcional)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filterValues.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filterValues.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ventas Tab */}
        {activeTab === 'ventas' && (
          <div className="space-y-4">
            {/* Venta General */}
            <div className={`
              p-5 rounded-lg border-2 transition-all cursor-pointer
              ${activeFilter === 'general'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
            `}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <ShoppingBagIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Resumen General</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Ver todas las ventas con totales e indicadores generales
                  </p>
                </div>
              </div>
              <Button
                variant={activeFilter === 'general' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('general')}
                disabled={loading}
                className="w-full"
              >
                Ver Resumen General
              </Button>
            </div>

            {/* Ventas por Tipo de Producto */}
            <div className={`
              p-5 rounded-lg border-2 transition-all
              ${activeFilter === 'tipoProducto'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
            `}>
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Ventas por Categoría</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Consulta ventas de productos por categoría (Cafetería, Suplementos, etc.)
                </p>
              </div>
              <select
                value={filterValues.tipoProducto}
                onChange={(e) => handleFilterChange('tipoProducto', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 text-sm"
              >
                <option value="">Selecciona una categoría</option>
                {tiposProducto
                  .filter((tipo) => (tipo.nombre || tipo) && String(tipo.nombre || tipo).trim() !== '')
                  .map((tipo) => (
                    <option key={tipo.id || tipo} value={tipo.id || tipo}>
                      {tipo.nombre || tipo}
                    </option>
                  ))}
              </select>
              <Button
                variant={activeFilter === 'tipoProducto' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('tipoProducto')}
                disabled={loading || !filterValues.tipoProducto}
                className="w-full"
              >
                Consultar Ventas
              </Button>
            </div>

            {/* Ventas por Producto Específico */}
            <div className={`
              p-5 rounded-lg border-2 transition-all
              ${activeFilter === 'producto'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
            `}>
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <ShoppingBagIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Ventas de un Producto</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Ver ventas de un producto específico
                </p>
              </div>
              <select
                value={filterValues.productoId}
                onChange={(e) => handleFilterChange('productoId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 text-sm"
              >
                <option value="">Selecciona un producto</option>
                {productos
                  .filter((p) => p.nombre && p.nombre.trim() !== '')
                  .map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} {producto.tipo ? `(${producto.tipo})` : ''}
                    </option>
                  ))}
              </select>
              <Button
                variant={activeFilter === 'producto' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('producto')}
                disabled={loading || !filterValues.productoId}
                className="w-full"
              >
                Consultar Ventas
              </Button>
            </div>

            {/* Ventas por Planes */}
            <div className={`
              p-5 rounded-lg border-2 transition-all cursor-pointer
              ${activeFilter === 'planes'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
            `}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <CreditCardIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Ventas de Planes</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Consulta todas las ventas de planes y paquetes
                  </p>
                </div>
              </div>
              <Button
                variant={activeFilter === 'planes' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('planes')}
                disabled={loading}
                className="w-full"
              >
                Ver Ventas de Planes
              </Button>
            </div>

            {/* Ventas por Tipo de Plan */}
            <div className={`
              p-5 rounded-lg border-2 transition-all
              ${activeFilter === 'tipoPlan'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
            `}>
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <CreditCardIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Ventas por Tipo de Plan</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Filtra ventas por tipo de plan (mensual, anual, etc.)
                </p>
              </div>
              <select
                value={filterValues.tipoPlan}
                onChange={(e) => handleFilterChange('tipoPlan', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 text-sm"
              >
                <option value="">Selecciona un tipo de plan</option>
                {tiposPlanes
                  .filter((tipo) => (tipo.nombre || tipo) && String(tipo.nombre || tipo).trim() !== '')
                  .map((tipo) => (
                    <option key={tipo.id || tipo} value={tipo.id || tipo}>
                      {tipo.nombre || tipo}
                    </option>
                  ))}
              </select>
              <Button
                variant={activeFilter === 'tipoPlan' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('tipoPlan')}
                disabled={loading || !filterValues.tipoPlan}
                className="w-full"
              >
                Consultar Ventas
              </Button>
            </div>

            {/* Ventas por Cliente */}
            <div className={`
              p-5 rounded-lg border-2 transition-all
              ${activeFilter === 'cliente'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
              }
            `}>
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Ventas a un Cliente</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Ver historial de compras de un cliente específico
                </p>
              </div>
              <select
                value={filterValues.clienteId}
                onChange={(e) => handleFilterChange('clienteId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 text-sm"
              >
                <option value="">Selecciona un cliente</option>
                {clientes
                  .filter((c) => c.nombre && c.nombre.trim() !== '')
                  .map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellidoPaterno}
                    </option>
                  ))}
              </select>
              <Button
                variant={activeFilter === 'cliente' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('cliente')}
                disabled={loading || !filterValues.clienteId}
                className="w-full"
              >
                Consultar Ventas
              </Button>
            </div>
          </div>
        )}

        {/* Cuentas por Cobrar Tab */}
        {activeTab === 'cuentas' && (
          <div className="space-y-4">
            {/* Total Cuentas por Cobrar */}
            <div className={`
              p-5 rounded-lg border-2 transition-all cursor-pointer
              ${activeFilter === 'cuentasPorCobrar'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300 bg-white'
              }
            `}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-red-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Resumen Total</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Ver el total de cuentas pendientes de cobro de todos los clientes
                  </p>
                </div>
              </div>
              <Button
                variant={activeFilter === 'cuentasPorCobrar' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('cuentasPorCobrar')}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 border-red-600"
              >
                Ver Total por Cobrar
              </Button>
            </div>

            {/* Deuda de Cliente Específico */}
            <div className={`
              p-5 rounded-lg border-2 transition-all
              ${activeFilter === 'deudaCliente'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300 bg-white'
              }
            `}>
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <UserGroupIcon className="h-5 w-5 text-red-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Deuda de un Cliente</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Consulta el saldo pendiente de un cliente específico
                </p>
              </div>
              <select
                value={filterValues.clienteId}
                onChange={(e) => handleFilterChange('clienteId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3 text-sm"
              >
                <option value="">Selecciona un cliente</option>
                {clientes
                  .filter((c) => c.nombre && c.nombre.trim() !== '')
                  .map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellidoPaterno}
                  </option>
                ))}
              </select>
              <Button
                variant={activeFilter === 'deudaCliente' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('deudaCliente')}
                disabled={loading || !filterValues.clienteId}
                className="w-full bg-red-600 hover:bg-red-700 border-red-600"
              >
                Consultar Deuda
              </Button>
            </div>
          </div>
        )}

        {/* Concentrados Tab */}
        {activeTab === 'concentrados' && (
          <div className="space-y-4">
            {/* Resumen Concentrado */}
            <div className={`
              p-5 rounded-lg border-2 transition-all cursor-pointer
              ${activeFilter === 'concentrados'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300 bg-white'
              }
            `}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Resumen de Ingresos</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Vista rápida de ingresos totales por categoría (Planes, Cafetería, Merch)
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800">
                      <strong>ℹ️ Incluye:</strong> Planes (Grupal, Personalizado, Sesión), Plataformas (Fitpass, Wellhub, Totalpass) y Productos (Cafetería, Merch)
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant={activeFilter === 'concentrados' ? 'primary' : 'outline'}
                onClick={() => handleApplyFilter('concentrados')}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 border-green-600"
              >
                Ver Concentrados
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 mt-6 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 font-medium">Cargando resultados...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScienceMotionFilters;
