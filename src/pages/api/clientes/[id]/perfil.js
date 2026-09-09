import { db } from '../../../../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getUserType } from '../../../../../lib/firebase/packagesService';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID de usuario requerido' 
    });
  }

  try {
    if (req.method === 'GET') {
      // Obtener datos del usuario para edición
      const userType = await getUserType(id);
      
      if (!userType) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
      const userRef = doc(db, userCollection, id);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      const userData = userDoc.data();
      
      return res.status(200).json({
        success: true,
        user: {
          id: id,
          type: userType,
          ...userData
        }
      });

    } if (req.method === 'PUT') {
      // Actualizar datos del usuario
      const {
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        telefono,
        telefonoContacto,
        telefonoEmergencia,
        fechaNacimiento,
        genero,
        ladoDominante,
        ocupacion,
        status,
        foto,
        sucursal
      } = req.body;

      // Validaciones básicas
      if (!nombre || !apellidoPaterno) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nombre y apellido paterno son requeridos' 
        });
      }

      if (email && !isValidEmail(email)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email no válido' 
        });
      }

      // Determinar tipo de usuario
      const userType = await getUserType(id);
      
      if (!userType) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
      const userRef = doc(db, userCollection, id);

      // Verificar que el usuario existe
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        return res.status(404).json({ 
          success: false, 
          error: 'Usuario no encontrado' 
        });
      }

      // Preparar datos para actualización
      const updateData = {
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno?.trim() || '',
        email: email?.trim() || '',
        telefono: telefono?.trim() || '',
        telefonoContacto: telefonoContacto?.trim() || '',
        telefonoEmergencia: telefonoEmergencia?.trim() || '',
        fechaNacimiento: fechaNacimiento || '',
        genero: genero || '',
        ladoDominante: ladoDominante || '',
        ocupacion: ocupacion?.trim() || '',
        status: status || 'active',
        foto: foto || '',
        sucursal: sucursal || '',
        updatedAt: serverTimestamp()
      };

      // Actualizar en Firestore
      await updateDoc(userRef, updateData);

      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        user: {
          id: id,
          type: userType,
          ...updateData
        }
      });

    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ 
        success: false, 
        error: `Método ${req.method} no permitido` 
      });
    }

  } catch (error) {
    console.error('Error en API de perfil:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
}

// Función auxiliar para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}