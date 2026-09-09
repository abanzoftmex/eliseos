# Stripe — Checklist de Producción (operación SIN webhook)

Cómo verificar que los pagos con Stripe funcionan listos para producción en Science in Motion.
Esta versión documenta la operación **sin webhook** (no tenemos acceso al Dashboard del cliente).

> Herramienta de apoyo: `node scripts/stripe/stripe-check.js <comando>`.

---

## 0. Cómo funciona la confirmación de pago (sin webhook)

El flujo NO depende del webhook de Stripe. Un pago se marca como pagado por **dos vías**:

1. **Página de éxito** — al pagar, Stripe redirige a `/portal/pago-exitoso`, que llama a
   `GET /api/stripe/verify-session`. Esa ruta consulta el pago en Stripe (con la llave
   secreta), marca los cargos como pagados y sincroniza el ingreso a Science Chago.
2. **Reconciliación** — al abrir `/portal/estado-de-cuenta` se llama a
   `POST /api/stripe/reconcile`, que revisa en Stripe las sesiones que el usuario inició
   y aplica las que estén pagadas pero que aún no se marcaron (cubre el caso de que el
   cliente pagara y cerrara la pestaña antes de volver).

Ambas son **idempotentes**. Cuando `create-checkout-session` crea un pago, registra la
sesión en `clientes/{id}/stripeCheckouts/{sessionId}` para que la reconciliación sepa qué revisar.

> Si en el futuro el cliente da acceso al Dashboard, crear un webhook (modo Live →
> `https://DOMINIO/api/stripe/webhook`, eventos `checkout.session.completed` y
> `payment_intent.payment_failed`) y poner su `whsec_` en `STRIPE_WEBHOOK_SECRET`
> agrega una tercera vía servidor-a-servidor, más robusta. El código ya está listo.

---

## 1. Variables en Vercel (Project → Settings → Environment Variables, scope Production)

| Variable | Valor | ¿Obligatoria? |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | **Sí** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (misma cuenta) | Sí |
| `NEXT_PUBLIC_BASE_URL` | dominio real `https://...` (NO localhost) | Sí |
| `NEXT_PUBLIC_SCIENCE_CHAGO_URL` | URL real de Science Chago (NO localhost) | Sí (si quieres el ingreso) |
| `STRIPE_WEBHOOK_SECRET` | — | **No** (no se usa sin webhook) |

Notas de Vercel:
- Las `NEXT_PUBLIC_*` se hornean en el **build** → tras cambiarlas, hay que **Redeploy**.
- Pon las llaves live **solo en scope Production**, no en Preview/Development (evita cobros reales en previews).

---

## 2. Cambios de código (contexto para QA)

- **create-checkout-session**: valida el email antes de mandarlo a Stripe (un email mal
  formado daba 500). Registra la sesión en `stripeCheckouts` para la reconciliación.
- **verify-session**: marca el pago (vía módulo compartido `lib/stripe/applyCheckoutPayment.js`)
  y **sincroniza el ingreso a Science Chago** (antes solo lo hacía el webhook).
- **reconcile** (`/api/stripe/reconcile`): red de seguridad que aplica pagos pendientes;
  la página de estado de cuenta la llama al cargar.
- **webhook**: sigue existiendo y mejorado (firma fail-closed, reintentos), por si algún
  día se habilita; hoy no es necesario.

---

## 3. Pruebas automáticas (modo test, sin cobros reales)

Con `npm run dev` corriendo y llaves de test en `.env`:

```bash
node scripts/stripe/stripe-check.js preflight        # env + llave + cuenta
node scripts/stripe/stripe-check.js checkout --poll  # crea Checkout test, paga con 4242 y confirma
node scripts/stripe/e2e-checkout-test.mjs            # create-checkout-session (401/200, metadata, monto)
node scripts/stripe/e2e-nowebhook-test.mjs           # stripeCheckouts + reconcile + verify-session
node scripts/stripe/stripe-check.js webhook-test     # (opcional) verificación del webhook
node scripts/stripe/e2e-firestore-test.mjs           # (opcional) webhook → Firestore
```
> ✅ Verificados el 2026-06-29 en modo test: todos pasan en verde.

Tarjetas de prueba: éxito `4242 4242 4242 4242`, 3DS `4000 0025 0000 3155`,
rechazada `4000 0000 0000 0002`, fondos insuficientes `4000 0000 0000 9995`.

---

## 4. Matriz de pruebas

### A. create-checkout-session
- [ ] `mode:'all'` con clases / cargos / planes / mezcla; sin pendientes → 400; monto 0 → se omite
- [ ] `mode:'item'` por cada tipo; id inexistente → 404; ya saldado → 400
- [ ] cliente y atleta; sin sesión → 401; monto/centavos/metadata correctos
- [ ] email del cliente inválido → NO rompe (se omite y Stripe lo pide)

### B. Checkout hosted (tarjetas)
- [ ] éxito → redirige a `/portal/pago-exitoso` y marca pagado
- [ ] rechazada / 3DS / fondos insuficientes / cancelar (vuelve a estado de cuenta)

### C. verify-session (página de éxito)
- [ ] pago real → marca pagado + abono + ingreso en Science Chago
- [ ] idempotente (recargar no duplica)
- [ ] sesión de otro usuario → 403; id inválido → 404; sin pagar → isPaid:false

### D. reconcile (al abrir estado de cuenta)
- [ ] aplica un pago que quedó sin marcar (simular: pagar y NO volver a la página de éxito)
- [ ] sesión sin pagar → no marca nada; sesión expirada → deja de revisarla
- [ ] idempotente; sin sesión → 401

### E. Consistencia
- [ ] el estado de cuenta refleja pendiente → pagado, contadores y totales
- [ ] el ingreso aparece en Science Chago (con la URL real configurada)

---

## 5. Go-live y smoke test

1. Poner las 4 variables en Vercel (Production) y **Redeploy**.
2. Confirmar endpoints desplegados:
   `curl -s -o /dev/null -w "%{http_code}\n" https://DOMINIO/api/stripe/create-checkout-session` → 405.
3. **Compra real de monto bajo** desde el portal con una tarjeta real:
   - paga → debe llegar a `/portal/pago-exitoso` con éxito,
   - el cargo queda **pagado** en el estado de cuenta,
   - el cobro aparece en el panel de Stripe del cliente,
   - el ingreso aparece en Science Chago.
4. (Opcional, prueba de reconciliación) repetir pero cerrar la pestaña tras pagar; al
   reabrir el estado de cuenta el cargo debe marcarse igual.

---

## 6. Limitaciones conocidas (sin webhook)

- Si el cliente paga y **nunca** reabre el portal ni llega a la página de éxito, el cargo no
  se marca hasta que vuelva (la reconciliación corre al abrir el estado de cuenta). Con webhook
  esto sería instantáneo y servidor-a-servidor.
- Reglas de Firestore: las rutas escriben con el SDK cliente sin auth (igual que el flujo de
  pago manual existente). Verificado que las reglas lo permiten.
