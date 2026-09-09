import { getDocs, collectionGroup, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mapeo de nombres completos a valores de BD
const TIPO_PLAN_MAP = {
  'clase grupal': 'grupal',
  'entrenamiento personalizado': 'personalizado',
  'sesión de rehabilitación/masaje': 'sesion',
  'grupal': 'grupal',
  'personalizado': 'personalizado',
  'sesion': 'sesion'
};

/**
 * GET /api/ventas/planes
 * Lista de ventas/asignaciones de planes y paquetes (NO productos)
 * 
 * Query Params:
 *   startDate?: string (YYYY-MM-DD) - Fecha de inicio
 *   endDate?: string (YYYY-MM-DD) - Fecha de fin
 *   clienteId?: string - ID del cliente
 *   planId?: string - ID del plan específico
 *   tipoPlan?: string - Tipo de plan (grupal, personalizado, sesion)
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
      planId, 
      tipoPlan,
      sucursalId,
      limit: limitParam 
    } = req.query;

    const limitValue = parseInt(limitParam) || 1000;

    // Usar collectionGroup para obtener TODOS los paquetes asignados de todos los usuarios
    const paquetesRef = collectionGroup(db, 'paquetesAsignados');
    const q = query(paquetesRef);
    const snapshot = await getDocs(q);

    // Procesar paquetes asignados y convertirlos al formato de "ventas"
    let ventasPlanes = [];
    
    // Crear un mapa para obtener datos de usuarios (optimización)
    const usuariosCache = new Map();
    
    const getUserData = async (paqueteRef) => {
      // paqueteRef.parent es la colección 'paquetesAsignados'
      // paqueteRef.parent.parent es el documento del usuario
      const userId = paqueteRef.parent.parent.id;
      const userCollection = paqueteRef.parent.parent.parent.id; // 'clientes' o 'atletas'
      
      const cacheKey = `${userCollection}_${userId}`;
      
      if (!usuariosCache.has(cacheKey)) {
        try {
          // Crear referencia correcta al documento del usuario
          const userDocRef = doc(db, userCollection, userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            usuariosCache.set(cacheKey, {
              nombre: `${userData.nombre || ''} ${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim(),
              id: userId,
              collection: userCollection,
              plataformaFitness: userData.plataformaFitness || null
            });
          } else {
            usuariosCache.set(cacheKey, {
              nombre: 'Usuario no encontrado',
              id: userId,
              collection: userCollection,
              plataformaFitness: null
            });
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          usuariosCache.set(cacheKey, {
            nombre: 'Error al cargar usuario',
            id: userId,
            collection: userCollection,
            plataformaFitness: null
          });
        }
      }
      
      return usuariosCache.get(cacheKey);
    };

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const fechaAsignacion = data.fechaAsignacion?.toDate?.() || new Date();
      const fechaFormateada = fechaAsignacion.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Obtener datos del usuario (padre del documento)
      const userData = await getUserData(docSnap.ref);
      
      // Determinar el monto pagado y el saldo
      const precioTotal = data.precioFinal || data.precio || data.precioOriginal || 0;
      
      const montoPagado = data.montoPagado !== undefined ? Number(data.montoPagado) : 0;
      const saldoPendiente = Math.max(0, precioTotal - montoPagado);
      
      // Estado: pagado si montoPagado >= precioTotal
      const estaPagado = montoPagado >= precioTotal;
      const estado = estaPagado ? 'pagado' : (montoPagado > 0 ? 'parcial' : 'pendiente');
      
      ventasPlanes.push({
        id: docSnap.id,
        fecha: fechaFormateada,
        clienteNombre: userData.nombre,
        clienteId: userData.id,
        clientePlataforma: userData.plataformaFitness,
        productoNombre: data.nombre || 'Plan sin nombre',
        productoId: data.idPaquete || docSnap.id,
        tipoProducto: data.tipo || 'Plan',
        cantidad: 1, // Los planes siempre son cantidad 1
        precioUnitario: precioTotal,
        total: precioTotal,
        montoPagado: montoPagado,
        saldo: saldoPendiente,
        estado: estado,
        pagado: estaPagado,
        sucursalId: data.sucursalId || null,
        transactionExternalId: data.transactionExternalId || null,
        status: data.status || 'active',
        _fechaAsignacion: fechaAsignacion // Para filtros (no se devuelve al cliente)
      });
    }

    // Aplicar filtros de fecha
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      ventasPlanes = ventasPlanes.filter(v => {
        const vDate = v._fechaAsignacion;
        return vDate >= start && vDate <= end;
      });
    }

    // Filtrar por clienteId
    if (clienteId) {
      ventasPlanes = ventasPlanes.filter(v => v.clienteId === clienteId);
    }

    // Filtrar por planId
    if (planId) {
      ventasPlanes = ventasPlanes.filter(v => v.productoId === planId);
    }

    // Filtrar por tipoPlan
    if (tipoPlan) {
      // Normalizar el tipo de plan para buscar tanto por nombre completo como por valor de BD
      const tipoPlanNormalizado = TIPO_PLAN_MAP[tipoPlan.toLowerCase()] || tipoPlan.toLowerCase();
      
      ventasPlanes = ventasPlanes.filter(v => {
        const tipoProductoNormalizado = v.tipoProducto?.toLowerCase();
        return tipoProductoNormalizado === tipoPlanNormalizado || 
               tipoProductoNormalizado === tipoPlan.toLowerCase();
      });
    }

    // Filtrar por sucursal
    if (sucursalId && sucursalId !== 'Todas') {
      ventasPlanes = ventasPlanes.filter(v => v.sucursalId === sucursalId);
    }

    // Aplicar límite
    const ventasLimitadas = ventasPlanes.slice(0, limitValue);

    // Calcular totales
    const totalVentas = ventasLimitadas.reduce((sum, v) => sum + v.total, 0);
    const cantidadVentas = ventasLimitadas.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    // Limpiar campos internos antes de devolver
    ventasLimitadas.forEach(v => delete v._fechaAsignacion);

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
        planId: planId || null,
        tipoPlan: tipoPlan || null,
        sucursalId: sucursalId || null,
        limit: limitValue
      }
    });

  } catch (error) {
    console.error('Error fetching ventas de planes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las ventas de planes',
      details: error.message
    });
  }
}
