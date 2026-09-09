/**
 * Prueba E2E del flujo SIN webhook (modo TEST).
 *
 * Valida la integración de las rutas que reemplazan al webhook:
 *  - create-checkout-session registra la sesión en stripeCheckouts (applied:false)
 *  - /api/stripe/reconcile lee esos registros, consulta Stripe y aplica los pagados
 *    (con una sesión sin pagar debe dejarla intacta: checked≥1, applied:0)
 *  - /api/stripe/verify-session responde bien (sin pagar → isPaid:false; id malo → 404)
 *
 * No completa un pago real (eso requiere la tarjeta en el navegador), pero confirma
 * que toda la cañería nueva funciona y no rompe nada.
 *
 *   npm run dev   # en otra terminal
 *   node scripts/stripe/e2e-nowebhook-test.mjs
 */
import 'dotenv/config';
import { randomBytes, createHash } from 'node:crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
const USER = 'zzz_stripe_e2e_nowebhook';
const CARGO_ID = `e2e_cargo_${Date.now()}`;
const MONTO = 175;
let sessionRef = null;
let checkoutId = null;
let exitCode = 0;
const check = (label, pass) => { console.log(`${pass ? G : R} ${label}`); if (!pass) exitCode = 1; };

async function main() {
  try {
    console.log(`${I} Sembrando cliente + cargo (venta_pos) + sesión de portal...`);
    await setDoc(doc(db, 'clientes', USER), { nombre: 'E2E', apellidoPaterno: 'NoWebhook', email: 'e2e-nw@test.com', _stripeTest: true });
    await setDoc(doc(db, 'clientes', USER, 'cargos', CARGO_ID), {
      descripcion: 'Cargo E2E sin webhook', monto: MONTO, isPaid: false, paymentPendingValidation: false,
      totalValidado: 0, estatus: 'pendiente', createdAt: new Date(), _stripeTest: true,
    });
    const token = randomBytes(32).toString('hex');
    sessionRef = doc(collection(db, 'portalUserSessions'));
    await setDoc(sessionRef, {
      userId: USER, tokenHash: createHash('sha256').update(token).digest('hex'), active: true,
      expiresAt: new Date(Date.now() + 864e5), createdAt: new Date(), lastSeenAt: new Date(),
    });
    const cookie = `portal-user-session=${token}`;

    // 1) create-checkout-session → 200 + registra stripeCheckouts
    const rCk = await fetch(`${BASE_URL}/api/stripe/create-checkout-session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mode: 'item', itemId: CARGO_ID, itemType: 'venta_pos' }),
    });
    const jCk = await rCk.json().catch(() => ({}));
    check(`create-checkout-session → HTTP ${rCk.status} (200)`, rCk.status === 200);
    checkoutId = jCk.sessionId;

    if (checkoutId) {
      await new Promise((r) => setTimeout(r, 800));
      const ckDoc = await getDoc(doc(db, 'clientes', USER, 'stripeCheckouts', checkoutId));
      check('Registró stripeCheckouts/{sessionId}', ckDoc.exists());
      check('stripeCheckouts.applied === false', ckDoc.data()?.applied === false);
      check('stripeCheckouts.itemTypes === venta_pos', ckDoc.data()?.itemTypes === 'venta_pos');
    }

    // 2) reconcile (sesión SIN pagar) → 200, checked≥1, applied:0, cargo sigue pendiente
    const rRec = await fetch(`${BASE_URL}/api/stripe/reconcile`, { method: 'POST', headers: { Cookie: cookie } });
    const jRec = await rRec.json().catch(() => ({}));
    check(`reconcile → HTTP ${rRec.status} (200)`, rRec.status === 200);
    check(`reconcile revisó la sesión (checked≥1): ${jRec.checked}`, (jRec.checked || 0) >= 1);
    check(`reconcile NO aplicó nada (sin pagar, applied:0): ${jRec.applied}`, (jRec.applied || 0) === 0);
    const cargoAfter = await getDoc(doc(db, 'clientes', USER, 'cargos', CARGO_ID));
    check('El cargo sigue sin pagar (no se marcó por error)', cargoAfter.data()?.isPaid !== true);

    // 3) reconcile sin sesión → 401
    const r401 = await fetch(`${BASE_URL}/api/stripe/reconcile`, { method: 'POST' });
    check(`reconcile sin sesión → HTTP ${r401.status} (401)`, r401.status === 401);

    // 4) verify-session con la sesión sin pagar → 200 + isPaid:false
    if (checkoutId) {
      const rVer = await fetch(`${BASE_URL}/api/stripe/verify-session?session_id=${checkoutId}`, { headers: { Cookie: cookie } });
      const jVer = await rVer.json().catch(() => ({}));
      check(`verify-session (sin pagar) → HTTP ${rVer.status} (200) isPaid=${jVer.isPaid}`, rVer.status === 200 && jVer.isPaid === false);
    }

    // 5) verify-session con id inexistente → 404
    const r404 = await fetch(`${BASE_URL}/api/stripe/verify-session?session_id=cs_test_inexistente_000`, { headers: { Cookie: cookie } });
    check(`verify-session (id malo) → HTTP ${r404.status} (404)`, r404.status === 404);
  } catch (err) {
    console.log(`${R} Error: ${err.message}`);
    exitCode = 1;
  } finally {
    try {
      await deleteDoc(doc(db, 'clientes', USER, 'cargos', CARGO_ID));
      if (checkoutId) await deleteDoc(doc(db, 'clientes', USER, 'stripeCheckouts', checkoutId));
      await deleteDoc(doc(db, 'clientes', USER));
      if (sessionRef) await deleteDoc(sessionRef);
      console.log(`${I} Limpieza: docs de prueba eliminados.`);
    } catch (e) { console.log(`${R} No se pudo limpiar: ${e.message}`); }
  }
  console.log(exitCode === 0 ? `\n${G} Flujo SIN webhook OK: create-checkout registra, reconcile revisa, verify-session responde bien.` : `\n${R} Hubo fallos (ver arriba).`);
  process.exit(exitCode);
}
main();
