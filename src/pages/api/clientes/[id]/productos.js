import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { getUserType } from '../../../../../lib/firebase/packagesService';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Determinar el tipo de usuario
    const userType = await getUserType(id);
    if (!userType) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';

    // Obtener productos asignados
    const productosRef = collection(db, userCollection, id, 'productosAsignados');
    const productosSnapshot = await getDocs(productosRef);

    const productos = [];
    productosSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convertir timestamps de Firestore a strings para serialización
      let fechaAsignacion = null;
      if (data.fechaAsignacion) {
        if (data.fechaAsignacion.toDate && typeof data.fechaAsignacion.toDate === 'function') {
          fechaAsignacion = data.fechaAsignacion.toDate().toISOString();
        } else if (typeof data.fechaAsignacion === 'string') {
          fechaAsignacion = data.fechaAsignacion;
        }
      }
      
      let createdAt = null;
      if (data.createdAt) {
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAt = data.createdAt;
        }
      }
      
      let updatedAt = null;
      if (data.updatedAt) {
        if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
          updatedAt = data.updatedAt.toDate().toISOString();
        } else if (typeof data.updatedAt === 'string') {
          updatedAt = data.updatedAt;
        }
      }
      
      productos.push({
        id: doc.id,
        ...data,
        fechaAsignacion,
        createdAt,
        updatedAt,
      });
    });

    return res.status(200).json({
      success: true,
      productos
    });
  } catch (error) {
    console.error('Error fetching user productos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener productos del usuario'
    });
  }
}
