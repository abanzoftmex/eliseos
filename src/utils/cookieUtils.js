/**
 * Utilidades para manejo de cookies
 */

/**
 * Establece una cookie
 * @param {string} name - Nombre de la cookie
 * @param {string} value - Valor de la cookie
 * @param {number} days - Días hasta que expire
 */
export function setCookie(name, value, days = 7) {
  const maxAge = days * 24 * 60 * 60; // convertir días a segundos
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  
  // Log para verificar
  console.log('Cookie establecida:', { name, value, days });
  console.log('Todas las cookies:', document.cookie);
}

/**
 * Obtiene el valor de una cookie
 * @param {string} name - Nombre de la cookie
 * @returns {string|null} - Valor de la cookie o null si no existe
 */
export function getCookie(name) {
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  
  return null;
}

/**
 * Elimina una cookie
 * @param {string} name - Nombre de la cookie
 */
export function deleteCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  console.log('Cookie eliminada:', name);
}

/**
 * Elimina múltiples cookies de autenticación
 * @param {string[]} names - Lista de cookies a eliminar
 */
export function deleteCookies(names = []) {
  names.forEach(deleteCookie);
}

/**
 * Verifica si existe una cookie
 * @param {string} name - Nombre de la cookie
 * @returns {boolean} - true si existe, false si no
 */
export function hasCookie(name) {
  return getCookie(name) !== null;
}
