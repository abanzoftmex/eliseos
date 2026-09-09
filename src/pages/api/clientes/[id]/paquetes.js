import { getUserPackages, getUserType } from '../../../../../lib/firebase/packagesService';
import { db } from '../../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    // Obtener tipo de usuario
    const userType = await getUserType(id);
    
    if (!userType) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener datos del usuario
    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const userRef = doc(db, userCollection, id);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data();
    const user = {
      id: id,
      name: `${userData.nombre} ${userData.apellidoPaterno} ${userData.apellidoMaterno || ''}`.trim(),
      email: userData.email || 'Sin email',
      telefono: userData.telefono || userData.telefonoContacto || 'Sin teléfono',
      ocupacion: userData.ocupacion || (userType === 'atleta' ? userData.deporte : 'Sin especificar'),
      foto: userData.foto,
      type: userType,
      ...userData
    };

    // Obtener paquetes del usuario
    const packagesResult = await getUserPackages(id);
    
    if (!packagesResult.success) {
      return res.status(500).json({ 
        error: packagesResult.error || 'Error al cargar paquetes' 
      });
    }

    // Convertir Timestamps de Firebase a formato serializable
    const serializedPackages = packagesResult.packages.map(pkg => {
      const serializedPkg = { ...pkg };
      
      // Convertir fechaAsignacion si es un Timestamp
      if (pkg.fechaAsignacion && typeof pkg.fechaAsignacion.toDate === 'function') {
        serializedPkg.fechaAsignacion = pkg.fechaAsignacion.toDate().toISOString();
      } else if (pkg.fechaAsignacion && pkg.fechaAsignacion._seconds) {
        // Formato alternativo de Timestamp
        serializedPkg.fechaAsignacion = new Date(pkg.fechaAsignacion._seconds * 1000).toISOString();
      }
      
      return serializedPkg;
    });

    return res.status(200).json({
      success: true,
      user,
      userType,
      packages: serializedPackages
    });

  } catch (error) {
    console.error('Error in /api/clientes/[id]/paquetes:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
