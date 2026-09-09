import { db } from '../../../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const q = query(collection(db, 'sucursales'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);

        const sucursales = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Si no hay sucursales en BD, usar default (fallback seguro)
        if (sucursales.length === 0) {
            // Intento de fallback o retornar vacío
            // Por ahora retornamos vacío para que el front decida o el admin cree las sucursales
        }

        return res.status(200).json({
            success: true,
            data: sucursales,
            count: sucursales.length
        });

    } catch (error) {
        console.error('Error fetching sucursales:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno al obtener sucursales'
        });
    }
}
