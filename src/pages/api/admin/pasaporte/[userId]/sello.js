// src/pages/api/admin/pasaporte/[userId]/sello.js
import { assignStamp, revokeStamp } from '@/lib/firebase/passportService';
import { PASSPORT_DEFAULT_YEAR } from '@/lib/domain/passportConstants';

export default async function handler(req, res) {
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

  const adminInfo = {
    role: authRole,
    name: req.body?.adminName || authRole || 'Administrador',
    id: req.body?.adminId || 'admin'
  };

  if (req.method === 'POST') {
    try {
      const { categoria, tipo, periodo, trimestre, evidencia, origen = 'manual', year = PASSPORT_DEFAULT_YEAR } = req.body || {};

      if (!categoria || !tipo || !periodo || !trimestre) {
        return res.status(400).json({ error: 'Faltan campos requeridos (categoria, tipo, periodo, trimestre)' });
      }

      const result = await assignStamp(userId, Number(year), {
        categoria,
        tipo,
        periodo,
        trimestre,
        evidencia,
        origen
      }, adminInfo);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error al asignar sello:', error);
      return res.status(400).json({ error: error.message || 'Error al asignar sello' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { stampDocId, year = PASSPORT_DEFAULT_YEAR } = req.body || {};

      if (!stampDocId) {
        return res.status(400).json({ error: 'stampDocId requerido para revocar' });
      }

      const result = await revokeStamp(userId, Number(year), stampDocId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error al revocar sello:', error);
      return res.status(400).json({ error: error.message || 'Error al revocar sello' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
