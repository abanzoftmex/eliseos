// src/pages/api/portal-usuarios/pasaporte/elegir-recompensa.js
import { getSessionFromRequest } from '@/lib/portalAuth';
import { selectReward } from '@/lib/firebase/passportService';
import { PASSPORT_DEFAULT_YEAR } from '@/lib/domain/passportConstants';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida o expirada' });
    }

    const { tipo, periodo, opcionId, opcionTitulo, year = PASSPORT_DEFAULT_YEAR } = req.body || {};

    if (!tipo || !periodo || !opcionId) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos (tipo, periodo, opcionId)' });
    }

    const result = await selectReward(session.userId, Number(year), {
      tipo,
      periodo,
      opcionId,
      opcionTitulo
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al elegir recompensa en portal:', error);
    return res.status(400).json({ error: error.message || 'Error al procesar la recompensa' });
  }
}
