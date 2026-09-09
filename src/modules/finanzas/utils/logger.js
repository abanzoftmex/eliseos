/**
 * Utilidad para logs condicionales basados en el entorno
 */

// Solo mostrar logs en desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

export const debugLog = {
  // Log general de debug (solo en desarrollo)
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // Log de error (siempre se muestra)
  error: (...args) => {
    console.error(...args);
  },

  // Log de advertencia (siempre se muestra)
  warn: (...args) => {
    console.warn(...args);
  },

  // Log de información importante (siempre se muestra)
  info: (...args) => {
    console.info(...args);
  },

  // Log específico para reportes (con emoji para fácil identificación)
  report: (emoji, message, data) => {
    if (isDevelopment) {
      console.log(`${emoji} ${message}:`, data);
    }
  },

  // Log de performance (solo en desarrollo)
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

// Para casos donde necesites forzar un log en producción (emergencias)
export const forceLog = {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};
