import { collectionGroup, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';

/**
 * GET /api/portal-usuarios/cupo-por-fecha?fecha=YYYY-MM-DD
 *
 * Returns per-class enrollment counts for a specific date so the portal
 * can show accurate per-session capacity instead of the global counter.
 *
 * Response: { ok: true, fecha, counts: { classId: enrolledCount, ... } }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { fecha } = req.query;
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Parámetro fecha requerido (YYYY-MM-DD)' });
    }

    const counts = {};

    try {
      // collectionGroup query – single-field index on fechaAsignacionString (auto-created by Firestore)
      const q = query(
        collectionGroup(db, 'clasesAsignadas'),
        where('fechaAsignacionString', '==', fecha)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data();
        if (data.idClase) {
          counts[data.idClase] = (counts[data.idClase] || 0) + 1;
        }
      }
    } catch (err) {
      console.warn('collectionGroup error in cupo-por-fecha:', err);
    }

    return res.status(200).json({ ok: true, fecha, counts });
  } catch (error) {
    console.error('Error en cupo-por-fecha:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
