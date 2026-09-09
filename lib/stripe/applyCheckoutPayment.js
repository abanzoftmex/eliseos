import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import { createIngresoInScienceChagoDirect } from '../scienceChago';

/**
 * Aplica (idempotentemente) los marcados de pago de una Checkout Session de Stripe
 * que ya está pagada. Lo usan tanto /api/stripe/verify-session (página de éxito)
 * como /api/stripe/reconcile (reconciliación al abrir el estado de cuenta).
 *
 * Es la fuente única de verdad para marcar pagos SIN depender del webhook.
 * Cada item se salta si ya está pagado (isPaid / saldo 0), por lo que correr esto
 * varias veces sobre la misma sesión es seguro.
 *
 * @param {object} stripeSession - objeto Checkout Session recuperado de Stripe
 * @returns {Promise<{applied:number}>} cuántos items se marcaron en esta corrida
 */
export async function applyPaidCheckoutSession(stripeSession) {
  const { userId, userCollection, itemIds, itemTypes, clienteName } = stripeSession.metadata || {};
  if (!userId || !userCollection || !itemIds) return { applied: 0 };

  const ids = itemIds.split(',').filter(Boolean);
  const tipos = itemTypes ? itemTypes.split(',').filter(Boolean) : [];
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let applied = 0;

  for (let i = 0; i < ids.length; i++) {
    const itemId = ids[i];
    const tipo = tipos[i] || 'clase';

    try {
      if (tipo === 'clase') {
        const ref = doc(db, userCollection, userId, 'clasesAsignadas', itemId);
        const snap = await getDoc(ref);
        if (!snap.exists() || snap.data().isPaid) continue;
        const data = snap.data();
        // El precio no siempre se guarda en la asignación; si falta, lo tomamos del
        // documento de la clase (igual que create-checkout-session) para no marcar $0.
        let amount = Number(data.precio || data.price || 0);
        if (amount <= 0 && data.idClase) {
          const cDoc = await getDoc(doc(db, 'clases', data.idClase));
          if (cDoc.exists()) amount = Number(cDoc.data().precio || 0);
        }
        await updateDoc(ref, {
          isPaid: true,
          paymentPendingValidation: false,
          totalValidado: amount,
          stripeSessionId: stripeSession.id,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          abonosReportados: arrayUnion({
            id: stripeSession.id,
            monto: amount,
            estado: 'validado',
            metodo: 'stripe',
            fechaReporte: new Date().toISOString(),
          }),
        });
        applied++;
      } else if (tipo === 'venta_pos') {
        const ref = doc(db, userCollection, userId, 'cargos', itemId);
        const snap = await getDoc(ref);
        if (!snap.exists() || snap.data().isPaid) continue;
        const data = snap.data();
        const amount = Math.max(0, Number(data.monto || 0) - Number(data.totalValidado || 0));
        await updateDoc(ref, {
          isPaid: true,
          paymentPendingValidation: false,
          estatus: 'pagado',
          totalValidado: Number(data.monto || 0),
          montoPagado: Number(data.monto || 0),
          stripeSessionId: stripeSession.id,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          abonosReportados: arrayUnion({
            id: stripeSession.id,
            monto: amount,
            estado: 'validado',
            metodo: 'stripe',
            fechaReporte: new Date().toISOString(),
          }),
        });
        // Sync de ingreso a Science Chago (no fatal: si está caído, no rompemos el pago)
        try {
          await createIngresoInScienceChagoDirect({
            externalId: stripeSession.id,
            clienteId: userId,
            amount: Number(data.monto || 0),
            date: today,
            concepto: data.descripcion || 'Venta en tienda',
            description: `Pago con tarjeta (Stripe) — ${clienteName || 'Cliente'}`,
          });
        } catch (err) {
          console.warn('Science Chago sync error (verify/reconcile):', err.message);
        }
        applied++;
      } else if (tipo === 'plan') {
        const ref = doc(db, userCollection, userId, 'paquetesAsignados', itemId);
        const snap = await getDoc(ref);
        if (!snap.exists()) continue;
        const data = snap.data();
        const total = Number(data.precioFinal || data.precio || 0);
        const already = Number(data.montoPagado || 0);
        if (total - already <= 0) continue;
        await updateDoc(ref, {
          montoPagado: total,
          stripeSessionId: stripeSession.id,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        applied++;
      }
    } catch (err) {
      console.error(`Error aplicando pago del item ${itemId} (${tipo}):`, err);
    }
  }

  return { applied };
}
