import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const COLLECTION_NAME = 'clientes';

export const clienteService = {
  // Get all clientes with filters
  async getAll(filters = {}) {
    try {
      const clientesRef = collection(db, COLLECTION_NAME);
      let q = query(clientesRef);
      
      // Apply filters
      if (filters.sucursal) {
        // Buscar clientes que tengan esta sucursal en su array
        q = query(q, where('sucursales', 'array-contains', filters.sucursal));
      }
      
      if (filters.tipo) {
        q = query(q, where('tipo', '==', filters.tipo));
      }
      
      if (filters.activo !== undefined) {
        q = query(q, where('activo', '==', filters.activo));
      }
      
      const snapshot = await getDocs(q);
      let clientes = [];
      
      snapshot.forEach((doc) => {
        clientes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Ordenar por nombre en memoria
      clientes.sort((a, b) => {
        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
      
      // Aplicar paginación en memoria si es necesario
      if (filters.pageSize) {
        const startIndex = filters.lastDoc ? clientes.findIndex(c => c.id === filters.lastDoc.id) + 1 : 0;
        clientes = clientes.slice(startIndex, startIndex + filters.pageSize);
      }
      
      return {
        clientes,
        lastDoc: clientes[clientes.length - 1]
      };
    } catch (error) {
      console.error('Error getting clientes:', error);
      throw new Error('Error al obtener clientes');
    }
  },

  // Get cliente by ID
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Cliente no encontrado');
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error getting cliente:', error);
      throw new Error('Error al obtener cliente');
    }
  },

  // Sync clientes from external system (batch upsert)
  async syncFromExternal(clientesData) {
    try {
      const batch = writeBatch(db);
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const clienteData of clientesData) {
        try {
          if (!clienteData.id) {
            results.errors.push({ data: clienteData, error: 'ID faltante' });
            continue;
          }

          const docRef = doc(db, COLLECTION_NAME, clienteData.id);
          const docSnap = await getDoc(docRef);
          
          const dataToSave = {
            ...clienteData,
            sucursales: Array.isArray(clienteData.sucursales) ? clienteData.sucursales : [],
            activo: clienteData.activo !== undefined ? clienteData.activo : true,
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
            data: clienteData, 
            error: error.message 
          });
        }
      }

      await batch.commit();
      
      return results;
    } catch (error) {
      console.error('Error syncing clientes:', error);
      throw new Error('Error al sincronizar clientes');
    }
  }
};

export default clienteService;
