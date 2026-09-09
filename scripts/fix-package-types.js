/**
 * Script para agregar el campo 'tipo' a paquetes asignados que no lo tienen
 * Obtiene el tipo del paquete original en la colección 'packages'
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixPackageTypes() {
  console.log('🔍 Buscando paquetes asignados sin campo "tipo"...\n');

  let totalUpdated = 0;
  let totalErrors = 0;
  const collections = ['clientes', 'atletas'];

  for (const collectionName of collections) {
    console.log(`\n📂 Procesando colección: ${collectionName}`);
    
    try {
      // Obtener todos los usuarios de esta colección
      const usersSnapshot = await db.collection(collectionName).get();
      console.log(`   Encontrados ${usersSnapshot.size} usuarios`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userName = `${userData.nombre || ''} ${userData.apellidoPaterno || ''}`.trim() || userId;

        // Obtener paquetes asignados
        const packagesSnapshot = await db
          .collection(collectionName)
          .doc(userId)
          .collection('paquetesAsignados')
          .get();

        if (packagesSnapshot.empty) continue;

        console.log(`\n   👤 Usuario: ${userName} (${packagesSnapshot.size} paquetes)`);

        for (const pkgDoc of packagesSnapshot.docs) {
          const pkgData = pkgDoc.data();
          const pkgId = pkgDoc.id;

          // Verificar si ya tiene el campo 'tipo'
          if (pkgData.tipo) {
            console.log(`      ✓ Paquete "${pkgData.nombre}" ya tiene tipo: ${pkgData.tipo}`);
            continue;
          }

          // Si no tiene tipo, obtenerlo del paquete original
          if (!pkgData.idPaquete) {
            console.log(`      ⚠️  Paquete "${pkgData.nombre}" no tiene idPaquete, no se puede actualizar`);
            totalErrors++;
            continue;
          }

          try {
            const originalPkgDoc = await db.collection('packages').doc(pkgData.idPaquete).get();
            
            if (!originalPkgDoc.exists) {
              console.log(`      ⚠️  Paquete original no encontrado para "${pkgData.nombre}"`);
              // Asignar 'grupal' por defecto
              await pkgDoc.ref.update({ tipo: 'grupal' });
              console.log(`      ✅ Actualizado "${pkgData.nombre}" con tipo por defecto: grupal`);
              totalUpdated++;
              continue;
            }

            const originalPkgData = originalPkgDoc.data();
            const tipo = originalPkgData.tipo || 'grupal'; // Por defecto 'grupal'

            // Actualizar el paquete asignado
            await pkgDoc.ref.update({ tipo });
            console.log(`      ✅ Actualizado "${pkgData.nombre}" con tipo: ${tipo}`);
            totalUpdated++;

          } catch (error) {
            console.error(`      ❌ Error al actualizar "${pkgData.nombre}":`, error.message);
            totalErrors++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error procesando colección ${collectionName}:`, error.message);
      totalErrors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Paquetes actualizados: ${totalUpdated}`);
  console.log(`   ❌ Errores: ${totalErrors}`);
  console.log('='.repeat(60));
}

// Ejecutar el script
fixPackageTypes()
  .then(() => {
    console.log('\n✨ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
