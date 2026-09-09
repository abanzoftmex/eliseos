import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

/**
 * API para agregar el campo 'tipo' a paquetes asignados que no lo tienen
 * Obtiene el tipo del paquete original en la colección 'packages'
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔍 Buscando paquetes asignados sin campo "tipo"...');

    let totalUpdated = 0;
    let totalErrors = 0;
    const collections = ['clientes', 'atletas'];
    const results = [];

    for (const collectionName of collections) {
      console.log(`\n📂 Procesando colección: ${collectionName}`);
      
      try {
        // Obtener todos los usuarios de esta colección
        const usersSnapshot = await getDocs(collection(db, collectionName));
        console.log(`   Encontrados ${usersSnapshot.size} usuarios`);

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();
          const userName = `${userData.nombre || ''} ${userData.apellidoPaterno || ''}`.trim() || userId;

          // Obtener paquetes asignados
          const packagesSnapshot = await getDocs(
            collection(db, collectionName, userId, 'paquetesAsignados')
          );

          if (packagesSnapshot.empty) continue;

          console.log(`   👤 Usuario: ${userName} (${packagesSnapshot.size} paquetes)`);

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
              results.push({
                user: userName,
                package: pkgData.nombre,
                status: 'error',
                message: 'No tiene idPaquete'
              });
              totalErrors++;
              continue;
            }

            try {
              const originalPkgDoc = await getDoc(doc(db, 'packages', pkgData.idPaquete));
              
              let tipo = 'grupal'; // Por defecto
              
              if (!originalPkgDoc.exists()) {
                console.log(`      ⚠️  Paquete original no encontrado para "${pkgData.nombre}", usando tipo por defecto: grupal`);
              } else {
                const originalPkgData = originalPkgDoc.data();
                tipo = originalPkgData.tipo || 'grupal';
              }

              // Actualizar el paquete asignado
              await updateDoc(pkgDoc.ref, { tipo });
              console.log(`      ✅ Actualizado "${pkgData.nombre}" con tipo: ${tipo}`);
              
              results.push({
                user: userName,
                package: pkgData.nombre,
                status: 'success',
                tipo: tipo,
                message: 'Actualizado correctamente'
              });
              totalUpdated++;

            } catch (error) {
              console.error(`      ❌ Error al actualizar "${pkgData.nombre}":`, error.message);
              results.push({
                user: userName,
                package: pkgData.nombre,
                status: 'error',
                message: error.message
              });
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

    return res.status(200).json({
      success: true,
      summary: {
        totalUpdated,
        totalErrors,
        results
      },
      message: `Se actualizaron ${totalUpdated} paquetes correctamente`
    });

  } catch (error) {
    console.error('❌ Error fatal:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
