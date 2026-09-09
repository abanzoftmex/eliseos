/**
 * 🔍 SCRIPT DE AUDITORÍA - DETECCIÓN DE COBROS DUPLICADOS
 * 
 * Este script detecta transacciones de suscripciones mensuales duplicadas
 * generadas el 31 de octubre de 2025 debido al bug en la lógica de fecha.
 * 
 * Criterios de duplicado:
 * - Mismo recurringExpenseId
 * - Mismo amount
 * - Creadas en fechas muy cercanas (dentro de 7 días)
 * - Marcadas como isRecurring = true
 * 
 * Salidas:
 * - Archivo CSV con todos los duplicados detectados
 * - Console.log con resumen de duplicados
 * - No elimina nada automáticamente (solo auditoría)
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { initializeApp, getApps } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} = require("firebase/firestore");
const fs = require('fs');
const path = require('path');

// Inicializar Firebase
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
const NOVEMBER_7_2025 = new Date('2025-11-07T23:59:59'); // 7 días después

async function auditDuplicateRecurringCharges() {
  console.log('🔍 Iniciando auditoría de cobros duplicados del 31 de octubre de 2025...\n');
  
  try {
    // Obtener todas las transacciones recurrentes (sin orderBy para evitar índice compuesto)
    console.log('📊 Obteniendo todas las transacciones recurrentes de la base de datos...');
    const transactionsRef = collection(db, "transactions");
    const q = query(
      transactionsRef,
      where("isRecurring", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const transactions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const transactionDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
      
      // Filtrar solo transacciones entre 31 oct y 7 nov 2025
      if (transactionDate >= OCTOBER_31_2025 && transactionDate <= NOVEMBER_7_2025) {
        transactions.push({
          id: doc.id,
          ...data,
          date: transactionDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        });
      }
    });
    
    // Ordenar manualmente por fecha
    transactions.sort((a, b) => a.date - b.date);

    console.log(`📊 Total de transacciones recurrentes encontradas (31 oct - 7 nov 2025): ${transactions.length}\n`);

    // Agrupar por recurringExpenseId para detectar duplicados
    const groupedByRecurringExpense = {};
    
    transactions.forEach(transaction => {
      const key = transaction.recurringExpenseId;
      if (!key) return;
      
      if (!groupedByRecurringExpense[key]) {
        groupedByRecurringExpense[key] = [];
      }
      groupedByRecurringExpense[key].push(transaction);
    });

    // Detectar duplicados (más de una transacción para el mismo recurringExpenseId)
    const duplicates = [];
    const duplicateGroups = [];

    Object.entries(groupedByRecurringExpense).forEach(([recurringExpenseId, txns]) => {
      if (txns.length > 1) {
        // Verificar que tengan el mismo monto (son realmente duplicados)
        const amounts = [...new Set(txns.map(t => t.amount))];
        
        if (amounts.length === 1) {
          // Son duplicados legítimos (mismo recurringExpenseId, mismo monto)
          duplicateGroups.push({
            recurringExpenseId,
            amount: amounts[0],
            count: txns.length,
            transactions: txns
          });
          
          txns.forEach(txn => duplicates.push(txn));
        }
      }
    });

    console.log(`⚠️  DUPLICADOS DETECTADOS: ${duplicateGroups.length} grupos de gastos recurrentes\n`);
    console.log(`📝 Total de transacciones duplicadas: ${duplicates.length}\n`);

    // Imprimir resumen en consola
    if (duplicateGroups.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📋 RESUMEN DE DUPLICADOS DETECTADOS:');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      duplicateGroups.forEach((group, index) => {
        console.log(`${index + 1}. Gasto Recurrente ID: ${group.recurringExpenseId}`);
        console.log(`   💰 Monto: $${group.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
        console.log(`   🔄 Cobros duplicados: ${group.count}`);
        console.log(`   📅 Fechas de los cobros:`);
        
        group.transactions.forEach((txn, i) => {
          console.log(`      ${i + 1}. ${txn.date.toLocaleDateString('es-MX')} - ID: ${txn.id}`);
        });
        console.log('');
      });
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

    // Generar archivo CSV
    if (duplicates.length > 0) {
      const csvHeaders = 'transactionId,recurringExpenseId,userId,amount,date,createdAt,description,status\n';
      const csvRows = duplicates.map(txn => {
        return [
          txn.id,
          txn.recurringExpenseId || 'N/A',
          txn.userId || 'N/A',
          txn.amount,
          txn.date.toISOString().split('T')[0],
          txn.createdAt.toISOString(),
          `"${(txn.description || '').replace(/"/g, '""')}"`, // Escape comillas
          txn.status || 'N/A'
        ].join(',');
      }).join('\n');

      const csvContent = csvHeaders + csvRows;
      
      // Guardar el archivo CSV
      const auditDir = path.join(process.cwd(), 'audit-reports');
      if (!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const csvFilePath = path.join(auditDir, `duplicados-octubre-31-${timestamp}.csv`);
      
      fs.writeFileSync(csvFilePath, csvContent, 'utf8');
      
      console.log(`✅ Archivo CSV generado exitosamente:`);
      console.log(`   📁 Ubicación: ${csvFilePath}`);
      console.log(`   📊 Registros: ${duplicates.length}\n`);
    } else {
      console.log('✨ ¡Excelente! No se encontraron duplicados en el rango de fechas analizado.\n');
    }

    // Estadísticas finales
    const totalAmountDuplicated = duplicates.reduce((sum, txn) => sum + txn.amount, 0);
    
    return {
      success: true,
      summary: {
        totalTransactionsAnalyzed: transactions.length,
        duplicateGroupsFound: duplicateGroups.length,
        totalDuplicateTransactions: duplicates.length,
        totalAmountDuplicated: totalAmountDuplicated,
        dateRange: {
          from: OCTOBER_31_2025.toISOString().split('T')[0],
          to: NOVEMBER_7_2025.toISOString().split('T')[0]
        }
      },
      duplicateGroups,
      duplicates
    };

  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  auditDuplicateRecurringCharges()
    .then(result => {
      console.log('\n✅ Auditoría completada exitosamente');
      console.log(`\n📊 ESTADÍSTICAS FINALES:`);
      console.log(`   - Transacciones analizadas: ${result.summary.totalTransactionsAnalyzed}`);
      console.log(`   - Grupos de duplicados: ${result.summary.duplicateGroupsFound}`);
      console.log(`   - Total de duplicados: ${result.summary.totalDuplicateTransactions}`);
      console.log(`   - Monto total duplicado: $${result.summary.totalAmountDuplicated.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`\n⚠️  IMPORTANTE: Este script NO eliminó ninguna transacción.`);
      console.log(`   Revisa el archivo CSV generado antes de tomar acción.\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { auditDuplicateRecurringCharges };
