#!/usr/bin/env node

/**
 * Script para ejecutar la verificación de expiración de paquetes
 * Este script debe ser ejecutado diariamente por un cron job
 * 
 * Uso:
 * node scripts/verificar-expiracion-paquetes.js
 * 
 * Para configurar el cron job:
 * crontab -e
 * 
 * Agregar línea (ejecutar todos los días a las 2:00 AM):
 * 0 2 * * * cd /ruta/a/tu/proyecto && node scripts/verificar-expiracion-paquetes.js >> logs/cron-expiracion.log 2>&1
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/paquetes/verificar-expiracion';

function makeRequest() {
  return new Promise((resolve, reject) => {
    const url = new URL(API_ENDPOINT, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    console.log(`[${new Date().toISOString()}] Iniciando verificación de expiración de paquetes...`);
    console.log(`[${new Date().toISOString()}] URL: ${url.toString()}`);
    
    const req = protocol.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.success) {
            console.log(`[${new Date().toISOString()}] ✅ Verificación completada exitosamente`);
            console.log(`[${new Date().toISOString()}] Paquetes verificados: ${result.paquetesVerificados}`);
            console.log(`[${new Date().toISOString()}] Paquetes actualizados a expirado: ${result.paquetesActualizados}`);
            
            if (result.errores && result.errores.length > 0) {
              console.log(`[${new Date().toISOString()}] ⚠️  Se encontraron ${result.errores.length} errores:`);
              result.errores.forEach((error, index) => {
                console.log(`[${new Date().toISOString()}]   ${index + 1}. ${JSON.stringify(error)}`);
              });
            }
          } else {
            console.error(`[${new Date().toISOString()}] ❌ Error en la verificación:`, result.error);
          }
          
          resolve(result);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] ❌ Error al parsear respuesta:`, error.message);
          console.error(`[${new Date().toISOString()}] Respuesta raw:`, data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] ❌ Error en la petición:`, error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Ejecutar
makeRequest()
  .then(() => {
    console.log(`[${new Date().toISOString()}] Script finalizado correctamente`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] Script finalizado con errores`);
    process.exit(1);
  });
