import Stripe from 'stripe';
import { doc, getDoc, collection, query, where, limit, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';
import { applyPaidCheckoutSession } from '../../../../lib/stripe/applyCheckoutPayment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/stripe/reconcile
 *
 * Red de seguridad SIN webhook: revisa las Checkout Sessions que el usuario inició
 * y que aún no se han aplicado (applied:false). Para cada una consulta su estado en
 * Stripe; si está pagada, aplica el pago (idempotente) y la marca como conciliada.
 *
 * La página /portal/estado-de-cuenta lo llama al cargar, así que cubre el caso en que
 * el cliente pagó pero cerró la pestaña antes de volver a la página de éxito.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const portalSession = await getSessionFromRequest(req);
    if (!portalSession?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    // Determinar colección del usuario
    let userCollection = 'clientes';
    const clienteSnap = await getDoc(doc(db, 'clientes', portalSession.userId));
    if (!clienteSnap.exists()) {
      const atletaSnap = await getDoc(doc(db, 'atletas', portalSession.userId));
      if (atletaSnap.exists()) userCollection = 'atletas';
    }

    const ref = collection(db, userCollection, portalSession.userId, 'stripeCheckouts');
    const pendientesSnap = await getDocs(query(ref, where('applied', '==', false), limit(25)));

    let applied = 0;
    let checked = 0;

    for (const d of pendientesSnap.docs) {
      checked++;
      const sessionId = d.id;
      let stripeSession;
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      } catch {
        continue; // sesión no recuperable; la dejamos para otra vez
      }

      // Seguridad: la sesión debe pertenecer a este usuario
      if (stripeSession.metadata?.userId !== portalSession.userId) continue;

      if (stripeSession.payment_status === 'paid') {
        const r = await applyPaidCheckoutSession(stripeSession);
        applied += r.applied;
        await updateDoc(d.ref, { applied: true, result: 'paid', updatedAt: serverTimestamp() });
      } else if (stripeSession.status === 'expired') {
        // No se pagará: dejar de revisarla
        await updateDoc(d.ref, { applied: true, result: 'expired', updatedAt: serverTimestamp() });
      }
      // status 'open' / payment_status 'unpaid' → se deja para el próximo intento
    }

    return res.status(200).json({ ok: true, checked, applied });
  } catch (error) {
    console.error('Error en reconcile:', error);
    return res.status(500).json({ error: 'Error al reconciliar pagos' });
  }
}
