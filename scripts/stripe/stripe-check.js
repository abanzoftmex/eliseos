#!/usr/bin/env node

/**
 * Harness de pruebas de la conexión con Stripe — Science in Motion
 * ================================================================
 *
 * Carga `.env` por defecto (llaves de TEST → no cobra dinero real).
 * Para validar la config de PRODUCCIÓN, córrelo en el servidor con las llaves live:
 *     DOTENV_CONFIG_PATH=.env.production node scripts/stripe/stripe-check.js preflight
 *
 * Subcomandos:
 *   preflight                 Valida env + llave de Stripe + endpoints de webhook (solo lectura, no cobra).
 *   checkout [--poll]         Crea una Checkout Session de prueba y te da la URL para pagar con tarjeta test.
 *                             Se NIEGA a correr con llaves live (evita cobros reales).
 *   checkout --cookie <ck>    Igual, pero pega contra NUESTRO endpoint /api/stripe/create-checkout-session
 *                             usando la cookie de sesión del portal (prueba el flujo real de la app).
 *   verify <cs_id>            Recupera una Checkout Session y muestra su estado/metadata.
 *   cli-hint                  Imprime los comandos de Stripe CLI para escuchar/reenviar webhooks.
 *
 * Ejemplos:
 *   node scripts/stripe/stripe-check.js preflight
 *   node scripts/stripe/stripe-check.js checkout --poll
 *   node scripts/stripe/stripe-check.js verify cs_test_a1b2c3
 */

require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || '.env',
});

const Stripe = require('stripe');

// ── Colores mínimos para la consola ──────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const ok = (m) => console.log(`${c.green}✔${c.reset} ${m}`);
const fail = (m) => console.log(`${c.red}✘${c.reset} ${m}`);
const warn = (m) => console.log(`${c.yellow}▲${c.reset} ${m}`);
const info = (m) => console.log(`${c.cyan}ℹ${c.reset} ${m}`);
const head = (m) => console.log(`\n${c.bold}${m}${c.reset}`);

const SECRET = process.env.STRIPE_SECRET_KEY || '';
const PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

function keyMode(key) {
  if (/^sk_live_|^pk_live_/.test(key)) return 'live';
  if (/^sk_test_|^pk_test_/.test(key)) return 'test';
  return 'desconocido';
}

function requireSecret() {
  if (!SECRET) {
    fail('STRIPE_SECRET_KEY no está definida en el entorno cargado.');
    process.exit(1);
  }
  return Stripe(SECRET);
}

