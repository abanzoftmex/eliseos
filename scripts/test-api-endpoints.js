#!/usr/bin/env node

/**
 * Script de prueba rápida para los endpoints de integración
 * 
 * Uso:
 *   node scripts/test-api-endpoints.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'science-chago-api-integration-key-2026';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function testEndpoint(name, endpoint) {
  try {
    log(`\n🧪 Probando: ${endpoint}`, 'cyan');
    
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    const duration = Date.now() - startTime;
    
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ ${name} - OK (${duration}ms)`, 'green');
      
      // Mostrar información relevante según el tipo de endpoint
      if (endpoint.includes('/productos') && !endpoint.includes('/tipos')) {
        log(`   📦 Total productos: ${data.total || data.productos?.length || 0}`, 'blue');
      } else if (endpoint.includes('/productos/tipos')) {
        log(`   📊 Total tipos: ${data.total || data.tipos?.length || 0}`, 'blue');
      } else if (endpoint.includes('/planes') && !endpoint.includes('/tipos')) {
        log(`   📋 Total planes: ${data.total || data.planes?.length || 0}`, 'blue');
      } else if (endpoint.includes('/planes/tipos')) {
        log(`   📊 Total tipos: ${data.total || data.tipos?.length || 0}`, 'blue');
      } else if (endpoint.includes('/ventas/general')) {
        const resumen = data.resumen || {};
        log(`   💰 Total ventas: ${resumen.totalVentas || 0}`, 'blue');
        log(`   💵 Total ingresos: $${(resumen.totalIngresos || 0).toFixed(2)}`, 'blue');
      } else if (endpoint.includes('/ventas')) {
        log(`   💰 Total ventas: ${data.total || data.ventas?.length || 0}`, 'blue');
      } else if (endpoint.includes('/cuentas-por-cobrar')) {
        log(`   💳 Total cuentas: ${data.totalCuentas || 0}`, 'blue');
        log(`   💵 Total pendiente: $${(data.totalGeneral || 0).toFixed(2)}`, 'blue');
      }
      
      return { success: true, data, duration };
    } else {
      log(`❌ ${name} - Error ${response.status}`, 'red');
      log(`   ${data.error || 'Error desconocido'}`, 'red');
      return { success: false, error: data.error, duration };
    }
  } catch (error) {
    log(`❌ ${name} - Error de conexión`, 'red');
    log(`   ${error.message}`, 'red');
    return { success: false, error: error.message, duration: 0 };
  }
}

async function main() {
  logSection('🚀 TEST DE ENDPOINTS API - SCIENCE IN MOTION');
  
  log(`\n📍 Base URL: ${API_BASE}`, 'yellow');
  log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`, 'yellow');
  
  const results = {
    passed: 0,
    failed: 0,
    totalTime: 0
  };
  
  // Test 1: Productos
  logSection('📦 TEST 1: PRODUCTOS');
  const test1 = await testEndpoint('GET /api/productos', '/api/productos');
  if (test1.success) results.passed++; else results.failed++;
  results.totalTime += test1.duration;
  
  // Test 2: Tipos de productos
  logSection('📊 TEST 2: TIPOS DE PRODUCTOS');
  const test2 = await testEndpoint('GET /api/productos/tipos', '/api/productos/tipos');
  if (test2.success) results.passed++; else results.failed++;
  results.totalTime += test2.duration;
  
  // Test 3: Planes
  logSection('📋 TEST 3: PLANES');
  const test3 = await testEndpoint('GET /api/planes', '/api/planes');
  if (test3.success) results.passed++; else results.failed++;
  results.totalTime += test3.duration;
  
  // Test 4: Tipos de planes
  logSection('📊 TEST 4: TIPOS DE PLANES');
  const test4 = await testEndpoint('GET /api/planes/tipos', '/api/planes/tipos');
  if (test4.success) results.passed++; else results.failed++;
  results.totalTime += test4.duration;
  
  // Test 5: Ventas general
  logSection('💰 TEST 5: VENTAS GENERAL');
  const hoy = new Date();
  const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = hace30dias.toISOString().split('T')[0];
  const endDate = hoy.toISOString().split('T')[0];
  const test5 = await testEndpoint(
    'GET /api/ventas/general',
    `/api/ventas/general?startDate=${startDate}&endDate=${endDate}`
  );
  if (test5.success) results.passed++; else results.failed++;
  results.totalTime += test5.duration;
  
  // Test 6: Ventas detalladas
  logSection('💵 TEST 6: VENTAS DETALLADAS');
  const test6 = await testEndpoint('GET /api/ventas', '/api/ventas?limit=10');
  if (test6.success) results.passed++; else results.failed++;
  results.totalTime += test6.duration;
  
  // Test 7: Cuentas por cobrar
  logSection('💳 TEST 7: CUENTAS POR COBRAR');
  const test7 = await testEndpoint('GET /api/cuentas-por-cobrar', '/api/cuentas-por-cobrar');
  if (test7.success) results.passed++; else results.failed++;
  results.totalTime += test7.duration;
  
  // Resumen final
  logSection('📊 RESUMEN DE PRUEBAS');
  console.log();
  log(`✅ Pruebas exitosas: ${results.passed}`, results.passed > 0 ? 'green' : 'reset');
  log(`❌ Pruebas fallidas: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`⏱️  Tiempo total: ${results.totalTime}ms`, 'yellow');
  log(`⚡ Tiempo promedio: ${Math.round(results.totalTime / 7)}ms`, 'yellow');
  
  console.log();
  if (results.failed === 0) {
    log('🎉 ¡Todos los endpoints funcionan correctamente!', 'green');
  } else {
    log('⚠️  Algunos endpoints tienen problemas. Revisa los logs arriba.', 'red');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
