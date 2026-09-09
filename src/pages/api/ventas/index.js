import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/ventas
 * Lista detallada de ventas con filtros - Devuelve ventas expandidas a nivel de item
 * 
 * Query Params:
 *   startDate?: string (YYYY-MM-DD) - Fecha de inicio
 *   endDate?: string (YYYY-MM-DD) - Fecha de fin
 *   clienteId?: string - ID del cliente
 *   productoId?: string - ID del producto
 *   tipoProducto?: string - Tipo de producto (ej: "Cafeteria", "Suplementos")
 *   planId?: string - ID del plan
 *   tipoPlan?: string - Tipo de plan
 *   sucursalId?: string - ID de la sucursal
 *   limit?: number - Límite de resultados (default: 1000)
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
 *       tipoProducto: string,
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
    const { 
      startDate, 
      endDate, 
      clienteId, 
      productoId, 
      tipoProducto, 
      planId, 
      tipoPlan,
      sucursalId,
      limit: limitParam 
    } = req.query;

    const limitValue = parseInt(limitParam) || 1000;

    // Construir query base
    let constraints = [orderBy('createdAt', 'desc')];
    
    // Filtro por sucursal (se puede aplicar directamente en Firestore)
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
          id: `${doc.id}_${index}`, // ID único por item
          ventaId: doc.id, // ID de la venta original
          fecha: fechaFormateada,
          clienteNombre: clienteNombre,
          clienteId: data.client?.id || null,
          productoNombre: item.name || item.nombre || 'Sin nombre',
          productoId: item.id || null,
          tipoProducto: item.tipo || 'Sin categoría',
          cantidad: item.quantity || item.cantidad || 1,
          precioUnitario: item.price || item.precio || 0,
          total: (item.price || item.precio || 0) * (item.quantity || item.cantidad || 1),
          estado: 'pagado', // Las ventas en POS son pagadas
          pagado: true,
          sucursalId: data.sucursalId || null,
          transactionExternalId: data.transactionExternalId || null,
          _ventaDate: ventaDate // Para filtros (no se devuelve al cliente)
        });
      });
    });

    // Aplicar filtros de fecha
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      ventasExpandidas = ventasExpandidas.filter(v => {
        const vDate = v._ventaDate;
        return vDate >= start && vDate <= end;
      });
    }

    // Filtrar por clienteId
    if (clienteId) {
      ventasExpandidas = ventasExpandidas.filter(v => v.clienteId === clienteId);
    }

    // Filtrar por productoId
    if (productoId) {
      ventasExpandidas = ventasExpandidas.filter(v => v.productoId === productoId);
    }

    // Filtrar por tipoProducto
    if (tipoProducto) {
      ventasExpandidas = ventasExpandidas.filter(v => 
        v.tipoProducto?.toLowerCase() === tipoProducto.toLowerCase()
      );
    }

    // Filtrar por planId (para cuando los planes se venden)
    if (planId) {
      ventasExpandidas = ventasExpandidas.filter(v => v.productoId === planId);
    }

    // Filtrar por tipoPlan (si se agrega en el futuro)
    if (tipoPlan) {
      ventasExpandidas = ventasExpandidas.filter(v => 
        v.tipoPlan?.toLowerCase() === tipoPlan.toLowerCase()
      );
    }

    // Aplicar límite
    const ventasLimitadas = ventasExpandidas.slice(0, limitValue);

    // Calcular totales
    const totalVentas = ventasLimitadas.reduce((sum, v) => sum + v.total, 0);
    const cantidadVentas = ventasLimitadas.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    // Limpiar campos internos antes de devolver
    ventasLimitadas.forEach(v => delete v._ventaDate);

    return res.status(200).json({
      success: true,
      ventas: ventasLimitadas,
      totales: {
        totalVentas: parseFloat(totalVentas.toFixed(2)),
        cantidadVentas,
        promedioVenta: parseFloat(promedioVenta.toFixed(2))
      },
      filtros: {
        startDate: startDate || null,
        endDate: endDate || null,
        clienteId: clienteId || null,
        productoId: productoId || null,
        tipoProducto: tipoProducto || null,
        planId: planId || null,
        tipoPlan: tipoPlan || null,
        sucursalId: sucursalId || null,
        limit: limitValue
      }
    });

  } catch (error) {
    console.error('Error fetching ventas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las ventas',
      details: error.message
    });
  }
}
