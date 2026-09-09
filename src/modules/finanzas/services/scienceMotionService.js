/**
 * Servicio para consumir datos de Science Motion API
 * Obtiene información de ventas, productos, planes y paquetes
 */

const EXTERNAL_SYSTEM_URL = process.env.EXTERNAL_SYSTEM_URL || 'http://localhost:3000';
const API_KEY = process.env.API_INTEGRATION_SECRET || 'eliseos-admin-api-key-2026';

class ScienceMotionService {
  /**
   * Realiza una petición fetch con headers de autenticación
   * @param {string} url - URL completa del endpoint
   * @returns {Promise<Object>} Respuesta JSON
   */
  async fetchWithAuth(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      });

      // Verificar si la respuesta es HTML (error 404)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Endpoint no encontrado: ${url}. Verifica que ELISEOS esté corriendo y que el endpoint exista.`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new Error(`No se puede conectar a ELISEOS (${EXTERNAL_SYSTEM_URL}). Verifica que el servidor esté corriendo.`);
      }
      throw error;
    }
  }

  /**
   * Obtiene todas las ventas con filtros opcionales
   * @param {Object} filters - Filtros para las ventas
   * @returns {Promise<Object>} Ventas encontradas
   */
  async getVentas(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.clienteId) params.append('clienteId', filters.clienteId);
      if (filters.productoId) params.append('productoId', filters.productoId);
      if (filters.tipoProducto) params.append('tipoProducto', filters.tipoProducto);
      if (filters.planId) params.append('planId', filters.planId);
      if (filters.tipoPlan) params.append('tipoPlan', filters.tipoPlan);
      
      const url = `${EXTERNAL_SYSTEM_URL}/api/ventas?${params.toString()}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getVentas:', error);
      throw error;
    }
  }

  /**
   * Obtiene el resumen general de ventas
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} Resumen de ventas
   */
  async getVentasGenerales(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const url = `${EXTERNAL_SYSTEM_URL}/api/ventas/general?${params.toString()}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getVentasGenerales:', error);
      throw error;
    }
  }

  /**
   * Obtiene ventas de planes y paquetes
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} Ventas de planes
   */
  async getVentasPlanes(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.planId) params.append('planId', filters.planId);
      if (filters.tipoPlan) params.append('tipoPlan', filters.tipoPlan);
      if (filters.clienteId) params.append('clienteId', filters.clienteId);
      
      const url = `${EXTERNAL_SYSTEM_URL}/api/ventas/planes?${params.toString()}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getVentasPlanes:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de productos
   * @returns {Promise<Array>} Lista de productos
   */
  async getProductos() {
    try {
      const url = `${EXTERNAL_SYSTEM_URL}/api/productos`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getProductos:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de planes y paquetes
   * @returns {Promise<Array>} Lista de planes y paquetes
   */
  async getPlanes() {
    try {
      const url = `${EXTERNAL_SYSTEM_URL}/api/planes`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getPlanes:', error);
      throw error;
    }
  }

  /**
   * Obtiene el total de cuentas por cobrar
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} Cuentas por cobrar
   */
  async getCuentasPorCobrar(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.clienteId) params.append('clienteId', filters.clienteId);
      
      const url = `${EXTERNAL_SYSTEM_URL}/api/cuentas-por-cobrar?${params.toString()}`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getCuentasPorCobrar:', error);
      throw error;
    }
  }

  /**
   * Obtiene los tipos de productos disponibles
   * @returns {Promise<Array>} Tipos de productos
   */
  async getTiposProducto() {
    try {
      const url = `${EXTERNAL_SYSTEM_URL}/api/productos/tipos`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getTiposProducto:', error);
      throw error;
    }
  }

  /**
   * Obtiene los tipos de planes disponibles
   * @returns {Promise<Array>} Tipos de planes
   */
  async getTiposPlanes() {
    try {
      const url = `${EXTERNAL_SYSTEM_URL}/api/planes/tipos`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getTiposPlanes:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de sucursales
   * @returns {Promise<Array>} Lista de sucursales
   */
  async getSucursales() {
    try {
      const url = `${EXTERNAL_SYSTEM_URL}/api/sucursales`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error en getSucursales:', error);
      throw error;
    }
  }
}

export const scienceMotionService = new ScienceMotionService();
export default scienceMotionService;