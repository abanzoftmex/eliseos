// src/pages/api/portal-usuarios/pasaporte/index.js
import { getSessionFromRequest } from '@/lib/portalAuth';
import { getOrCreatePassport } from '@/lib/firebase/passportService';
import { PASSPORT_DEFAULT_YEAR } from '@/lib/domain/passportConstants';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida o expirada' });
    }

    const year = Number(req.query.year) || PASSPORT_DEFAULT_YEAR;
    const userData = session.user || {};
    const fullName = `${userData.nombre || ''} ${userData.apellidoPaterno || ''} ${userData.apellidoMaterno || ''}`.trim();

    const passportDetails = await getOrCreatePassport(session.userId, year, {
      userType: session.userType || 'cliente',
      userName: fullName || userData.nombre || 'Atleta SIM',
      foto: userData.foto || null
    });

    return res.status(200).json({
      success: true,
      ...passportDetails
    });
  } catch (error) {
    console.error('Error al obtener pasaporte en portal:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener datos del pasaporte' });
  }
}
