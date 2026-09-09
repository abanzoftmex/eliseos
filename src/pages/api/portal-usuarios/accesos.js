import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const snap = await getDocs(
      query(
        collection(db, 'accesos'),
        where('userId', '==', session.userId),
        orderBy('timestamp', 'desc'),
      )
    );

    const accesos = snap.docs.map(d => {
      const data = d.data();
      return {
        id:               d.id,
        registradoPor:    data.registradoPor      || 'Administrador',
        registradoPorRole: data.registradoPorRole || null,
        sucursalNombre:   data.sucursalNombre     || null,
        timestamp:        data.timestamp?.toDate?.()?.toISOString?.() || null,
      };
    });

    return res.status(200).json({ ok: true, accesos });
  } catch (error) {
    // Fallback si no existe el índice aún
    try {
      const session = await getSessionFromRequest(req);
      const snap = await getDocs(
        query(collection(db, 'accesos'), where('userId', '==', session.userId))
      );
      const accesos = snap.docs
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
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return res.status(200).json({ ok: true, accesos });
    } catch (e) {
      console.error('Error obteniendo accesos:', e);
      return res.status(500).json({ error: 'Error al cargar accesos' });
    }
  }
}
