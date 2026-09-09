import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { getUserType } from '../../../../lib/firebase/packagesService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const userId = session.userId;
    const userType = await getUserType(userId);
    if (!userType) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';

    const [productosSnap, paquetesSnap, cargosSnap] = await Promise.all([
      getDocs(collection(db, userCollection, userId, 'productosAsignados')),
      getDocs(collection(db, userCollection, userId, 'paquetesAsignados')),
      getDocs(collection(db, userCollection, userId, 'cargos')),
    ]);

    const serializeTimestamp = (ts) => {
      if (!ts) return null;
      if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().toISOString();
      if (typeof ts === 'string') return ts;
      return null;
    };

    const misProductos = productosSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        fechaAsignacion: serializeTimestamp(data.fechaAsignacion),
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
      };
    });

    misProductos.sort((a, b) => {
      const da = a.fechaAsignacion ? new Date(a.fechaAsignacion).getTime() : 0;
      const db2 = b.fechaAsignacion ? new Date(b.fechaAsignacion).getTime() : 0;
      return db2 - da;
    });

    const misCompras = cargosSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          tipo: data.tipo || 'venta_pos',
          descripcion: data.descripcion || 'Compra en tienda',
          items: data.items || [],
          monto: Number(data.monto || 0),
          montoPagado: Number(data.montoPagado || data.totalValidado || 0),
          estatus: data.estatus || 'pendiente',
          isPaid: data.isPaid || false,
          paymentPendingValidation: data.paymentPendingValidation || false,
          createdAt: serializeTimestamp(data.createdAt),
        };
      })
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db4 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db4 - da;
      });

    const misPaquetes = paquetesSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        idPaquete: data.idPaquete || null,
        nombre: data.nombre || 'Paquete',
        descripcion: data.descripcion || '',
        tipo: data.tipo || null,
        precioFinal: data.precioFinal || null,
        precioOriginal: data.precioOriginal || null,
        descuento: data.descuento || null,
        status: data.status || null,
        activo: data.activo ?? null,
        numeroServicios: data.numeroServicios || 0,
        sessionsTaken: data.sessionsTaken ? data.sessionsTaken.length : 0,
        fechaAsignacion: serializeTimestamp(data.fechaAsignacion),
        sucursalId: data.sucursalId || null,
      };
    });
    misPaquetes.sort((a, b) => {
      const da = a.fechaAsignacion ? new Date(a.fechaAsignacion).getTime() : 0;
      const db3 = b.fechaAsignacion ? new Date(b.fechaAsignacion).getTime() : 0;
      return db3 - da;
    });

    return res.status(200).json({
      success: true,
      misProductos,
      misCompras,
      misPaquetes,
    });
  } catch (error) {
    console.error('Error fetching portal productos:', error);
    return res.status(500).json({ error: 'Error al cargar productos' });
  }
}
