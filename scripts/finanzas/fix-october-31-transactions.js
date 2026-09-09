/**
 * 🔧 SCRIPT DE CORRECCIÓN: Mover transacciones del 31 de octubre al 1 de noviembre
 * 
 * Este script:
 * 1. Busca transacciones recurrentes marcadas para el 31 de octubre
 * 2. Las mueve al 1 de noviembre (fecha correcta para mensuales)
 * 3. Genera reporte de cambios realizados
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, getApps } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const OCTOBER_31_2025 = new Date('2025-10-31T00:00:00');
const OCTOBER_31_END = new Date('2025-10-31T23:59:59');
const NOVEMBER_1_2025 = new Date('2025-11-01T00:00:00');

async function fixOctober31Transactions() {
  console.log('🔧 Iniciando corrección de transacciones del 31 de octubre...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Obtener todas las transacciones recurrentes del 31 de octubre
    console.log('🔍 Buscando transacciones recurrentes del 31 de octubre 2025...');
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('isRecurring', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const october31Transactions = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const transactionDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      
      // Filtrar solo las del 31 de octubre
      if (transactionDate >= OCTOBER_31_2025 && transactionDate <= OCTOBER_31_END) {
        october31Transactions.push({
          id: docSnap.id,
          ...data,
          date: transactionDate,
          docRef: docSnap.ref,
        });
      }
    });

    console.log(`✅ Encontradas ${october31Transactions.length} transacciones recurrentes del 31 de octubre\n`);

    if (october31Transactions.length === 0) {
      console.log('✨ No hay transacciones que corregir. Todo está bien.\n');
      return { success: true, updated: 0, transactions: [] };
    }

    // 2. Mostrar transacciones a corregir
    console.log('📋 TRANSACCIONES A CORREGIR:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    october31Transactions.forEach((t, i) => {
      console.log(`${i + 1}. ${t.description || 'Sin descripción'}`);
      console.log(`   💰 Monto: $${(t.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   📅 Fecha actual: 31 de octubre 2025`);
      console.log(`   📅 Nueva fecha: 1 de noviembre 2025`);
      console.log(`   🆔 ID: ${t.id}`);
      console.log(`   📊 Estado: ${t.status || 'N/A'}`);
      console.log('');
    });

    // 3. Confirmar corrección
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  ATENCIÓN: Se van a mover estas transacciones al 1 de noviembre');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 4. Actualizar transacciones
    const updated = [];
    const errors = [];

    for (const transaction of october31Transactions) {
      try {
        const transactionRef = doc(db, 'transactions', transaction.id);
        
        // Actualizar la fecha al 1 de noviembre
        await updateDoc(transactionRef, {
          date: Timestamp.fromDate(NOVEMBER_1_2025),
          updatedAt: Timestamp.now(),
        });

        updated.push(transaction);
        console.log(`✅ Actualizada: ${transaction.id.substring(0, 8)}... - ${transaction.description || 'Sin descripción'}`);
      } catch (error) {
        errors.push({ transaction, error: error.message });
        console.log(`❌ Error: ${transaction.id.substring(0, 8)}... - ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CORRECCIÓN');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`✅ Transacciones actualizadas: ${updated.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`💰 Monto total movido: $${updated.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      errors.forEach((e, i) => {
        console.log(`${i + 1}. ${e.transaction.id}: ${e.error}`);
      });
    }

    console.log('\n✅ Corrección completada exitosamente\n');
    console.log('📅 Todas las transacciones recurrentes mensuales ahora están en 1 de noviembre\n');

    return {
      success: true,
      updated: updated.length,
      errors: errors.length,
      transactions: updated,
    };

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    throw error;
  }
}

// Ejecutar corrección
if (require.main === module) {
  fixOctober31Transactions()
    .then(result => {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 PROCESO COMPLETADO');
      console.log('═══════════════════════════════════════════════════════════════\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixOctober31Transactions };
