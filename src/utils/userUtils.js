import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getUserType } from '../../lib/firebase/packagesService';


// Cache para almacenar nombres de usuarios ya obtenidos
const userNameCache = new Map();

/**
 * Obtiene el nombre completo de un usuario (cliente o atleta) desde Firebase
 * @param {string} userId - ID del usuario
 * @returns {Promise<{name: string, type: string|null}>} Nombre del usuario y su tipo
 */
export async function getUserName(userId) {
  if (!userId) {
    return { name: 'Cliente', type: null };
  }

  // Verificar si el nombre ya está en cache
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId);
  }

  try {
    // Obtener el tipo de usuario (cliente o atleta)
    const userType = await getUserType(userId);
    
    if (!userType) {
      const fallback = { name: 'Cliente', type: null };
      userNameCache.set(userId, fallback);
      return fallback;
    }

    // Determinar la colección correcta
    const collection = userType === 'cliente' ? 'clientes' : 'atletas';
    const userRef = doc(db, collection, userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const fullName = `${userData.nombre || ''} ${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim();
      
      const result = {
        name: fullName || 'Cliente',
        type: userType
      };
      
      // Guardar en cache
      userNameCache.set(userId, result);
      return result;
    } else {
      const fallback = { name: 'Cliente', type: userType };
      userNameCache.set(userId, fallback);
      return fallback;
    }
  } catch (error) {
    console.error('Error obteniendo nombre de usuario:', error);
    const fallback = { name: 'Cliente', type: null };
    userNameCache.set(userId, fallback);
    return fallback;
  }
}

/**
 * Limpia el cache de nombres de usuarios
 * @param {string} [userId] - ID específico a limpiar, o todos si no se especifica
 */
export function clearUserNameCache(userId = null) {
  if (userId) {
    userNameCache.delete(userId);
  } else {
    userNameCache.clear();
  }
}
