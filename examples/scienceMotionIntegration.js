/**
 * 📦 MÓDULO DE INTEGRACIÓN SCIENCE MOTION → SCIENCE CHAGO
 * 
 * Este archivo contiene todas las funciones necesarias para integrar
 * los endpoints de Science Motion en tu sistema Science Chago.
 * 
 * Simplemente copia este archivo a tu proyecto y configura las variables
 * de entorno.
 * 
 * @author Science in Motion Team
 * @date 26 de enero de 2026
 */

// ============================================================
// 🔧 CONFIGURACIÓN
// ============================================================

const API_CONFIG = {
  // URL base de Science Motion
  baseUrl: process.env.SCIENCE_MOTION_API_URL || 'http://localhost:3000',
  
  // API Key para autenticación
  apiKey: process.env.SCIENCE_MOTION_API_KEY || 'science-chago-api-integration-key-2026',
  
  // Tiempo de timeout para las peticiones (ms)
  timeout: 30000
};

// ============================================================
// 🌐 FUNCIÓN BASE DE CONEXIÓN
// ============================================================

/**
 * Realiza una petición HTTP a Science Motion
 * @param {string} endpoint - Ruta del endpoint (ej: '/api/productos')
 * @param {object} options - Opciones adicionales de fetch
 * @returns {Promise<object>} - Respuesta JSON parseada
 */
async function fetchScienceMotion(endpoint, options = {}) {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'x-api-key': API_CONFIG.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La petición tardó demasiado');
    }
    throw error;
  }
}

// ============================================================
// 📦 FUNCIONES DE PRODUCTOS
// ============================================================

/**
 * Obtiene la lista completa de productos
 * @returns {Promise<Array>} - Array de productos
 */
async function obtenerProductos() {
  const data = await fetchScienceMotion('/api/productos');
  return data.productos || [];
}

/**
 * Obtiene los tipos de productos únicos
 * @returns {Promise<Array>} - Array de tipos
 */
async function obtenerTiposProductos() {
  const data = await fetchScienceMotion('/api/productos/tipos');
  return data.tipos || [];
}

// ============================================================
// 📋 FUNCIONES DE PLANES
// ============================================================

/**
 * Obtiene la lista completa de planes/paquetes
 * @returns {Promise<Array>} - Array de planes
 */
async function obtenerPlanes() {
  const data = await fetchScienceMotion('/api/planes');
  return data.planes || [];
}

/**
 * Obtiene los tipos de planes disponibles
 * @returns {Promise<Array>} - Array de tipos de planes
 */
async function obtenerTiposPlanes() {
  const data = await fetchScienceMotion('/api/planes/tipos');
  return data.tipos || [];
}

// ============================================================
// 💰 FUNCIONES DE VENTAS
// ============================================================

/**
 * Obtiene el resumen general de ventas
 * @param {object} filtros - Filtros opcionales
 * @param {string} filtros.startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} filtros.endDate - Fecha fin (YYYY-MM-DD)
 * @param {string} filtros.sucursalId - ID de la sucursal
 * @returns {Promise<object>} - Resumen de ventas
 */
async function obtenerResumenVentas(filtros = {}) {
  const params = new URLSearchParams();
  
  if (filtros.startDate) params.append('startDate', filtros.startDate);
  if (filtros.endDate) params.append('endDate', filtros.endDate);
  if (filtros.sucursalId) params.append('sucursalId', filtros.sucursalId);
  
  const endpoint = `/api/ventas/general${params.toString() ? '?' + params.toString() : ''}`;
  const data = await fetchScienceMotion(endpoint);
  
  return data.resumen || {};
}

