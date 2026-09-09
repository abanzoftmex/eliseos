/**
 * Utilidades para manejo de paquetes
 */

const DURACION_PAQUETE_DIAS = 30;

/**
 * Calcula los días restantes de un paquete basado en su fecha de asignación
 * @param {Date|string|Object} fechaAsignacion - Fecha de asignación del paquete (puede ser Date, ISO string o Timestamp de Firebase)
 * @returns {number} Días restantes (puede ser negativo si ya expiró)
 */
export const calcularDiasRestantes = (fechaAsignacion) => {
  if (!fechaAsignacion) return 0;
  
  let fecha;
  
  // Convertir a Date según el tipo
  if (fechaAsignacion.toDate && typeof fechaAsignacion.toDate === 'function') {
    // Es un Timestamp de Firebase
    fecha = fechaAsignacion.toDate();
  } else if (typeof fechaAsignacion === 'string') {
    // Es una cadena ISO
    fecha = new Date(fechaAsignacion);
  } else if (fechaAsignacion instanceof Date) {
    // Ya es un Date
    fecha = fechaAsignacion;
  } else {
    return 0;
  }
  
  // Validar que la fecha sea válida
  if (isNaN(fecha.getTime())) return 0;
  
  // Calcular días transcurridos
  const ahora = new Date();
  const diffTime = ahora - fecha;
  const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Retornar días restantes
  return DURACION_PAQUETE_DIAS - diasTranscurridos;
};

/**
 * Verifica si un paquete está expirado
 * @param {Date|string|Object} fechaAsignacion - Fecha de asignación del paquete
 * @returns {boolean} true si está expirado, false si no
 */
export const isPaqueteExpirado = (fechaAsignacion) => {
  return calcularDiasRestantes(fechaAsignacion) <= 0;
};

/**
 * Formatea los días restantes para mostrar en UI
 * @param {number} diasRestantes - Días restantes del paquete
 * @returns {Object} Objeto con texto y clase CSS según estado
 */
export const formatearDiasRestantes = (diasRestantes) => {
  if (diasRestantes <= 0) {
    return {
      texto: 'Expirado',
      clase: 'text-red-600 bg-red-50 border-red-200',
      icono: '⚠️'
    };
  } else if (diasRestantes <= 7) {
    return {
      texto: `${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`,
      clase: 'text-orange-600 bg-orange-50 border-orange-200',
      icono: '⏰'
    };
  } else {
    return {
      texto: `${diasRestantes} días`,
      clase: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      icono: '✓'
    };
  }
};

/**
 * Calcula la fecha de expiración de un paquete
 * @param {Date|string|Object} fechaAsignacion - Fecha de asignación del paquete
 * @returns {Date|null} Fecha de expiración o null si hay error
 */
export const calcularFechaExpiracion = (fechaAsignacion) => {
  if (!fechaAsignacion) return null;
  
  let fecha;
  
  // Convertir a Date según el tipo
  if (fechaAsignacion.toDate && typeof fechaAsignacion.toDate === 'function') {
    fecha = fechaAsignacion.toDate();
  } else if (typeof fechaAsignacion === 'string') {
    fecha = new Date(fechaAsignacion);
  } else if (fechaAsignacion instanceof Date) {
    fecha = fechaAsignacion;
  } else {
    return null;
  }
  
  // Validar que la fecha sea válida
  if (isNaN(fecha.getTime())) return null;
  
  // Agregar 30 días
  const fechaExpiracion = new Date(fecha);
  fechaExpiracion.setDate(fechaExpiracion.getDate() + DURACION_PAQUETE_DIAS);
  
  return fechaExpiracion;
};
