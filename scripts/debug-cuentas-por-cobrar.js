/**
 * Script de debug para ver qué está pasando con cuentas por cobrar
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

async function debugCuentas() {
  console.log('🔍 Debug de cuentas por cobrar...\n');
  
  const clienteId = '59OrxEjScWTuQcsuHf16';
  
  try {
    // Obtener el cliente
    const clienteDoc = await db.collection('clientes').doc(clienteId).get();
    
    if (!clienteDoc.exists) {
      console.log('❌ Cliente no encontrado');
      return;
    }
    
    const clienteData = clienteDoc.data();
    console.log('✅ Cliente encontrado:', clienteData.nombre);
    console.log();
    
    // Obtener paquetes
    const paquetesSnapshot = await db.collection('clientes').doc(clienteId).collection('paquetesAsignados').get();
    
    console.log(`📦 Paquetes encontrados: ${paquetesSnapshot.size}\n`);
    
    paquetesSnapshot.forEach((doc) => {
      const data = doc.data();
      const precioTotal = data.precioTotal || data.precio || 0;
      const montoPagado = data.montoPagado;
      const saldoPendiente = precioTotal - (montoPagado || 0);
      
      console.log('─'.repeat(50));
      console.log(`Paquete: ${data.nombre || 'Sin nombre'}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Precio Total: $${precioTotal}`);
      console.log(`  Monto Pagado: ${montoPagado === undefined ? 'undefined' : '$' + montoPagado}`);
      console.log(`  Saldo Pendiente: $${saldoPendiente}`);
      console.log(`  ¿Incluir en cuentas?: ${saldoPendiente > 0 ? '✅ SÍ' : '❌ NO'}`);
      console.log();
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
debugCuentas()
  .then(() => {
    console.log('✨ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
