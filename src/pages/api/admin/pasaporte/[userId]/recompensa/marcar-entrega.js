// src/pages/api/admin/pasaporte/[userId]/recompensa/marcar-entrega.js
import { markRewardDelivered } from '@/lib/firebase/passportService';
import { PASSPORT_DEFAULT_YEAR } from '@/lib/domain/passportConstants';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar auth admin
  const authToken = req.cookies['auth-token'];
  const authRole = req.cookies['auth-role'];
  if (!authToken || !authRole) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    const { rewardDocId, notas, year = PASSPORT_DEFAULT_YEAR, adminName, adminId } = req.body || {};

    if (!rewardDocId) {
      return res.status(400).json({ error: 'rewardDocId requerido' });
    }

    const adminInfo = {
      role: authRole,
      name: adminName || authRole || 'Staff',
      id: adminId || 'admin'
    };

    const result = await markRewardDelivered(userId, Number(year), rewardDocId, { notas }, adminInfo);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al marcar entrega de recompensa:', error);
    return res.status(400).json({ error: error.message || 'Error al procesar entrega' });
  }
}
