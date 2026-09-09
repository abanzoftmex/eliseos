import Stripe from 'stripe';
import { doc, getDoc, getDocs, collection, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSessionFromRequest } from '../../../../lib/portalAuth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eliseos.mx';

/**
 * POST /api/stripe/create-checkout-session
 *
 * Body (all pending): { mode: 'all' }
 * Body (specific item): { mode: 'item', itemId, itemType }   itemType: 'clase' | 'venta_pos' | 'plan'
 *
 * Returns: { url } — Stripe Checkout URL for redirect
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Sesión no válida' });
    }

    // Determine user type
    let userType = 'cliente';
    const clienteSnap = await getDoc(doc(db, 'clientes', session.userId));
    let userData = null;
    if (clienteSnap.exists()) {
      userData = clienteSnap.data();
    } else {
      const atletaSnap = await getDoc(doc(db, 'atletas', session.userId));
      if (atletaSnap.exists()) {
        userType = 'atleta';
        userData = atletaSnap.data();
      }
    }
    if (!userData) return res.status(404).json({ error: 'Usuario no encontrado' });

    const userCollection = userType === 'cliente' ? 'clientes' : 'atletas';
    const { mode, itemId, itemType } = req.body;

    // ── Gather line items ────────────────────────────────────────────────────
    const lineItems = [];
    const itemsMeta = []; // [{ id, tipo }] — stored in Stripe metadata for webhook

    if (mode === 'item' && itemId && itemType) {
      // Single item payment
      const item = await getSingleItem(userCollection, session.userId, itemId, itemType);
      if (!item) return res.status(404).json({ error: 'Cargo no encontrado' });
      if (item.amount <= 0) return res.status(400).json({ error: 'El monto de este cargo ya está saldado' });

      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: item.nombre },
          unit_amount: Math.round(item.amount * 100), // cents
        },
        quantity: 1,
      });
      itemsMeta.push({ id: itemId, tipo: itemType });
    } else {
      // All pending items
      const [activitiesSnap, cargosSnap, paquetesSnap] = await Promise.all([
        getDocs(
          query(collection(db, userCollection, session.userId, 'clasesAsignadas'), orderBy('fechaAsignacion', 'desc'))
        ).catch(() => getDocs(collection(db, userCollection, session.userId, 'clasesAsignadas'))),
        getDocs(
          query(collection(db, userCollection, session.userId, 'cargos'), orderBy('createdAt', 'desc'))
        ).catch(() => getDocs(collection(db, userCollection, session.userId, 'cargos'))),
        getDocs(collection(db, userCollection, session.userId, 'paquetesAsignados')),
      ]);

      // Pending class sessions
      for (const d of activitiesSnap.docs) {
        const data = d.data();
        if (data.isPaid || data.paymentPendingValidation) continue;
        let price = Number(data.precio || data.price || 0);
        if (data.idClase) {
          const cDoc = await getDoc(doc(db, 'clases', data.idClase));
          if (cDoc.exists()) price = Number(cDoc.data().precio || price);
        }
        if (price <= 0) continue;
        lineItems.push({
          price_data: {
            currency: 'mxn',
            product_data: { name: data.nombre || 'Sesión / Clase' },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        });
        itemsMeta.push({ id: d.id, tipo: 'clase' });
      }

      // Pending POS charges
      for (const d of cargosSnap.docs) {
        const data = d.data();
        if (data.isPaid || data.paymentPendingValidation || data.estatus === 'cancelado') continue;
        const pending = Math.max(0, Number(data.monto || 0) - Number(data.totalValidado || 0));
        if (pending <= 0) continue;
        lineItems.push({
          price_data: {
            currency: 'mxn',
            product_data: { name: data.descripcion || 'Compra en tienda' },
            unit_amount: Math.round(pending * 100),
          },
          quantity: 1,
        });
        itemsMeta.push({ id: d.id, tipo: 'venta_pos' });
      }

      // Pending plan balances
      for (const d of paquetesSnap.docs) {
        const data = d.data();
        if (data.status !== 'active' && data.status !== 'expired') continue;
        const saldo = Math.max(0, Number(data.precioFinal || data.precio || 0) - Number(data.montoPagado || 0));
        if (saldo <= 0) continue;
        lineItems.push({
          price_data: {
            currency: 'mxn',
            product_data: { name: data.nombre || 'Plan' },
            unit_amount: Math.round(saldo * 100),
          },
          quantity: 1,
        });
        itemsMeta.push({ id: d.id, tipo: 'plan' });
      }
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No hay cargos pendientes por pagar' });
    }

    const total = lineItems.reduce((sum, li) => sum + li.price_data.unit_amount, 0);
    const clienteName = [userData.nombre, userData.apellidoPaterno].filter(Boolean).join(' ') || 'Cliente';

    // Stripe rechaza emails con formato inválido (400 → 500 para el usuario). Si el
    // email del cliente está mal escrito, mejor omitirlo y dejar que Stripe lo pida
    // en el Checkout, en vez de bloquear el pago.
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(userData.email || ''));

    // ── Create Stripe Checkout Session ──────────────────────────────────────
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: emailValido ? userData.email : undefined,
      success_url: `${BASE_URL}/portal/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/portal/estado-de-cuenta`,
      locale: 'es',
      metadata: {
        userId: session.userId,
        userType,
        userCollection,
        itemIds: itemsMeta.map((i) => i.id).join(','),
        itemTypes: itemsMeta.map((i) => i.tipo).join(','),
        clienteName,
      },
      payment_intent_data: {
        metadata: {
          userId: session.userId,
          userType,
          platform: 'science-in-motion-portal',
        },
      },
    });

    // Registrar la sesión para que /api/stripe/reconcile pueda aplicar el pago
    // después aunque el usuario no regrese a la página de éxito (no fatal si falla).
    try {
      await setDoc(doc(db, userCollection, session.userId, 'stripeCheckouts', checkoutSession.id), {
        itemIds: itemsMeta.map((i) => i.id).join(','),
        itemTypes: itemsMeta.map((i) => i.tipo).join(','),
        amountTotal: total,
        applied: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('No se pudo registrar el checkout para reconciliación:', err.message);
    }

    return res.status(200).json({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creando checkout session:', error);
    return res.status(500).json({ error: error.message || 'Error al iniciar el pago' });
  }
}

// ── Helper: fetch a single item's pending amount ─────────────────────────────

async function getSingleItem(userCollection, userId, itemId, itemType) {
  if (itemType === 'clase') {
    const d = await getDoc(doc(db, userCollection, userId, 'clasesAsignadas', itemId));
    if (!d.exists()) return null;
    const data = d.data();
    let price = Number(data.precio || data.price || 0);
    if (data.idClase && !price) {
      const cDoc = await getDoc(doc(db, 'clases', data.idClase));
      if (cDoc.exists()) price = Number(cDoc.data().precio || 0);
    }
    const pending = Math.max(0, price - Number(data.totalValidado || 0));
    return { nombre: data.nombre || 'Sesión / Clase', amount: pending };
  }

  if (itemType === 'venta_pos') {
    const d = await getDoc(doc(db, userCollection, userId, 'cargos', itemId));
    if (!d.exists()) return null;
    const data = d.data();
    const pending = Math.max(0, Number(data.monto || 0) - Number(data.totalValidado || 0));
    return { nombre: data.descripcion || 'Compra en tienda', amount: pending };
  }

  if (itemType === 'plan') {
    const d = await getDoc(doc(db, userCollection, userId, 'paquetesAsignados', itemId));
    if (!d.exists()) return null;
    const data = d.data();
    const saldo = Math.max(0, Number(data.precioFinal || data.precio || 0) - Number(data.montoPagado || 0));
    return { nombre: data.nombre || 'Plan', amount: saldo };
  }

  return null;
}
