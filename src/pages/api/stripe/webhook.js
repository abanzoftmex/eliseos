import Stripe from 'stripe';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { createIngresoInScienceChagoDirect } from '../../../../lib/scienceChago';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ Disable Next.js body parsing — Stripe needs the raw body to verify signatures
export const config = {
  api: { bodyParser: false },
};

/**
 * POST /api/stripe/webhook
 *
 * Stripe sends events here. We handle:
 *   - checkout.session.completed  → mark all items in metadata as paid
 *   - payment_intent.succeeded    → backup handler (same logic)
 *   - payment_intent.payment_failed → log, no Firestore update needed
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // ── Read raw body for signature verification ─────────────────────────────
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // Development convenience ONLY: no secret set, parse body directly.
    try {
      event = JSON.parse(rawBody.toString());
    } catch {
      return res.status(400).send('Invalid JSON');
    }
  } else {
    // Production with no STRIPE_WEBHOOK_SECRET → fail closed. Trusting unsigned
    // bodies here would let anyone POST fake "paid" events and mark items paid.
    console.error('STRIPE_WEBHOOK_SECRET is not set in production — refusing to process unsigned webhook.');
    return res.status(500).send('Webhook misconfigured');
  }

  // ── Route events ─────────────────────────────────────────────────────────
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        await markItemsAsPaid(session.metadata, session.id, session.amount_total);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      console.warn('Payment failed for intent:', event.data.object.id);
    }
    // Note: payment_intent.succeeded is intentionally ignored. checkout.session.completed
    // is the primary handler (it carries the itemIds metadata); the success page also
    // calls /api/stripe/verify-session as a redundant fallback.
  } catch (error) {
    console.error('Error processing webhook event:', error);
    // Return 500 so Stripe RETRIES the event with backoff. All Firestore updates are
    // idempotent (guarded by isPaid / pending checks), so a retry will only complete
    // the items that failed and skip the ones already applied. Returning 200 here would
    // mean a transient Firestore failure leaves a paid charge stuck as "pendiente".
    return res.status(500).json({ error: 'Error procesando el evento; Stripe reintentará' });
  }

  return res.status(200).json({ received: true });
}

// ── Mark items paid in Firestore ─────────────────────────────────────────────

async function markItemsAsPaid(metadata, stripeSessionId, amountTotal) {
  if (!metadata?.userId || !metadata?.itemIds) {
    console.warn('Webhook: missing metadata', metadata);
    return;
  }

  const {
    userId,
    userCollection,
    itemIds,
    itemTypes,
    clienteName,
  } = metadata;

  const ids = itemIds.split(',').filter(Boolean);
  const tipos = itemTypes ? itemTypes.split(',').filter(Boolean) : [];

  // Attempt every item; collect failures. We DON'T abort on the first error so the
  // other items still get applied, but we re-throw at the end so the webhook returns
  // 500 and Stripe retries the ones that failed (every write is idempotent).
  const failures = [];

  for (let i = 0; i < ids.length; i++) {
    const itemId = ids[i];
    const tipo = tipos[i] || 'clase';

    try {
      if (tipo === 'clase') {
        await markClaseAsPaid(userCollection, userId, itemId, stripeSessionId);
      } else if (tipo === 'venta_pos') {
        await markCargoAsPaid(userCollection, userId, itemId, stripeSessionId, clienteName);
      } else if (tipo === 'plan') {
        await markPlanAsPaid(userCollection, userId, itemId, stripeSessionId);
      }
    } catch (err) {
      console.error(`Error marking item ${itemId} (${tipo}) as paid:`, err);
      failures.push(`${itemId} (${tipo}): ${err.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Failed to mark ${failures.length} item(s) as paid: ${failures.join('; ')}`);
  }
}

async function markClaseAsPaid(userCollection, userId, assignmentId, stripeSessionId) {
  const ref = doc(db, userCollection, userId, 'clasesAsignadas', assignmentId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().isPaid) return; // idempotent

  const data = snap.data();
  // El precio puede no estar en la asignación; si falta, lo tomamos de la clase.
  let amount = Number(data.precio || data.price || 0);
  if (amount <= 0 && data.idClase) {
    const cDoc = await getDoc(doc(db, 'clases', data.idClase));
    if (cDoc.exists()) amount = Number(cDoc.data().precio || 0);
  }

  await updateDoc(ref, {
    isPaid: true,
    paymentPendingValidation: false,
    totalValidado: amount,
    stripeSessionId,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    abonosReportados: arrayUnion({
      id: stripeSessionId,
      monto: amount,
      estado: 'validado',
      metodo: 'stripe',
      fechaReporte: new Date().toISOString(),
    }),
  });
}

async function markCargoAsPaid(userCollection, userId, cargoId, stripeSessionId, clienteName) {
  const ref = doc(db, userCollection, userId, 'cargos', cargoId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().isPaid) return;

  const data = snap.data();
  const amount = Math.max(0, Number(data.monto || 0) - Number(data.totalValidado || 0));

  await updateDoc(ref, {
    isPaid: true,
    paymentPendingValidation: false,
    estatus: 'pagado',
    totalValidado: Number(data.monto || 0),
    montoPagado: Number(data.monto || 0),
    stripeSessionId,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    abonosReportados: arrayUnion({
      id: stripeSessionId,
      monto: amount,
      estado: 'validado',
      metodo: 'stripe',
      fechaReporte: new Date().toISOString(),
    }),
  });

  // Sync to Science Chago (deferred — payment is now confirmed).
  // Non-fatal: if Science Chago is down we don't want to fail the webhook (which would
  // make Stripe retry forever over an external-accounting outage). The payment is
  // already recorded in Firestore above.
  try {
    await createIngresoInScienceChagoDirect({
      externalId: stripeSessionId,
      clienteId: userId,
      amount: Number(data.monto || 0),
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      concepto: data.descripcion || 'Venta en tienda',
      description: `Pago con tarjeta (Stripe) — ${clienteName || 'Cliente'}`,
    });
  } catch (err) {
    console.warn('Science Chago sync error (cargo):', err.message);
  }
}

async function markPlanAsPaid(userCollection, userId, planId, stripeSessionId) {
  const ref = doc(db, userCollection, userId, 'paquetesAsignados', planId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const total = Number(data.precioFinal || data.precio || 0);
  const alreadyPaid = Number(data.montoPagado || 0);
  const pending = Math.max(0, total - alreadyPaid);
  if (pending <= 0) return; // already fully paid

  await updateDoc(ref, {
    montoPagado: total,
    stripeSessionId,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── Raw body helper ──────────────────────────────────────────────────────────

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
