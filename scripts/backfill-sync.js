/**
 * Backfill: reenvía a Chago Science Motion los paquetes/ventas de un rango de
 * fechas que se detectaron como no sincronizados (ver scripts/check-sync-status.js).
 *
 * Por defecto corre en modo DRY RUN (solo muestra qué haría, no escribe nada).
 * Para ejecutarlo de verdad hay que pasar --live explícitamente.
 *
 * Requiere lo mismo que check-sync-status.js:
 *   - science-in-motion/.env.local: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
 *     FIREBASE_PRIVATE_KEY
 *   - El .env.local de chago-science-motion accesible en CHAGO_REPO_PATH
 *
 * Este script llama directamente al endpoint de producción de Chago
 * (POST /api/integration/sync/transacciones/ingreso), el mismo que usa la app en
 * caliente, para que quede exactamente igual que un registro sincronizado en su
 * momento (misma categorización, mismo endpoint, mismo chequeo de duplicados).
 *
 * Uso:
 *   node scripts/backfill-sync.js                          # dry run, jun-jul del año actual
 *   node scripts/backfill-sync.js --desde=2026-06-01 --hasta=2026-07-31
 *   node scripts/backfill-sync.js --live                    # ejecuta de verdad
 */

require('dotenv').config({ path: '.env.local' });
const { getSyncStatus, fmtDate } = require('./lib/syncAudit');

const CHAGO_REPO_PATH =
  process.env.CHAGO_REPO_PATH || '/Volumes/Proyectos/trabajo/valquirico/chago-science-motion';

const CHAGO_BASE_URL = process.env.CHAGO_BASE_URL || 'https://admin.scienceinmotion.com.mx';
const CHAGO_API_KEY =
  process.env.CHAGO_API_KEY ||
  process.env.NEXT_PUBLIC_SCIENCE_CHAGO_API_KEY ||
  'science-chago-api-integration-key-2026';

const LIVE = process.argv.includes('--live');

function parseArgDate(flag) {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return null;
  const [y, m, d] = arg.split('=')[1].split('-').map(Number);
  return { y, m, d };
}

const now = new Date();
const desdeArg = parseArgDate('desde');
const hastaArg = parseArgDate('hasta');

const desde = desdeArg
  ? new Date(desdeArg.y, desdeArg.m - 1, desdeArg.d, 0, 0, 0)
  : new Date(now.getFullYear(), 5, 1, 0, 0, 0); // 1 de junio

const hasta = hastaArg
  ? new Date(hastaArg.y, hastaArg.m - 1, hastaArg.d, 23, 59, 59, 999)
  : new Date(now.getFullYear(), 6, 31, 23, 59, 59, 999); // 31 de julio

function generateTransactionExternalId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `sim-${timestamp}-${random}`;
}

async function getVentasGeneralId() {
  try {
    const res = await fetch(`${CHAGO_BASE_URL}/api/generales?type=entrada`, {
      headers: { 'x-api-key': CHAGO_API_KEY },
    });
    const data = await res.json();
    const ventas = data.data?.find((g) => g.name === 'Ventas');
    return ventas?.id || null;
  } catch (error) {
    console.warn(`⚠️ No se pudo consultar la categoría "Ventas": ${error.message}`);
    return null;
  }
}

async function crearIngreso(record, generalId) {
  const payload = {
    externalId: record.externalId,
    sucursalId: record.sucursalId,
    clienteId: record.clienteId,
    amount: record.monto,
    date: fmtDate(record.fecha),
    concepto: record.nombre,
    description: record.descripcion,
    generalId,
  };

  const res = await fetch(`${CHAGO_BASE_URL}/api/integration/sync/transacciones/ingreso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CHAGO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log(`Modo: ${LIVE ? 'LIVE (se van a crear transacciones reales)' : 'DRY RUN (solo simulación, no escribe nada)'}`);
  console.log(`Destino: ${CHAGO_BASE_URL}`);
  console.log(`Rango: ${fmtDate(desde)} a ${fmtDate(hasta)}\n`);

  const { faltantes } = await getSyncStatus({ desde, hasta, chagoRepoPath: CHAGO_REPO_PATH });

  if (faltantes.length === 0) {
    console.log('✅ No hay nada pendiente de sincronizar en este rango.');
    return;
  }

  console.log(`Encontrados ${faltantes.length} registros sin sincronizar.\n`);

  const generalId = LIVE ? await getVentasGeneralId() : null;
  if (LIVE && !generalId) {
    console.warn('⚠️ No se encontró la categoría "Ventas" en Chago; las transacciones se crearán sin categoría.\n');
  }

  const resultados = { creados: 0, yaExistian: 0, errores: 0 };

  for (const [i, record] of faltantes.entries()) {
    const label = `[${record.tipo}] ${fmtDate(record.fecha)} - ${record.nombre} - $${record.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    let externalId = record.externalId;
    const needsNewId = !externalId;
    if (needsNewId) {
      externalId = generateTransactionExternalId();
    }

    if (!LIVE) {
      console.log(`${i + 1}. [DRY RUN] ${label}`);
      console.log(`   externalId: ${externalId}${needsNewId ? ' (nuevo, no existía)' : ''}`);
      continue;
    }

    try {
      const { status, data } = await crearIngreso({ ...record, externalId }, generalId);

      if (status === 201 || data.success) {
        console.log(`${i + 1}. ✅ Creado: ${label}`);
        resultados.creados += 1;

        // Si no tenía externalId, guardarlo en el documento origen para trazabilidad futura
        if (needsNewId && record.docRef) {
          await record.docRef.set({ transactionExternalId: externalId }, { merge: true });
        }
      } else if (status === 409) {
        console.log(`${i + 1}. ⏭️  Ya existía en Chago: ${label}`);
        resultados.yaExistian += 1;
      } else {
        console.error(`${i + 1}. ❌ Error (${status}): ${label} — ${data.error || JSON.stringify(data)}`);
        resultados.errores += 1;
      }
    } catch (error) {
      console.error(`${i + 1}. ❌ Error de red: ${label} — ${error.message}`);
      resultados.errores += 1;
    }

    // Pequeña pausa entre llamadas para no saturar el endpoint
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n--- Resumen ---');
  if (!LIVE) {
    console.log(`${faltantes.length} registros se crearían. Vuelve a correr con --live para ejecutarlo de verdad.`);
  } else {
    console.log(`Creados: ${resultados.creados}`);
    console.log(`Ya existían (omitidos): ${resultados.yaExistian}`);
    console.log(`Errores: ${resultados.errores}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
