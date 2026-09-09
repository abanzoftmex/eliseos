import { PaymentService } from '../../../../../lib/domain/payment/service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId, userType, assignmentId, abonoId, action, reason } = req.body;

  if (!userId || !userType || !assignmentId || !abonoId || !action) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    let result;
    if (action === 'validate') {
      result = await PaymentService.validateAbono(userId, userType, assignmentId, abonoId);
    } else if (action === 'reject') {
      result = await PaymentService.rejectAbono(userId, userType, assignmentId, abonoId, reason);
    } else {
      return res.status(400).json({ error: 'Acción no válida' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in validar-abono API:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
}