/**
 * Obtiene lista detallada de ventas con filtros
 * @param {object} filtros - Filtros opcionales
 * @param {string} filtros.startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} filtros.endDate - Fecha fin (YYYY-MM-DD)
 * @param {string} filtros.clienteId - ID del cliente
 * @param {string} filtros.productoId - ID del producto
 * @param {string} filtros.tipoProducto - Tipo de producto
 * @param {string} filtros.planId - ID del plan
 * @param {string} filtros.tipoPlan - Tipo de plan
 * @param {string} filtros.sucursalId - ID de la sucursal
 * @param {number} filtros.limit - Límite de resultados (default: 100)
 * @returns {Promise<Array>} - Array de ventas
 */
async function obtenerVentas(filtros = {}) {
  const params = new URLSearchParams();
  
  Object.keys(filtros).forEach(key => {
    if (filtros[key] !== undefined && filtros[key] !== null) {
      params.append(key, filtros[key]);
    }
  });
  
  const endpoint = `/api/ventas${params.toString() ? '?' + params.toString() : ''}`;
  const data = await fetchScienceMotion(endpoint);
  
  return data.ventas || [];
}

/**
 * Obtiene las ventas del día actual
 * @returns {Promise<Array>} - Array de ventas
 */
async function obtenerVentasDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  return obtenerVentas({ startDate: hoy, endDate: hoy });
}

/**
 * Obtiene las ventas del mes actual
 * @returns {Promise<Array>} - Array de ventas
 */
async function obtenerVentasDelMes() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  
  return obtenerVentas({
    startDate: primerDia.toISOString().split('T')[0],
    endDate: ultimoDia.toISOString().split('T')[0]
  });
}

// ============================================================
// 💳 FUNCIONES DE CUENTAS POR COBRAR
// ============================================================

/**
 * Obtiene todas las cuentas por cobrar
 * @param {string} clienteId - ID del cliente (opcional)
 * @returns {Promise<Array>} - Array de cuentas por cobrar
 */
async function obtenerCuentasPorCobrar(clienteId = null) {
  const endpoint = clienteId 
    ? `/api/cuentas-por-cobrar?clienteId=${clienteId}`
    : '/api/cuentas-por-cobrar';
  
  const data = await fetchScienceMotion(endpoint);
  return data.cuentasPorCobrar || [];
}

/**
 * Obtiene la deuda de un cliente específico
 * @param {string} clienteId - ID del cliente
 * @returns {Promise<object|null>} - Deuda del cliente o null si no tiene
 */
async function obtenerDeudaCliente(clienteId) {
  const cuentas = await obtenerCuentasPorCobrar(clienteId);
  return cuentas.length > 0 ? cuentas[0] : null;
}

// ============================================================
// 🔄 FUNCIONES DE SINCRONIZACIÓN
// ============================================================

/**
 * Sincroniza todos los datos desde Science Motion
 * @param {Function} onProgress - Callback de progreso (opcional)
 * @returns {Promise<object>} - Resultado de la sincronización
 */
async function sincronizarDatos(onProgress = null) {
  const resultado = {
    exito: true,
    errores: [],
    productos: 0,
    planes: 0,
    ventas: 0,
    cuentas: 0
  };
  
  try {
    // 1. Sincronizar productos
    if (onProgress) onProgress('Sincronizando productos...');
    const productos = await obtenerProductos();
    resultado.productos = productos.length;
    // Aquí guardarías en tu base de datos
    
    // 2. Sincronizar planes
    if (onProgress) onProgress('Sincronizando planes...');
    const planes = await obtenerPlanes();
    resultado.planes = planes.length;
    // Aquí guardarías en tu base de datos
    
    // 3. Sincronizar ventas del día
    if (onProgress) onProgress('Sincronizando ventas...');
    const ventas = await obtenerVentasDelDia();
    resultado.ventas = ventas.length;
    // Aquí guardarías en tu base de datos
    
    // 4. Sincronizar cuentas por cobrar
    if (onProgress) onProgress('Sincronizando cuentas por cobrar...');
    const cuentas = await obtenerCuentasPorCobrar();
    resultado.cuentas = cuentas.length;
    // Aquí guardarías en tu base de datos
    
    if (onProgress) onProgress('Sincronización completada');
    
  } catch (error) {
    resultado.exito = false;
    resultado.errores.push(error.message);
  }
  
  return resultado;
}

