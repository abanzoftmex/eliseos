import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/ventas/general
 * Obtiene resumen general de ventas expandidas a nivel de item
 * 
 * Query Params:
 *   startDate?: string (YYYY-MM-DD) - Fecha de inicio
 *   endDate?: string (YYYY-MM-DD) - Fecha de fin
 *   sucursalId?: string - ID de la sucursal
 * 
 * Headers:
 *   x-api-key: API key para autenticación
 * 
 * Response:
 *   {
 *     success: boolean,
 *     ventas: Array<{
 *       id: string,
 *       fecha: string (YYYY-MM-DD),
 *       clienteNombre: string,
 *       productoNombre: string,
 *       cantidad: number,
 *       total: number,
 *       estado: string,
 *       pagado: boolean
 *     }>,
 *     totales: {
 *       totalVentas: number,
 *       cantidadVentas: number,
 *       promedioVenta: number
 *     }
 *   }
 */
export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido. Use GET.' 
    });
  }

  // Validar API Key
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY || 'science-chago-api-integration-key-2026';
  
  if (apiKey !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'API key inválida o faltante' 
    });
  }

  try {
    const { startDate, endDate, sucursalId } = req.query;

    // Construir query
    let constraints = [orderBy('createdAt', 'desc')];
    
    // Filtro por sucursal
    if (sucursalId && sucursalId !== 'Todas') {
      constraints.unshift(where('sucursalId', '==', sucursalId));
    }

    const ventasRef = collection(db, 'ventas');
    const q = query(ventasRef, ...constraints);
    const snapshot = await getDocs(q);

    // Procesar ventas y EXPANDIR a nivel de item individual
    let ventasExpandidas = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const ventaDate = data.createdAt?.toDate?.() || data.date?.toDate?.() || new Date();
      const fechaFormateada = ventaDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const clienteNombre = data.client 
        ? `${data.client.nombre || ''} ${data.client.apellidoPaterno || ''} ${data.client.apellidoMaterno || ''}`.trim()
        : 'Venta de Mostrador';
      
      // Expandir cada item de la venta en una fila individual
      const items = data.items || [];
      items.forEach((item, index) => {
        ventasExpandidas.push({
          id: `${doc.id}_${index}`,
          ventaId: doc.id,
          fecha: fechaFormateada,
          clienteNombre: clienteNombre,
          clienteId: data.client?.id || null,
          productoNombre: item.name || item.nombre || 'Sin nombre',
          productoId: item.id || null,
          tipoProducto: item.tipo || 'Sin categoría',
          cantidad: item.quantity || item.cantidad || 1,
          precioUnitario: item.price || item.precio || 0,
          total: (item.price || item.precio || 0) * (item.quantity || item.cantidad || 1),
          estado: 'pagado',
          pagado: true,
          sucursalId: data.sucursalId || null,
          _ventaDate: ventaDate
        });
      });
    });

    // Filtrar por fechas si se proporcionan
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      ventasExpandidas = ventasExpandidas.filter(v => {
        const vDate = v._ventaDate;
        return vDate >= start && vDate <= end;
      });
    }

    // Calcular totales
    const totalVentas = ventasExpandidas.reduce((sum, v) => sum + v.total, 0);
    const cantidadVentas = ventasExpandidas.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    // Limpiar campos internos
    ventasExpandidas.forEach(v => delete v._ventaDate);

    return res.status(200).json({
      success: true,
      ventas: ventasExpandidas,
      totales: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        cantidadVentas,
        promedioVenta: parseFloat(promedioVenta.toFixed(2))
      },
      filtros: {
        startDate: startDate || null,
        endDate: endDate || null,
        sucursalId: sucursalId || null
      }
    });

  } catch (error) {
    console.error('Error fetching ventas general:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener resumen de ventas',
      details: error.message
    });
  }
}
