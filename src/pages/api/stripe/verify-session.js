import Stripe from 'stripe';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { applyPaidCheckoutSession } from '../../../../lib/stripe/applyCheckoutPayment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/stripe/verify-session?session_id=cs_...
 *
 * Camino principal de confirmación de pago SIN webhook: cuando el usuario vuelve a
 * /portal/pago-exitoso, esta ruta consulta la Checkout Session directo en Stripe,
 * verifica payment_status === 'paid', marca los items en Firestore (vía el módulo
 * compartido, que también sincroniza a Science Chago) y devuelve el resultado.
 *
 * Es idempotente — llamarlo varias veces es seguro.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const portalSession = await getSessionFromRequest(req);
    if (!portalSession?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id requerido' });
    }

    // Fetch the session from Stripe
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(session_id);
    } catch (err) {
      return res.status(404).json({ error: 'Sesión de pago no encontrada' });
    }

    // Security: ensure the session belongs to this portal user
    if (stripeSession.metadata?.userId !== portalSession.userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const isPaid = stripeSession.payment_status === 'paid';

    if (isPaid) {
      // Apply payment marks (idempotent) + Science Chago sync
      await applyPaidCheckoutSession(stripeSession);
      // Mark the reconciliation record as applied so /reconcile no lo vuelva a revisar
      await markCheckoutApplied(stripeSession).catch(() => {});
    }

    return res.status(200).json({
      ok: true,
      isPaid,
      status: stripeSession.payment_status,
      amountTotal: stripeSession.amount_total,
      currency: stripeSession.currency,
      customerEmail: stripeSession.customer_email,
      itemCount: stripeSession.metadata?.itemIds
        ? stripeSession.metadata.itemIds.split(',').filter(Boolean).length
        : 0,
    });
  } catch (error) {
    console.error('Error en verify-session:', error);
    return res.status(500).json({ error: 'Error al verificar el pago' });
  }
}

async function markCheckoutApplied(stripeSession) {
  const { userId, userCollection } = stripeSession.metadata || {};
  if (!userId || !userCollection) return;
  await updateDoc(doc(db, userCollection, userId, 'stripeCheckouts', stripeSession.id), {
    applied: true,
    result: 'paid',
    updatedAt: serverTimestamp(),
  });
}
