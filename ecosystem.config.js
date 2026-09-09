/**
 * Configuración de PM2 para el cron job de verificación de expiración de paquetes
 * 
 * Instalación:
 * npm install -g pm2
 * 
 * Uso:
 * pm2 start ecosystem.config.js
 * pm2 save
 * pm2 startup
 * 
 * Monitoreo:
 * pm2 logs verificar-expiracion
 * pm2 status
 */

module.exports = {
  apps: [
    // Aplicación principal Next.js
    {
      name: 'science-in-motion',
      script: 'npm',
      args: 'start',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    // Cron job para verificar expiración de paquetes
    {
      name: 'verificar-expiracion',
      script: './scripts/verificar-expiracion-paquetes.js',
      cron_restart: '0 2 * * *', // Ejecutar diariamente a las 2:00 AM
      autorestart: false, // No reiniciar automáticamente (solo por cron)
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production',
        BASE_URL: 'http://localhost:3000'
      },
      env_production: {
        NODE_ENV: 'production',
        BASE_URL: 'https://tu-dominio.com' // Cambiar por tu dominio en producción
      },
      error_file: './logs/verificar-expiracion-error.log',
      out_file: './logs/verificar-expiracion-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
