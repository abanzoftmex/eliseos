import { collection, getDocs, getDoc, doc, query, where, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/cuentas-por-cobrar
 * Obtiene las cuentas por cobrar (paquetes con saldo pendiente) expandidas por paquete
 * 
 * Query Params:
 *   clienteId?: string - ID del cliente específico
 * 
 * Headers:
 *   x-api-key: API key para autenticación
 * 
 * Response:
 *   {
 *     success: boolean,
 *     cuentas: Array<{
 *       id: string,
 *       clienteNombre: string,
 *       fechaVenta: string (YYYY-MM-DD),
 *       totalVenta: number,
 *       pagado: number,
 *       saldo: number,
 *       diasVencido: number
 *     }>,
 *     totales: {
 *       totalPorCobrar: number,
 *       totalCobrado: number,
 *       saldoPendiente: number
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
    const { clienteId } = req.query;
    const cuentasExpandidas = [];

    // Usar collectionGroup para obtener todos los paquetes asignados (igual que en /api/ventas/planes)
    const paquetesRef = collectionGroup(db, 'paquetesAsignados');
    const q = query(paquetesRef);
    const snapshot = await getDocs(q);

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
          const userDocRef = doc(db, userCollection, userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            usuariosCache.set(cacheKey, {
              nombre: `${userData.nombre || ''} ${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim(),
              email: userData.email || null,
              id: userId
            });
          } else {
            usuariosCache.set(cacheKey, {
              nombre: 'Usuario no encontrado',
              email: null,
              id: userId
            });
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          usuariosCache.set(cacheKey, {
            nombre: 'Error al cargar usuario',
            email: null,
            id: userId
          });
        }
      }
      
      return usuariosCache.get(cacheKey);
    };

    // Procesar cada paquete
    for (const paqueteDoc of snapshot.docs) {
      const data = paqueteDoc.data();
      
      // Obtener datos del usuario
      const userData = await getUserData(paqueteDoc.ref);
      const userId = userData.id;
      
      // Filtrar por clienteId si se especificó
      if (clienteId && userId !== clienteId) {
        continue;
      }

      const precioTotal = data.precioFinal || data.precio || data.precioOriginal || 0;
      
      const montoPagado = data.montoPagado !== undefined ? Number(data.montoPagado) : 0;
      const saldoPendiente = Math.max(0, precioTotal - montoPagado);

      // Solo incluir si hay saldo pendiente
      if (saldoPendiente > 0) {

        const fechaAsignacion = data.fechaAsignacion?.toDate?.() || new Date();
        const fechaFormateada = fechaAsignacion.toISOString().split('T')[0];
        
        // Calcular días vencidos (asumiendo 30 días de plazo por defecto)
        const diasDesdeAsignacion = Math.floor((new Date() - fechaAsignacion) / (1000 * 60 * 60 * 24));
        const diasVencido = Math.max(0, diasDesdeAsignacion - 30);
        
        cuentasExpandidas.push({
          id: `${userId}_${paqueteDoc.id}`,
          clienteId: userId,
          clienteNombre: userData.nombre,
          clienteEmail: userData.email,
          paqueteId: paqueteDoc.id,
          paqueteNombre: data.nombre || 'Sin nombre',
          fechaVenta: fechaFormateada,
          totalVenta: precioTotal,
          pagado: montoPagado,
          saldo: saldoPendiente,
          diasVencido,
          status: data.status || 'active',
          tipo: data.tipo || null
        });
      }
    }

    // Convertir a array y calcular totales
    cuentasExpandidas.sort((a, b) => b.saldo - a.saldo); // Ordenar por deuda mayor

    const totalPorCobrar = cuentasExpandidas.reduce((sum, c) => sum + c.totalVenta, 0);
    const totalCobrado = cuentasExpandidas.reduce((sum, c) => sum + c.pagado, 0);
    const saldoPendiente = cuentasExpandidas.reduce((sum, c) => sum + c.saldo, 0);

    return res.status(200).json({
      success: true,
      cuentas: cuentasExpandidas,
      totales: {
        totalPorCobrar: parseFloat(totalPorCobrar.toFixed(2)),
        totalCobrado: parseFloat(totalCobrado.toFixed(2)),
        saldoPendiente: parseFloat(saldoPendiente.toFixed(2))
      },
      filtros: {
        clienteId: clienteId || null
      }
    });

  } catch (error) {
    console.error('Error fetching cuentas por cobrar:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las cuentas por cobrar',
      details: error.message
    });
  }
}
