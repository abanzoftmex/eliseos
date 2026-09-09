/**
 * Script de auditoría: revisa qué paquetes asignados y ventas POS registrados en
 * Science In Motion, dentro de un rango de fechas, NO tienen una transacción
 * correspondiente sincronizada en Chago Science Motion (admin.scienceinmotion.com.mx).
 *
 * Por defecto revisa junio y julio del año actual.
 *
 * Requiere en science-in-motion/.env.local (mismo patrón que scripts/migrate-drafts-to-completed.js):
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   (credenciales de servicio del proyecto science-in-motion-7bd27)
 *
 * Las credenciales de Chago Science Motion se leen directamente de su propio .env.local
 * (ya las tiene: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY),
 * sin copiarlas a este repo. Ajusta CHAGO_REPO_PATH si el checkout está en otra ruta.
 *
 * Uso:
 *   node scripts/check-sync-status.js
 *   node scripts/check-sync-status.js --desde=2026-06-01 --hasta=2026-07-31
 */

require('dotenv').config({ path: '.env.local' });
const { getSyncStatus, fmtDate } = require('./lib/syncAudit');

const CHAGO_REPO_PATH =
  process.env.CHAGO_REPO_PATH || '/Volumes/Proyectos/trabajo/valquirico/chago-science-motion';

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

async function main() {
  console.log(`Revisando sincronización del ${fmtDate(desde)} al ${fmtDate(hasta)}...\n`);

  const { todos, faltantes, syncedCount } = await getSyncStatus({
    desde,
    hasta,
    chagoRepoPath: CHAGO_REPO_PATH,
  });

  console.log(`Registros en el rango (science-in-motion): ${todos.length}`);
  console.log(`Transacciones sincronizadas encontradas (chago): ${syncedCount}`);
  console.log(`Sin sincronizar en chago: ${faltantes.length}\n`);

  if (faltantes.length === 0) {
    console.log('✅ Todo lo del rango está sincronizado.');
    return;
  }

  faltantes.forEach((r, i) => {
    console.log(`${i + 1}. [${r.tipo}] ${fmtDate(r.fecha)} - ${r.nombre} - $${r.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`   ruta: ${r.ruta}`);
    console.log(`   externalId: ${r.externalId || '(no se generó al crearlo)'}`);
  });

  const totalMonto = faltantes.reduce((sum, r) => sum + r.monto, 0);
  console.log(`\nMonto total no reflejado en Chago: $${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
