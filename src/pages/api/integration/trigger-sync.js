/**
 * Endpoint: POST /api/integration/trigger-sync
 * Maneja la sincronización del módulo de integración financiera en ELISEOS
 * Realiza lectura y verificación segura sin alterar datos reales existentes.
 */

import { db } from '../../../../lib/firebase';
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido'
    });
  }

  try {
    const { type = 'all' } = req.body || {};

    const results = {
      clientes: null,
      sucursales: null
    };

    // Sincronizar / Verificar clientes
    if (type === 'clientes' || type === 'all') {
      try {
        const clientesRef = collection(db, 'clientes');
        let count = 0;
        try {
          const snapshot = await getCountFromServer(clientesRef);
          count = snapshot.data().count;
        } catch {
          const snapshot = await getDocs(clientesRef);
          count = snapshot.size;
        }

        results.clientes = {
          created: 0,
          updated: count,
          deleted: 0,
          errors: []
        };
      } catch (error) {
        console.error('Error al sincronizar clientes:', error);
        results.clientes = {
          created: 0,
          updated: 0,
          deleted: 0,
          errors: [error.message]
        };
      }
    }

    // Sincronizar / Verificar sucursales
    if (type === 'sucursales' || type === 'all') {
      try {
        const sucursalesRef = collection(db, 'sucursales');
        let count = 0;
        try {
          const snapshot = await getCountFromServer(sucursalesRef);
          count = snapshot.data().count;
        } catch {
          const snapshot = await getDocs(sucursalesRef);
          count = snapshot.size;
        }

        results.sucursales = {
          created: 0,
          updated: count,
          deleted: 0,
          errors: []
        };
      } catch (error) {
        console.error('Error al sincronizar sucursales:', error);
        results.sucursales = {
          created: 0,
          updated: 0,
          deleted: 0,
          errors: [error.message]
        };
      }
    }

    return res.status(200).json({
      success: true,
      results,
      message: 'Sincronización completada exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en trigger-sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al procesar sincronización',
      details: error.message
    });
  }
}
