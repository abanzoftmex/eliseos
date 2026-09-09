// src/pages/api/admin/pasaporte/[userId]/composicion.js
import { recordBodyComposition } from '@/lib/firebase/passportService';
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
    const {
      periodo,
      peso,
      altura,
      imc,
      grasaCorporal,
      musculoEsqueletico,
      grasaVisceral,
      metabolismoBasal,
      edadCorporal,
      notas,
      fechaMedicion,
      year = PASSPORT_DEFAULT_YEAR,
      adminName,
      adminId
    } = req.body || {};

    if (!periodo) {
      return res.status(400).json({ error: 'Periodo de medición requerido (ej. enero, marzo, junio, etc.)' });
    }

    const adminInfo = {
      role: authRole,
      name: adminName || authRole || 'Coach',
      id: adminId || 'admin'
    };

    const result = await recordBodyComposition(userId, Number(year), periodo, {
      peso,
      altura,
      imc,
      grasaCorporal,
      musculoEsqueletico,
      grasaVisceral,
      metabolismoBasal,
      edadCorporal,
      notas,
      fechaMedicion
    }, adminInfo);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al registrar composición corporal:', error);
    return res.status(400).json({ error: error.message || 'Error al guardar medición' });
  }
}
