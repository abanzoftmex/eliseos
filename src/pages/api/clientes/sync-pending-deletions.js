import { syncClienteToScienceChago } from '../../../lib/scienceChago';
import {
  getPendingClienteDeletions,
  incrementPendingClienteDeletionAttempt,
  markPendingClienteDeletionResult
} from '../../../lib/clientDeletionSync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const pendingDeletions = await getPendingClienteDeletions();

    let synced = 0;
    let failed = 0;
    const errors = [];

    for (const pendingDeletion of pendingDeletions) {
      try {
        const syncResult = await syncClienteToScienceChago(pendingDeletion.payload, true);

        if (syncResult?.success) {
          await markPendingClienteDeletionResult(pendingDeletion.clienteId, { success: true });
          synced++;
        } else {
          const error = syncResult?.error || 'No se pudo sincronizar la baja pendiente';
          await incrementPendingClienteDeletionAttempt(pendingDeletion.clienteId, error);
          failed++;
          errors.push({ clienteId: pendingDeletion.clienteId, error });
        }
      } catch (error) {
        await incrementPendingClienteDeletionAttempt(pendingDeletion.clienteId, error.message);
        failed++;
        errors.push({ clienteId: pendingDeletion.clienteId, error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      synced,
      failed,
      total: pendingDeletions.length,
      errors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
