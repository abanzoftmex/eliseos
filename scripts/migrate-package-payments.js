/**
 * Script de migración: Actualizar montoPagado de paquetes existentes
 * 
 * Este script actualiza todos los paquetes asignados para establecer montoPagado = 0
 * porque originalmente se asignaban con montoPagado = precioTotal (asumiendo pagados)
 * cuando en realidad deben estar pendientes de pago hasta que se confirme el pago.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrarPaquetes() {
  console.log('🔄 Iniciando migración de pagos de paquetes...\n');
  
  let totalActualizados = 0;
  let totalErrores = 0;

  try {
    // Obtener todos los paquetes asignados usando collectionGroup
    const paquetesSnapshot = await db.collectionGroup('paquetesAsignados').get();
    
    console.log(`📦 Encontrados ${paquetesSnapshot.size} paquetes asignados\n`);

    // Procesar cada paquete
    const promises = paquetesSnapshot.docs.map(async (doc) => {
      try {
        const data = doc.data();
        const precioTotal = data.precioTotal || data.precio || 0;
        const montoPagado = data.montoPagado;

        // Si montoPagado es igual a precioTotal, significa que se asignó con la lógica antigua
        // Actualizarlo a 0 para que esté pendiente
        if (montoPagado !== undefined && montoPagado === precioTotal) {
          await doc.ref.update({
            montoPagado: 0
          });
          
          console.log(`✅ Actualizado: ${data.nombre || 'Sin nombre'} (${doc.id})`);
          console.log(`   Cliente: ${doc.ref.parent.parent.id}`);
          console.log(`   Precio: $${precioTotal}, Antes: $${montoPagado}, Ahora: $0\n`);
          
          totalActualizados++;
        } else if (montoPagado === undefined) {
          // Si montoPagado no existe, agregarlo como 0
          await doc.ref.update({
            montoPagado: 0
          });
          
          console.log(`✅ Agregado montoPagado: ${data.nombre || 'Sin nombre'} (${doc.id})`);
          console.log(`   Cliente: ${doc.ref.parent.parent.id}`);
          console.log(`   Precio: $${precioTotal}, montoPagado agregado: $0\n`);
          
          totalActualizados++;
        } else {
          console.log(`⏭️  Sin cambios: ${data.nombre || 'Sin nombre'} (montoPagado: $${montoPagado})`);
        }
      } catch (error) {
        console.error(`❌ Error procesando paquete ${doc.id}:`, error.message);
        totalErrores++;
      }
    });

    await Promise.all(promises);

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Paquetes actualizados: ${totalActualizados}`);
    console.log(`❌ Errores: ${totalErrores}`);
    console.log(`📦 Total procesados: ${paquetesSnapshot.size}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrarPaquetes()
  .then(() => {
    console.log('✨ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
