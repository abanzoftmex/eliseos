require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Constantes para la simulación
const SIMULATED_DATE = new Date(2025, 9, 1); // Octubre 1, 2025
const SIMULATED_MONTH_KEY = '2025-09'; // Formato: YYYY-MM (octubre = mes 9 en índice 0)

// Funciones auxiliares
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Servicio de gastos recurrentes simplificado
const recurringExpenseService = {
  async getAll(filters = {}) {
    try {
      let q = collection(db, 'recurringExpenses');

      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const expenses = [];

      querySnapshot.forEach((doc) => {
        expenses.push({ id: doc.id, ...doc.data() });
      });

      return expenses;
    } catch (error) {
      console.error('Error getting recurring expenses:', error);
      throw new Error('Error al obtener los gastos recurrentes');
    }
  }
};

// Función principal de simulación
async function simulateEnteringDashboardInOctober() {
  try {
    console.log('🕐 Simulando entrada al dashboard en octubre 2025...\n');

    // 1. Obtener gastos recurrentes activos
    console.log('📋 Obteniendo gastos recurrentes activos...');
    const activeExpenses = await recurringExpenseService.getAll({ isActive: true });
    console.log(`✅ Encontrados ${activeExpenses.length} gastos recurrentes activos\n`);

    // Si no hay gastos recurrentes, informar y salir
    if (activeExpenses.length === 0) {
      console.log('⚠️  No se encontraron gastos recurrentes activos.');
      console.log('\n💡 Para probar la funcionalidad, puedes:');
      console.log('1. Ir a "Transacciones > Salidas" y crear una nueva transacción');
      console.log('2. Marcar la opción "Gasto Recurrente" al crearla');
      console.log('3. Ejecutar este script nuevamente\n');
      return;
    }

    // 2. Mostrar gastos recurrentes que se van a procesar
    console.log('💰 Gastos recurrentes a procesar:');
    activeExpenses.forEach((expense, index) => {
      const generatedMonths = expense.generatedMonths || [];
      const alreadyGenerated = generatedMonths.includes(SIMULATED_MONTH_KEY);
      
      console.log(`${index + 1}. ${expense.description || 'Sin descripción'}`);
      console.log(`   Monto: ${formatCurrency(expense.amount)}`);
      console.log(`   Ya generado para octubre 2025: ${alreadyGenerated ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Meses generados: [${generatedMonths.join(', ')}]`);
      console.log(`   Estado: ${expense.isActive ? '🟢 Activo' : '🔴 Inactivo'}`);
      console.log('');
    });

    // 3. Generar transacciones para octubre 2025
    console.log('🔄 Procesando gastos recurrentes...\n');
    const generatedTransactions = [];
    
    for (const expense of activeExpenses) {
      const generatedMonths = expense.generatedMonths || [];
      const alreadyGenerated = generatedMonths.includes(SIMULATED_MONTH_KEY);

      if (!alreadyGenerated) {
        console.log(`🆕 Generando transacción para: ${expense.description || 'Sin descripción'}`);
        
        // Crear la transacción
        const transactionData = {
          type: 'salida',
          generalId: expense.generalId,
          conceptId: expense.conceptId,
          subconceptId: expense.subconceptId,
          description: `${expense.description || 'Gasto recurrente'} (Recurrente)`,
          amount: expense.amount,
          date: SIMULATED_DATE,
          providerId: expense.providerId,
          division: expense.division,
          isRecurring: true,
          recurringExpenseId: expense.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'pendiente',
          payments: [],
          totalPaid: 0,
          balance: expense.amount,
        };

        // Agregar la transacción a Firestore
        const transactionsRef = collection(db, 'transactions');
        const newTransactionRef = await addDoc(transactionsRef, transactionData);
        
        generatedTransactions.push({
          id: newTransactionRef.id,
          ...transactionData
        });

        // Actualizar el gasto recurrente con el nuevo mes generado
        const updatedGeneratedMonths = [...generatedMonths, SIMULATED_MONTH_KEY];
        const recurringExpenseRef = doc(db, 'recurringExpenses', expense.id);
        await updateDoc(recurringExpenseRef, {
          lastGenerated: serverTimestamp(),
          generatedMonths: updatedGeneratedMonths
        });

        console.log(`   ✅ Transacción generada exitosamente (ID: ${newTransactionRef.id})`);
      } else {
        console.log(`⏭️  Saltando: ${expense.description || 'Sin descripción'} (ya generado para octubre 2025)`);
      }
    }

    // 4. Mostrar información actualizada después de la generación
    if (generatedTransactions.length > 0) {
      console.log(`\n✨ TRANSACCIONES GENERADAS:`);
      generatedTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.description}`);
        console.log(`   Monto: ${formatCurrency(transaction.amount)}`);
        console.log(`   Fecha: ${formatDate(transaction.date)}`);
        console.log(`   ID: ${transaction.id}`);
        console.log('');
      });
      
      // Mostrar estado actualizado de los gastos recurrentes
      console.log(`📊 ESTADO ACTUALIZADO DE GASTOS RECURRENTES:`);
      const updatedExpenses = await recurringExpenseService.getAll({ isActive: true });
      updatedExpenses.forEach((expense, index) => {
        const generatedMonths = expense.generatedMonths || [];
        console.log(`${index + 1}. ${expense.description || 'Sin descripción'}`);
        console.log(`   Meses generados actualizados: [${generatedMonths.join(', ')}]`);
        console.log('');
      });
    }

    // 5. Resumen final
    console.log('\n🎉 SIMULACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`📅 Fecha simulada: ${SIMULATED_DATE.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`);
    console.log(`💸 Transacciones generadas: ${generatedTransactions.length}`);
    
    if (generatedTransactions.length > 0) {
      const totalAmount = generatedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      console.log(`💰 Monto total generado: ${formatCurrency(totalAmount)}`);
    }

    console.log('\n🔍 Ahora puedes:');
    console.log('1. Ir al dashboard y ver las nuevas transacciones de octubre 2025');
    console.log('2. Ir a gastos recurrentes y ver el historial actualizado');
    console.log('3. Verificar que las transacciones aparecen como "Recurrente" en la tabla de salidas');

  } catch (error) {
    console.error('❌ Error durante la simulación:', error);
    process.exit(1);
  }
}

// Ejecutar simulación
if (require.main === module) {
  const mode = process.argv[2] || 'help';
  
  if (mode === 'simulate') {
    simulateEnteringDashboardInOctober();
  } else {
    console.log('🚀 Script de Simulación - Octubre 2025');
    console.log('='.repeat(50));
    console.log('Este script simula entrar al dashboard en octubre 2025');
    console.log('para probar la generación automática de gastos recurrentes.\n');
    console.log('Uso:');
    console.log('  npm run simulate-october');
    console.log('  node scripts/simulate-october-2025.cjs simulate\n');
    console.log('Variables de entorno requeridas:');
    console.log('  - NEXT_PUBLIC_FIREBASE_* (configuración de Firebase)');
    console.log('  - Archivo .env.local debe existir con la configuración correcta\n');
  }
}

module.exports = { simulateEnteringDashboardInOctober };
