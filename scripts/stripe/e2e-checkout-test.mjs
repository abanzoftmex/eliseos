/**
 * Prueba E2E del endpoint de entrada: POST /api/stripe/create-checkout-session
 * (lo que dispara el usuario al dar "Pagar" en el estado de cuenta).
 *
 * Siembra un cliente con una clase pendiente, crea una sesión de portal válida,
 * llama al endpoint con esa cookie, y verifica que la Checkout Session de Stripe
 * se arme con el monto, moneda y metadata correctos. Limpia todo al final.
 *
 *   npm run dev   # en otra terminal
 *   node scripts/stripe/e2e-checkout-test.mjs
 */
import 'dotenv/config';
import { randomBytes, createHash } from 'node:crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import Stripe from 'stripe';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const G = '\x1b[32m✔\x1b[0m', R = '\x1b[31m✘\x1b[0m', I = '\x1b[36mℹ\x1b[0m';
const USER = 'zzz_stripe_e2e_checkout';
const CLASE_ID = `e2e_clase_${Date.now()}`;
const PRECIO = 250;
const PortalSession = collection(db, 'portalUserSessions');
let sessionRef = null;

async function main() {
  let exitCode = 0;
  try {
    console.log(`${I} Sembrando cliente + clase pendiente y sesión de portal...`);
    await setDoc(doc(db, 'clientes', USER), { nombre: 'E2E', apellidoPaterno: 'Checkout', email: 'e2e-checkout@test.com', _stripeTest: true });
    await setDoc(doc(db, 'clientes', USER, 'clasesAsignadas', CLASE_ID), {
      nombre: 'Clase E2E checkout', precio: PRECIO, isPaid: false, paymentPendingValidation: false, totalValidado: 0,
      fechaAsignacion: new Date(), _stripeTest: true,
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    sessionRef = doc(PortalSession);
    await setDoc(sessionRef, {
      userId: USER, tokenHash, active: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(), lastSeenAt: new Date(),
    });
    const cookie = `portal-user-session=${token}`;
    console.log(`${G} Sesión de portal creada para ${USER}`);

    // 1) Sin cookie → 401
    const r401 = await fetch(`${BASE_URL}/api/stripe/create-checkout-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'all' }),
    });
    console.log(`${r401.status === 401 ? G : R} Sin sesión → HTTP ${r401.status} (esperado 401)`);
    if (r401.status !== 401) exitCode = 1;

    // 2) mode:'all' con cookie → 200 + url + sessionId
    const rAll = await fetch(`${BASE_URL}/api/stripe/create-checkout-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ mode: 'all' }),
    });
    const jAll = await rAll.json().catch(() => ({}));
    console.log(`${rAll.status === 200 ? G : R} mode:'all' → HTTP ${rAll.status} (esperado 200)`);
    if (rAll.status !== 200) { console.log(`   respuesta: ${JSON.stringify(jAll)}`); exitCode = 1; }
    else {
      console.log(`${jAll.url?.startsWith('https://checkout.stripe.com') ? G : R} Devuelve URL de Stripe Checkout`);
      const s = await stripe.checkout.sessions.retrieve(jAll.sessionId);
      const checks = [
        [`amount_total === ${PRECIO * 100}`, s.amount_total === PRECIO * 100],
        ['currency === mxn', s.currency === 'mxn'],
        ['metadata.userId correcto', s.metadata?.userId === USER],
        ['metadata.itemIds === claseId', s.metadata?.itemIds === CLASE_ID],
        ['metadata.itemTypes === clase', s.metadata?.itemTypes === 'clase'],
        ['success_url al portal', String(s.success_url).includes('/portal/pago-exitoso')],
      ];
      for (const [label, pass] of checks) { console.log(`${pass ? G : R} ${label}`); if (!pass) exitCode = 1; }
    }

    // 3) mode:'item' del mismo cargo → 200
    const rItem = await fetch(`${BASE_URL}/api/stripe/create-checkout-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mode: 'item', itemId: CLASE_ID, itemType: 'clase' }),
    });
    const jItem = await rItem.json().catch(() => ({}));
    console.log(`${rItem.status === 200 ? G : R} mode:'item' → HTTP ${rItem.status} (esperado 200)`);
    if (rItem.status !== 200) { console.log(`   respuesta: ${JSON.stringify(jItem)}`); exitCode = 1; }
  } catch (err) {
    console.log(`${R} Error: ${err.message}`);
    exitCode = 1;
  } finally {
    try {
      await deleteDoc(doc(db, 'clientes', USER, 'clasesAsignadas', CLASE_ID));
      await deleteDoc(doc(db, 'clientes', USER));
      if (sessionRef) await deleteDoc(sessionRef);
      console.log(`${I} Limpieza: docs de prueba eliminados.`);
    } catch (e) { console.log(`${R} No se pudo limpiar: ${e.message}`); }
  }
  console.log(exitCode === 0 ? `\n${G} E2E OK: create-checkout-session arma la sesión de Stripe correctamente.` : `\n${R} E2E con fallos (ver arriba).`);
  process.exit(exitCode);
}
main();
