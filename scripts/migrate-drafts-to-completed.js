/**
 * Script de Migración: Drafts a Consultas Completadas
 * 
 * Este script convierte todos los borradores (drafts) existentes en consultas completadas.
 * Esto es necesario después de eliminar la funcionalidad de drafts del sistema.
 * 
 * IMPORTANTE: Ejecutar solo UNA VEZ después de desplegar los cambios que eliminan drafts.
 * 
 * Uso:
 *   node scripts/migrate-drafts-to-completed.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase Admin usando variables de entorno
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
    });
}

const db = admin.firestore();

async function migrateDraftsToCompleted() {
    console.log('🚀 Iniciando migración de drafts a consultas completadas...\n');

    try {
        // 1. Obtener todos los drafts de la colección 'consultas'
        const consultasRef = db.collection('consultas');
        const draftsQuery = consultasRef.where('status', '==', 'draft');
        const draftsSnapshot = await draftsQuery.get();

        if (draftsSnapshot.empty) {
            console.log('✅ No se encontraron drafts para migrar.');
            return;
        }

        console.log(`📊 Se encontraron ${draftsSnapshot.size} drafts para migrar.\n`);

        let migratedCount = 0;
        let errorCount = 0;
        const errors = [];

        // 2. Procesar cada draft
        for (const doc of draftsSnapshot.docs) {
            try {
                const draftData = doc.data();
                const draftId = doc.id;

                console.log(`📝 Migrando draft: ${draftId}`);
                console.log(`   - Cliente ID: ${draftData.clienteId}`);
                console.log(`   - Tipo: ${draftData.type || 'normal'}`);

                // 3. Actualizar el status a 'completed'
                await doc.ref.update({
                    status: 'completed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    migratedFromDraft: true, // Flag para identificar que fue migrado
                    migratedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                migratedCount++;
                console.log(`   ✅ Migrado exitosamente\n`);

            } catch (error) {
                errorCount++;
                const errorMsg = `Error migrando draft ${doc.id}: ${error.message}`;
                errors.push(errorMsg);
                console.error(`   ❌ ${errorMsg}\n`);
            }
        }

        // 4. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(60));
        console.log(`✅ Drafts migrados exitosamente: ${migratedCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        console.log(`📈 Total procesados: ${draftsSnapshot.size}`);

        if (errors.length > 0) {
            console.log('\n⚠️  Errores encontrados:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        console.log('\n✅ Migración completada.');

    } catch (error) {
        console.error('❌ Error fatal durante la migración:', error);
        throw error;
    }
}

// Ejecutar migración
migrateDraftsToCompleted()
    .then(() => {
        console.log('\n🎉 Script finalizado exitosamente.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script finalizado con errores:', error);
        process.exit(1);
    });
