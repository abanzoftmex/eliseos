/**
 * Script de prueba para verificar la categorización de ventas
 * Ejecutar: node scripts/test-categorizacion.js
 */

const BASE_URL = 'http://localhost:3001';
const API_KEY = 'science-chago-api-integration-key-2026';

async function testConsultaCategorias() {
  console.log('🧪 TEST: Consulta de Categorías');
  console.log('=' .repeat(50));
  
  try {
    console.log('\n1️⃣  Consultando categorías generales...');
    const response = await fetch(`${BASE_URL}/api/generales?type=entrada`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Respuesta exitosa\n');
      console.log(`📊 Total de categorías: ${data.data?.length || 0}\n`);
      
      if (data.data && data.data.length > 0) {
        console.log('Categorías disponibles:');
        data.data.forEach((general, index) => {
          console.log(`  ${index + 1}. ${general.name} (ID: ${general.id})`);
        });
        
        // Buscar el general "Ventas"
        const ventasGeneral = data.data.find(g => g.name === 'Ventas');
        if (ventasGeneral) {
          console.log(`\n✅ General "Ventas" encontrado:`);
          console.log(`   ID: ${ventasGeneral.id}`);
          console.log(`   Nombre: ${ventasGeneral.name}`);
          console.log(`   Tipo: ${ventasGeneral.type || 'entrada'}`);
          return ventasGeneral.id;
        } else {
          console.log('\n⚠️  No se encontró el general "Ventas"');
          console.log('   Las ventas se sincronizarán sin categoría general');
          return null;
        }
      } else {
        console.log('⚠️  No hay categorías disponibles');
        return null;
      }
    } else {
      console.log('❌ Error en la respuesta:', data.error);
      return null;
    }
  } catch (error) {
    console.log('\n❌ Error de conexión:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   1. Science Chago esté corriendo en http://localhost:3001');
    console.log('   2. El API key sea correcto');
    console.log('   3. El endpoint /api/generales esté disponible');
    return null;
  }
}

async function testSimulacionVenta(ventasGeneralId) {
  console.log('\n\n🧪 TEST: Simulación de Sincronización de Venta');
  console.log('=' .repeat(50));
  
  const mockVenta = {
    externalId: `sim-test-${Date.now()}`,
    sucursalId: 'valquirico',
    clienteId: 'test-cliente-123',
    amount: 135.50,
    date: new Date().toISOString().split('T')[0],
    concepto: 'Matcha, Agua, Vainilla Chai',
    description: 'Venta POS - Matcha x1, Agua x2, Vainilla Chai x1 - Cliente: Test User',
    generalId: ventasGeneralId,
    subconceptId: null
  };
  
  console.log('\n📦 Payload de prueba:');
  console.log(JSON.stringify(mockVenta, null, 2));
  
  console.log('\n💡 Notas:');
  if (ventasGeneralId) {
    console.log('   ✅ La venta incluye generalId (categorización correcta)');
    console.log('   ✅ La venta incluye subconceptId: null (sin subconcepto)');
  } else {
    console.log('   ⚠️  La venta NO incluye generalId (aparecerá como "No especificado")');
  }
  
  console.log('\n   Para enviar esta venta real, usa:');
  console.log(`   POST ${BASE_URL}/api/integration/sync/transacciones/ingreso`);
}

async function main() {
  console.log('\n🚀 Iniciando pruebas de categorización de ventas\n');
  
  const ventasGeneralId = await testConsultaCategorias();
  await testSimulacionVenta(ventasGeneralId);
  
  console.log('\n\n' + '=' .repeat(50));
  console.log('✅ Pruebas completadas');
  console.log('=' .repeat(50));
  console.log('\n📖 Ver documentación completa en:');
  console.log('   docs/SCIENCE_CHAGO_CATEGORIZACION.md\n');
}

main();