// ============================================================
// 📊 FUNCIONES DE ANÁLISIS
// ============================================================

/**
 * Calcula estadísticas de ventas
 * @param {Array} ventas - Array de ventas
 * @returns {object} - Estadísticas calculadas
 */
function calcularEstadisticas(ventas) {
  if (!ventas || ventas.length === 0) {
    return {
      totalVentas: 0,
      totalIngresos: 0,
      promedioTicket: 0,
      productoMasVendido: null
    };
  }
  
  const totalIngresos = ventas.reduce((sum, v) => sum + v.total, 0);
  const promedioTicket = totalIngresos / ventas.length;
  
  // Contar productos vendidos
  const productosMap = new Map();
  ventas.forEach(v => {
    v.items.forEach(item => {
      const nombre = item.name || item.nombre;
      const cantidad = item.quantity || item.cantidad || 1;
      productosMap.set(nombre, (productosMap.get(nombre) || 0) + cantidad);
    });
  });
  
  // Producto más vendido
  let productoMasVendido = null;
  let maxCantidad = 0;
  productosMap.forEach((cantidad, nombre) => {
    if (cantidad > maxCantidad) {
      maxCantidad = cantidad;
      productoMasVendido = { nombre, cantidad };
    }
  });
  
  return {
    totalVentas: ventas.length,
    totalIngresos,
    promedioTicket,
    productoMasVendido
  };
}

// ============================================================
// 🧪 FUNCIÓN DE PRUEBA
// ============================================================

/**
 * Prueba la conexión con Science Motion
 * @returns {Promise<boolean>} - true si la conexión es exitosa
 */
async function probarConexion() {
  try {
    await fetchScienceMotion('/api/productos/tipos');
    console.log('✅ Conexión exitosa con Science Motion');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// ============================================================
// 📤 EXPORTAR FUNCIONES
// ============================================================

// Para Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Configuración
    API_CONFIG,
    
    // Función base
    fetchScienceMotion,
    
    // Productos
    obtenerProductos,
    obtenerTiposProductos,
    
    // Planes
    obtenerPlanes,
    obtenerTiposPlanes,
    
    // Ventas
    obtenerResumenVentas,
    obtenerVentas,
    obtenerVentasDelDia,
    obtenerVentasDelMes,
    
    // Cuentas por cobrar
    obtenerCuentasPorCobrar,
    obtenerDeudaCliente,
    
    // Sincronización
    sincronizarDatos,
    
    // Análisis
    calcularEstadisticas,
    
    // Testing
    probarConexion
  };
}

// ============================================================
// 💡 EJEMPLO DE USO
// ============================================================

/**
 * EJEMPLO DE USO:
 * 
 * // 1. Importar el módulo
 * const scienceMotion = require('./scienceMotionIntegration');
 * 
 * // 2. Probar la conexión
 * await scienceMotion.probarConexion();
 * 
 * // 3. Obtener productos
 * const productos = await scienceMotion.obtenerProductos();
 * console.log(`Total productos: ${productos.length}`);
 * 
 * // 4. Obtener ventas del día
 * const ventas = await scienceMotion.obtenerVentasDelDia();
 * const stats = scienceMotion.calcularEstadisticas(ventas);
 * console.log(`Ventas del día: ${stats.totalVentas}`);
 * console.log(`Ingresos: $${stats.totalIngresos.toFixed(2)}`);
 * 
 * // 5. Sincronización completa
 * const resultado = await scienceMotion.sincronizarDatos((mensaje) => {
 *   console.log(mensaje);
 * });
 * 
 * if (resultado.exito) {
 *   console.log('✅ Sincronización exitosa');
 * } else {
 *   console.error('❌ Errores:', resultado.errores);
 * }
 */
