import {
  collection, getDocs, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import { getPortalDashboardData } from '../../../../../lib/portalAuth';

async function getRecentAccesos(userId, n = 2) {
  try {
    const snap = await getDocs(
      query(collection(db, 'accesos'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(n))
    );
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id:               d.id,
        registradoPor:    data.registradoPor      || 'Administrador',
        registradoPorRole: data.registradoPorRole || null,
        sucursalNombre:   data.sucursalNombre     || null,
        timestamp:        data.timestamp?.toDate?.()?.toISOString?.() || null,
      };
    });
  } catch {
    // fallback sin índice
    try {
      const snap = await getDocs(
        query(collection(db, 'accesos'), where('userId', '==', userId))
      );
      return snap.docs
        .map(d => {
          const data = d.data();
          return {
            id:               d.id,
            registradoPor:    data.registradoPor      || 'Administrador',
            registradoPorRole: data.registradoPorRole || null,
            sucursalNombre:   data.sucursalNombre     || null,
            timestamp:        data.timestamp?.toDate?.()?.toISOString?.() || null,
          };
        })
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, n);
    } catch { return []; }
  }
}

// Requiere cookie de sesión admin (igual que todas las rutas /api/admin)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token requerido' });

  try {
    // Buscar en clientes y atletas por qrToken
    let userId = null;
    let collectionName = null;

    const [clientesSnap, atletasSnap] = await Promise.all([
      getDocs(query(collection(db, 'clientes'), where('qrToken', '==', token))),
      getDocs(query(collection(db, 'atletas'),  where('qrToken', '==', token))),
    ]);

    if (!clientesSnap.empty) {
      userId = clientesSnap.docs[0].id;
      collectionName = 'clientes';
    } else if (!atletasSnap.empty) {
      userId = atletasSnap.docs[0].id;
      collectionName = 'atletas';
    }

    if (!userId) {
      return res.status(404).json({ error: 'QR no válido o usuario no encontrado' });
    }

    const [data, recentAccesos] = await Promise.all([
      getPortalDashboardData(userId),
      getRecentAccesos(userId, 2),
    ]);
    if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.status(200).json({ ok: true, ...data, collectionName, recentAccesos });
  } catch (error) {
    console.error('Error en usuario-qr admin:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
