#!/usr/bin/env node

/**
 * Script de verificación rápida para la integración con Science Motion
 * Ejecutar: node scripts/verify-science-motion-connection.js
 */

const API_KEY = 'science-chago-api-integration-key-2026';
const BASE_URL = process.env.EXTERNAL_SYSTEM_URL || 'http://localhost:3000';

const endpoints = [
  '/api/productos',
  '/api/productos/tipos',
  '/api/planes',
  '/api/planes/tipos',
  '/api/ventas',
  '/api/ventas/general',
  '/api/cuentas-por-cobrar',
];

console.log('🔍 Verificando conexión con Science Motion...\n');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🔑 API Key: ${API_KEY}\n`);

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/html')) {
      console.log(`❌ ${endpoint}`);
      console.log(`   → Devuelve HTML (404) - Endpoint no existe\n`);
      return false;
    }

    if (!response.ok) {
      console.log(`⚠️  ${endpoint}`);
      console.log(`   → HTTP ${response.status}\n`);
      return false;
    }

    const data = await response.json();
    
    if (data.success === false) {
      console.log(`⚠️  ${endpoint}`);
      console.log(`   → Error: ${data.error || data.message}\n`);
      return false;
    }

    console.log(`✅ ${endpoint}`);
    
    // Mostrar información adicional
    if (data.data && Array.isArray(data.data)) {
      console.log(`   → ${data.data.length} registros encontrados`);
    } else if (data.ventas && Array.isArray(data.ventas)) {
      console.log(`   → ${data.ventas.length} ventas encontradas`);
    } else if (data.totales) {
      console.log(`   → Totales disponibles`);
    }
    console.log('');
    
    return true;
  } catch (error) {
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log(`❌ ${endpoint}`);
      console.log(`   → No se puede conectar. ¿Science Motion está corriendo?\n`);
    } else {
      console.log(`❌ ${endpoint}`);
      console.log(`   → Error: ${error.message}\n`);
    }
    return false;
  }
}

async function runTests() {
  const results = await Promise.all(endpoints.map(testEndpoint));
  const successCount = results.filter(r => r).length;
  const totalCount = results.length;

  console.log('━'.repeat(60));
  console.log(`\n📊 Resultados: ${successCount}/${totalCount} endpoints funcionando\n`);

  if (successCount === totalCount) {
    console.log('✅ ¡Todo funcionando correctamente!\n');
    console.log('Los filtros de Science Motion deberían funcionar sin problemas.');
  } else if (successCount === 0) {
    console.log('❌ Ningún endpoint está funcionando\n');
    console.log('Acciones recomendadas:');
    console.log('1. Verifica que Science Motion esté corriendo:');
    console.log('   cd /ruta/a/science-motion && npm run dev');
    console.log('2. Confirma que esté en el puerto 3000');
    console.log('3. Verifica EXTERNAL_SYSTEM_URL en .env.local');
  } else {
    console.log('⚠️  Algunos endpoints no están funcionando\n');
    console.log('Revisa los endpoints marcados con ❌ en Science Motion');
  }

  console.log('\n💡 Tip: Puedes probar un endpoint manualmente con:');
  console.log(`   curl -H "x-api-key: ${API_KEY}" ${BASE_URL}/api/productos`);
  console.log('');
}

runTests();
