import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  query, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'sucursales';

export const sucursalService = {
  // Get all sucursales
  async getAll() {
    try {
      const sucursalesRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(sucursalesRef);
      const sucursales = [];
      
      snapshot.forEach((doc) => {
        sucursales.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ordenar por nombre en memoria
      sucursales.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      return sucursales;
    } catch (error) {
      console.error('Error getting sucursales:', error);
      throw new Error('Error al obtener sucursales');
    }
  },

  // Get sucursal by ID
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Sucursal no encontrada');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error getting sucursal:', error);
      throw error;
    }
  },

  // Sync sucursales from external system (batch upsert)
  async syncFromExternal(sucursalesData) {
    try {
      const batch = writeBatch(db);
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const sucursalData of sucursalesData) {
        try {
          if (!sucursalData.id) {
            results.errors.push({ data: sucursalData, error: 'ID faltante' });
            continue;
          }

          const docRef = doc(db, COLLECTION_NAME, sucursalData.id);
          const docSnap = await getDoc(docRef);
          
          const dataToSave = {
            ...sucursalData,
            syncedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          if (!docSnap.exists()) {
            dataToSave.createdAt = serverTimestamp();
            results.created++;
          } else {
            results.updated++;
          }
          
          batch.set(docRef, dataToSave, { merge: true });
        } catch (error) {
          results.errors.push({ 
            data: sucursalData, 
            error: error.message 
          });
        }
      }

      await batch.commit();
      
      return results;
    } catch (error) {
      console.error('Error syncing sucursales:', error);
      throw new Error('Error al sincronizar sucursales');
    }
  },

  // Validate sucursal data
  validateSucursalData(sucursalData) {
    const errors = [];
    
    if (!sucursalData.name) {
      errors.push('El nombre de la sucursal es requerido');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
