/**
 * Utilidad para generar breadcrumbs automáticamente basados en la ruta actual
 * Maneja rutas de usuarios/clientes con nombres en lugar de IDs
 */

/**
 * Mapeo de segmentos de ruta a etiquetas legibles
 */
const ROUTE_LABELS = {
  'dashboard': 'Dashboard',
  'clientes': 'Clientes',
  'paquetes': 'Paquetes / Planes',
  'nuevo': 'Crear Paquete / Plan',
  'editar': 'Editar Paquete / Plan',
  'citas': 'Citas',
  'citas-deportivas': 'Citas Deportivas',
  'historial': 'Historial',
  'directorio': 'Directorio Interno',
  'registro': 'Registro de Clientes',
  'agendar': 'Agendar Clase'
};

/**
 * Construye el array de breadcrumbs basado en la ruta actual
 * @param {string} pathname - Pathname de Next.js (ej: /clientes/[id]/paquetes)
 * @param {object} query - Query params de Next.js (ej: { id: '123' })
 * @param {string} [userName] - Nombre del usuario si está disponible (opcional)
 * @returns {Array} Array de objetos breadcrumb { label, href, isLast }
 */
export function buildBreadcrumbs(pathname, query = {}, userName = null) {
  const breadcrumbs = [];
  
  // Siempre comenzar con Dashboard
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
    isLast: false
  });

  // Dividir el pathname en segmentos
  const segments = pathname.split('/').filter(seg => seg && seg !== 'dashboard');
  
  if (segments.length === 0) {
    // Estamos en dashboard, marcarlo como último
    breadcrumbs[0].isLast = true;
    return breadcrumbs;
  }

  let currentPath = '';
  let isInUserRoute = false; // Flag para saber si estamos dentro de una ruta de usuario
  
  segments.forEach((segment, index) => {
    const isLastSegment = index === segments.length - 1;
    
    // Caso especial: segmento "clientes" al inicio
    if (segment === 'clientes') {
      // Agregar crumb "Clientes" que enlaza a /clientes
      const hasClientesCrumb = breadcrumbs.some(b => b.label === 'Clientes');
      if (!hasClientesCrumb) {
        breadcrumbs.push({
          label: 'Clientes',
          href: '/clientes',
          isLast: isLastSegment
        });
      }
      currentPath += '/clientes';
      isInUserRoute = true;
    }
    // Caso especial: segmento [id] en clientes
    else if (segment === '[id]' && query.id && isInUserRoute) {
      const userId = query.id;
      
      // Agregar el nombre del usuario o "Cargando..." como placeholder
      currentPath += `/${userId}`;
      breadcrumbs.push({
        label: userName || 'Cargando...',
        href: currentPath,
        isLast: isLastSegment,
        isUserName: true // Flag para identificar que este crumb necesita el nombre
      });
    }
    // Caso especial: segmento [consultaId] en historial
    else if (segment === '[consultaId]' && query.consultaId) {
      currentPath += `/${query.consultaId}`;
      breadcrumbs.push({
        label: `Consulta ${query.consultaId.substring(0, 8)}...`,
        href: currentPath,
        isLast: isLastSegment
      });
    }
    // Segmentos normales
    else if (!segment.startsWith('[')) {
      currentPath += `/${segment}`;
      
      const label = ROUTE_LABELS[segment] || capitalize(segment);
      
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: isLastSegment
      });
    }
  });

  return breadcrumbs;
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str 
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Verifica si una ruta es una ruta de usuario/cliente
 * @param {string} pathname 
 * @returns {boolean}
 */
export function isUserRoute(pathname) {
  return pathname.startsWith('/clientes/') && pathname.includes('[id]');
}

/**
 * Extrae el ID del usuario de una ruta
 * @param {object} query - Query params de Next.js
 * @returns {string|null}
 */
export function getUserIdFromQuery(query) {
  return query?.id || null;
}
