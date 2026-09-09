// Financial Utils Index
export * from './formatters';
export * from './logger';
export * from './logoUtils';
export * from './queryEnhancer';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0];
};

export const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y PDF.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo excede el tamaño máximo permitido de 5MB.'
    };
  }

  return { valid: true };
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const sendEmailWithRateLimit = async (to, subject, html) => {
  if (sendEmailWithRateLimit.lastSent) {
    const timeSinceLastSent = Date.now() - sendEmailWithRateLimit.lastSent;
    if (timeSinceLastSent < 500) {
      await sleep(500 - timeSinceLastSent);
    }
  }
  
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    
    sendEmailWithRateLimit.lastSent = Date.now();
    return response;
  } catch (error) {
    sendEmailWithRateLimit.lastSent = Date.now();
    throw error;
  }
};

sendEmailWithRateLimit.lastSent = null;
