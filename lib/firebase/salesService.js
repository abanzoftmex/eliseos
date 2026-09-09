import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    doc,
    where
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Registrar una nueva venta
 * @param {Object} ventaData - Datos de la venta
 * @returns {Promise<Object>} Resultado de la operación
 */
export const createVenta = async (ventaData) => {
    try {
        const ventaRef = await addDoc(collection(db, 'ventas'), {
            ...ventaData,
            createdAt: serverTimestamp(),
            date: serverTimestamp()
        });

        return { success: true, ventaId: ventaRef.id };
    } catch (error) {
        console.error('Error creating venta:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Eliminar una venta (Solo desarrollo/admin)
 * @param {string} ventaId
 */
export const deleteVenta = async (ventaId) => {
    try {
        await deleteDoc(doc(db, 'ventas', ventaId));
        return { success: true };
    } catch (error) {
        console.error('Error deleting venta:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtener historial de ventas
 * @param {number} limitCount - Número de ventas a recuperar
 * @returns {Promise<Object>} Resultado con lista de ventas
 */
export const getVentas = async (sucursalId = null, limitCount = 50) => {
    try {
        let constraints = [orderBy('createdAt', 'desc'), limit(limitCount)];

        if (sucursalId && sucursalId !== 'Todas') {
            constraints.unshift(where('sucursalId', '==', sucursalId));
        }

        const q = query(collection(db, 'ventas'), ...constraints);

        const snapshot = await getDocs(q);
        const ventas = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // Convertir Timestamp a Date si existe
            const date = data.date?.toDate ? data.date.toDate() : new Date();

            ventas.push({
                id: doc.id,
                ...data,
                date
            });
        });

        return { success: true, ventas };
    } catch (error) {
        console.error('Error getting ventas:', error);
        return { success: false, error: error.message };
    }
};
