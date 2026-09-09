import { getPortalDashboardData, getSessionFromRequest } from '../../../../lib/portalAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);

    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesion no valida' });
    }

    const dashboardData = await getPortalDashboardData(session.userId);

    if (!dashboardData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      authenticated: true,
      ...dashboardData
    });
  } catch (error) {
    console.error('Error en me portal usuarios:', error);
    return res.status(500).json({ error: 'Error interno al cargar dashboard' });
  }
}