// ── preflight ────────────────────────────────────────────────────────────────
async function preflight() {
  head('1) Variables de entorno');
  let hardFail = false;

  if (SECRET) ok(`STRIPE_SECRET_KEY presente (modo: ${keyMode(SECRET)})`);
  else { fail('STRIPE_SECRET_KEY ausente'); hardFail = true; }

  if (PUBLISHABLE) ok(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY presente (modo: ${keyMode(PUBLISHABLE)})`);
  else warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ausente (el flujo actual redirige a Checkout, quizá no la use, pero conviene tenerla)');

  if (SECRET && PUBLISHABLE && keyMode(SECRET) !== keyMode(PUBLISHABLE)) {
    fail(`La llave secreta (${keyMode(SECRET)}) y la publicable (${keyMode(PUBLISHABLE)}) son de modos distintos — deben coincidir.`);
    hardFail = true;
  }

  const mode = keyMode(SECRET);
  if (WEBHOOK_SECRET && WEBHOOK_SECRET.startsWith('whsec_')) {
    ok('STRIPE_WEBHOOK_SECRET presente');
  } else {
    (mode === 'live' ? fail : warn)('STRIPE_WEBHOOK_SECRET ausente o con formato inválido (debe empezar con whsec_). En producción es OBLIGATORIO.');
    if (mode === 'live') hardFail = true;
  }

  if (!BASE_URL) {
    fail('NEXT_PUBLIC_BASE_URL ausente (se usa para success_url/cancel_url).');
    hardFail = true;
  } else if (mode === 'live' && !BASE_URL.startsWith('https://')) {
    fail(`NEXT_PUBLIC_BASE_URL="${BASE_URL}" — en producción debe ser https con el dominio real, no localhost.`);
    hardFail = true;
  } else if (mode === 'live' && /localhost|127\.0\.0\.1/.test(BASE_URL)) {
    fail(`NEXT_PUBLIC_BASE_URL apunta a localhost en modo live: "${BASE_URL}".`);
    hardFail = true;
  } else {
    ok(`NEXT_PUBLIC_BASE_URL = ${BASE_URL}`);
  }

  if (!SECRET) { process.exitCode = 1; return; }

  head('2) Conexión con la API de Stripe (solo lectura)');
  const stripe = Stripe(SECRET);
  try {
    const acct = await stripe.accounts.retrieve();
    ok(`Llave válida. Cuenta: ${acct.id}${acct.settings?.dashboard?.display_name ? ` (${acct.settings.dashboard.display_name})` : ''}`);
    if (acct.charges_enabled) ok('charges_enabled = true (la cuenta puede cobrar)');
    else warn('charges_enabled = false — la cuenta de Stripe aún no puede recibir pagos reales (revisa onboarding).');
    if (mode === 'live' && acct.charges_enabled === false) hardFail = true;
  } catch (err) {
    fail(`No se pudo autenticar con Stripe: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  head('3) Endpoints de webhook registrados en el Dashboard');
  const expectedPath = '/api/stripe/webhook';
  try {
    const eps = await stripe.webhookEndpoints.list({ limit: 100 });
    if (!eps.data.length) {
      warn('No hay webhook endpoints registrados en el Dashboard de este modo.');
      info(`Para producción: crea uno apuntando a ${BASE_URL || 'https://TU-DOMINIO'}${expectedPath}`);
      info('Para pruebas locales puedes usar `stripe listen` (ver: cli-hint).');
      if (mode === 'live') hardFail = true;
    } else {
      let matched = false;
      for (const ep of eps.data) {
        const isMatch = ep.url.endsWith(expectedPath);
        const enabled = ep.status === 'enabled';
        const hasCheckout = ep.enabled_events.includes('checkout.session.completed') || ep.enabled_events.includes('*');
        const tag = isMatch ? (enabled && hasCheckout ? `${c.green}OK${c.reset}` : `${c.yellow}revisar${c.reset}`) : c.dim + 'otro' + c.reset;
        console.log(`   [${tag}] ${ep.url}  (status: ${ep.status}; eventos: ${ep.enabled_events.includes('*') ? '*' : ep.enabled_events.length})`);
        if (isMatch) {
          matched = true;
          if (!enabled) warn(`El endpoint ${ep.url} no está "enabled".`);
          if (!hasCheckout) warn(`El endpoint ${ep.url} NO escucha checkout.session.completed (es el evento principal).`);
        }
      }
      if (matched) ok(`Hay un endpoint que apunta a ${expectedPath}`);
      else {
        (mode === 'live' ? fail : warn)(`Ningún endpoint del Dashboard termina en ${expectedPath}.`);
        if (mode === 'live') hardFail = true;
      }
    }
  } catch (err) {
    warn(`No se pudieron listar los webhook endpoints: ${err.message}`);
  }

  head('Resultado');
  if (hardFail) {
    fail('Hay problemas BLOQUEANTES para producción. Revisa los ✘ de arriba.');
    process.exitCode = 1;
  } else if (mode === 'test') {
    ok('Config de TEST correcta. Para go-live, vuelve a correr este preflight en el servidor con .env.production.');
  } else {
    ok('Config de PRODUCCIÓN (live) lista según los checks automáticos. Completa el checklist manual de Checkout.');
  }
}

// ── checkout ──────────────────────────────────────────────────────────────────
async function checkout(args) {
  const poll = args.includes('--poll');
  const cookieIdx = args.indexOf('--cookie');
  const cookie = cookieIdx >= 0 ? args[cookieIdx + 1] : null;

  if (cookie) {
    // Pega contra NUESTRO endpoint (prueba el flujo real con auth de portal)
    const target = `${BASE_URL || 'http://localhost:3000'}/api/stripe/create-checkout-session`;
    info(`POST ${target} (mode: 'all') con cookie de sesión del portal…`);
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mode: 'all' }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { fail(`HTTP ${res.status}: ${json.error || 'sin detalle'}`); process.exitCode = 1; return; }
    ok('Checkout Session creada por nuestra app:');
    console.log(`   URL:        ${json.url}`);
    console.log(`   sessionId:  ${json.sessionId}`);
    printTestCards();
    if (poll && json.sessionId) await pollSession(Stripe(SECRET), json.sessionId);
    return;
  }

  // Modo directo con el SDK de Stripe (valida conectividad de Checkout)
  if (keyMode(SECRET) === 'live') {
    fail('Estás usando llaves LIVE. Este comando crearía un Checkout REAL — abortado por seguridad.');
    info('Prueba con llaves de test (.env), o usa --cookie contra un entorno de pruebas.');
    process.exit(1);
  }
  const stripe = requireSecret();
  info('Creando Checkout Session de prueba (espejo de los parámetros de la app)…');
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: { name: 'PRUEBA — Cargo de verificación Stripe' },
        unit_amount: 12300, // $123.00 MXN
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${BASE_URL || 'http://localhost:3000'}/portal/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL || 'http://localhost:3000'}/portal/estado-de-cuenta`,
    locale: 'es',
    metadata: { test: 'stripe-check.js', mode: 'all', itemIds: '', itemTypes: '' },
  });
  ok('Checkout Session de prueba creada:');
  console.log(`   URL:       ${c.bold}${session.url}${c.reset}`);
  console.log(`   sessionId: ${session.id}`);
  printTestCards();
  if (poll) await pollSession(stripe, session.id);
  else info('Tip: vuelve a correr con `--poll` para esperar y confirmar el pago automáticamente.');
}

function printTestCards() {
  head('Tarjetas de prueba (solo en modo test)');
  console.log(`   ${c.green}Éxito:${c.reset}              4242 4242 4242 4242   (cualquier fecha futura / CVC / CP)`);
  console.log(`   ${c.yellow}Requiere 3D Secure:${c.reset} 4000 0025 0000 3155`);
  console.log(`   ${c.red}Rechazada:${c.reset}          4000 0000 0000 0002`);
  console.log(`   ${c.red}Fondos insuf.:${c.reset}      4000 0000 0000 9995`);
}

async function pollSession(stripe, sessionId, maxTries = 40) {
  head('Esperando confirmación de pago (Ctrl+C para salir)…');
  for (let i = 0; i < maxTries; i++) {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    process.stdout.write(`\r   intento ${i + 1}/${maxTries} — payment_status: ${s.payment_status}      `);
    if (s.payment_status === 'paid') {
      console.log('');
      ok(`Pago confirmado. amount_total: ${(s.amount_total / 100).toFixed(2)} ${String(s.currency).toUpperCase()}`);
      return;
    }
    if (s.status === 'expired') { console.log(''); warn('La sesión expiró sin pago.'); return; }
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log('');
  warn('Se agotó el tiempo de espera. Verifica manualmente con: verify ' + sessionId);
}

// ── verify ────────────────────────────────────────────────────────────────────
async function verify(args) {
  const id = args.find((a) => a.startsWith('cs_'));
  if (!id) { fail('Pasa un session_id (cs_...). Ej: verify cs_test_abc'); process.exit(1); }
  const stripe = requireSecret();
  const s = await stripe.checkout.sessions.retrieve(id);
  head(`Checkout Session ${id}`);
  console.log(`   payment_status: ${s.payment_status}`);
  console.log(`   status:         ${s.status}`);
  console.log(`   amount_total:   ${s.amount_total != null ? (s.amount_total / 100).toFixed(2) : '—'} ${String(s.currency || '').toUpperCase()}`);
  console.log(`   customer_email: ${s.customer_email || '—'}`);
  console.log(`   metadata:       ${JSON.stringify(s.metadata)}`);
}

// ── webhook-test ──────────────────────────────────────────────────────────────
// Firma un evento de webhook con el SDK (NO requiere Stripe CLI) y lo envía al
// endpoint local. Permite verificar firma válida, firma inválida e idempotencia
// sin necesidad de completar un pago en el navegador.
async function webhookTest(args) {
  if (!WEBHOOK_SECRET || !WEBHOOK_SECRET.startsWith('whsec_')) {
    fail('Necesitas STRIPE_WEBHOOK_SECRET (whsec_...) en el entorno para firmar el evento.');
    process.exit(1);
  }
  const stripe = requireSecret();
  const url = `${BASE_URL || 'http://localhost:3000'}/api/stripe/webhook`;

  // Permite inyectar itemIds/userId reales para una prueba E2E contra Firestore.
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
  const userId = get('--user') || 'sim_test_user';
  const itemIds = get('--items') || 'sim_test_item';
  const itemTypes = get('--types') || 'clase';
  const sessionId = `cs_test_sim_${Date.now()}`;

  const event = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        amount_total: 12300,
        currency: 'mxn',
        customer_email: 'sim@scienceinmotion.test',
        metadata: {
          userId,
          userType: 'cliente',
          userCollection: 'clientes',
          itemIds,
          itemTypes,
          clienteName: 'Prueba Stripe',
        },
      },
    },
  };
  const payload = JSON.stringify(event);

  async function send(label, body, header, expected) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
      body,
    });
    const text = await res.text().catch(() => '');
    const pass = res.status === expected;
    (pass ? ok : fail)(`${label}: HTTP ${res.status} (esperado ${expected})${text ? ` — ${text.slice(0, 120)}` : ''}`);
    return pass;
  }

  head(`Enviando eventos firmados a ${url}`);
  info(`session_id de prueba: ${sessionId} | itemIds: ${itemIds} | tipos: ${itemTypes}`);

  const validHeader = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

  let allPass = true;
  // 1) Firma válida → 200 (procesa; si los itemIds no existen en Firestore, es no-op idempotente)
  allPass = (await send('Firma válida', payload, validHeader, 200)) && allPass;
  // 2) Reenvío idéntico → 200 (idempotente, no debe romper)
  allPass = (await send('Reenvío (idempotencia)', payload, validHeader, 200)) && allPass;
  // 3) Firma inválida → 400 (debe rechazar)
  allPass = (await send('Firma inválida', payload, 't=1,v1=deadbeef', 400)) && allPass;
  // 4) Cuerpo manipulado con firma vieja → 400
  allPass = (await send('Cuerpo manipulado', payload.replace('12300', '1'), validHeader, 400)) && allPass;

  head('Resultado webhook-test');
  if (allPass) ok('El webhook verifica firmas y responde correctamente en todos los casos.');
  else { fail('Algún caso no respondió como se esperaba. Revisa arriba y el log del server.'); process.exitCode = 1; }
  info('Para una prueba E2E real contra Firestore, siembra un doc y pasa --user <id> --items <docId> --types clase|venta_pos|plan');
}

// ── cli-hint ────────────────────────────────────────────────────────────────--
function cliHint() {
  head('Stripe CLI — escuchar y reenviar webhooks a tu app local');
  console.log(`
  1) Instala y autentica (una vez):
       brew install stripe/stripe-cli/stripe   # o https://stripe.com/docs/stripe-cli
       stripe login

  2) Reenvía los eventos a tu webhook local (deja esta terminal abierta):
       stripe listen --forward-to localhost:3000/api/stripe/webhook
     → te imprime un "webhook signing secret" (whsec_...). Pégalo en .env como
       STRIPE_WEBHOOK_SECRET y reinicia 'npm run dev'.

  3) En otra terminal, dispara eventos de prueba:
       stripe trigger checkout.session.completed
       stripe trigger payment_intent.payment_failed
     (Nota: los eventos de 'trigger' no llevan tu metadata real de itemIds; para
      probar la actualización en Firestore, haz un Checkout real de test con la
      tarjeta 4242 usando 'checkout' y deja 'stripe listen' corriendo.)
`);
}

// ── main ───────────────────────────────────────────────────────────────────--
(async () => {
  const [, , cmd, ...args] = process.argv;
  try {
    switch (cmd) {
      case 'preflight': await preflight(); break;
      case 'checkout': await checkout(args); break;
      case 'verify': await verify(args); break;
      case 'webhook-test': await webhookTest(args); break;
      case 'cli-hint': cliHint(); break;
      default:
        console.log('Uso: node scripts/stripe/stripe-check.js <preflight|checkout|verify|webhook-test|cli-hint> [opciones]');
        console.log('Corre `preflight` primero. Ver comentarios al inicio del archivo para detalles.');
        process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    fail(err.message);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
})();
