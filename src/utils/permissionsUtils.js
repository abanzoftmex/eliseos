// Configuración de permisos por rol
export const ROLE_PERMISSIONS = {
  admin: ['dashboard', 'directorio', 'clientes', 'paquetes', 'productos', 'clases', 'asignar-paquetes', 'configuracion', 'finanzas', 'calendario', 'sucursales'],
  medico: ['dashboard', 'directorio', 'clientes', 'productos', 'clases', 'asignar-paquetes', 'calendario'],
  asistente: ['dashboard', 'clientes', 'productos', 'clases', 'calendario'],
  invitado: ['dashboard'],
};

// Mapeo de rutas a permisos requeridos
export const ROUTE_PERMISSIONS = {
  '/dashboard': 'dashboard',
  '/directorio': 'directorio',
  '/clientes': 'clientes',
  '/paquetes': 'paquetes',
  '/paquetes/nuevo': 'paquetes',
  '/paquetes/editar': 'paquetes',
  '/paquetes/[id]': 'paquetes', // Detalle de paquete con usuarios asignados
  '/productos': 'productos',
  '/productos/nuevo': 'productos',
  '/productos/editar': 'productos',
  '/productos/[id]': 'productos', // Detalle de producto
  '/clases': 'clases',
  '/clases/nueva': 'clases',
  '/clases/editar': 'clases',
  '/clases/[id]': 'clases', // Detalle de clase con participantes
  '/configuracion': 'configuracion',
  '/finanzas': 'finanzas',
  '/usuarios': 'clientes', // Las rutas de usuarios requieren permiso de clientes
  '/clientes/[id]/paquetes': 'asignar-paquetes', // Asignar paquetes a usuarios específicos
  '/clientes/[id]/productos': 'productos', // Asignar productos a usuarios específicos
};

// Opciones del menú lateral con sus permisos requeridos
export const MENU_OPTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    permission: 'dashboard',
  },
  {
    id: 'directorio',
    label: 'Directorio',
    path: '/directorio',
    icon: 'BookOpen',
    permission: 'directorio',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    path: '/clientes',
    icon: 'Users',
    permission: 'clientes',
  },
  {
    id: 'paquetes',
    label: 'Paquetes',
    path: '/paquetes',
    icon: 'Package',
    permission: 'paquetes',
  },
  {
    id: 'productos',
    label: 'Productos Únicos',
    path: '/productos',
    icon: 'ShoppingBag',
    permission: 'productos',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    path: '/configuracion',
    icon: 'Settings',
    permission: 'configuracion',
  },
];

/**
 * Obtiene los permisos de un rol específico
 * @param {string} role - El rol del usuario
 * @returns {string[]} Array de permisos
 */
export const getPermissionsByRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Verifica si un rol tiene acceso a una ruta específica
 * @param {string} role - El rol del usuario
 * @param {string} route - La ruta a verificar
 * @returns {boolean} true si tiene acceso, false si no
 */
export const hasAccessToRoute = (role, route) => {
  const permissions = getPermissionsByRole(role);
  
  // Buscar el permiso requerido para la ruta
  let requiredPermission = null;
  
  // Buscar coincidencia exacta primero
  if (ROUTE_PERMISSIONS[route]) {
    requiredPermission = ROUTE_PERMISSIONS[route];
  } else {
    // Buscar coincidencia con patrones dinámicos (para rutas como /paquetes/123)
    for (const [routePattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      // Convertir patrón [id] a regex
      const regexPattern = routePattern.replace(/\[id\]/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(route)) {
        requiredPermission = permission;
        break;
      }
    }
    
    // Si no se encontró con patrones, buscar coincidencia parcial
    if (!requiredPermission) {
      for (const [routePattern, permission] of Object.entries(ROUTE_PERMISSIONS)) {
        if (route.startsWith(routePattern.replace(/\/\[id\].*$/, ''))) {
          requiredPermission = permission;
          break;
        }
      }
    }
  }
  
  // Si no se encontró un permiso requerido, permitir acceso por defecto
  if (!requiredPermission) {
    return true;
  }
  
  return permissions.includes(requiredPermission);
};

/**
 * Filtra las opciones del menú según los permisos del rol
 * @param {string} role - El rol del usuario
 * @returns {object[]} Array de opciones de menú filtradas
 */
export const getMenuOptionsByRole = (role) => {
  const permissions = getPermissionsByRole(role);
  return MENU_OPTIONS.filter(option => permissions.includes(option.permission));
};

/**
 * Verifica si un usuario tiene un rol específico
 * @param {string} userRole - El rol del usuario
 * @param {string|string[]} allowedRoles - Rol o roles permitidos
 * @returns {boolean} true si el usuario tiene uno de los roles permitidos
 */
export const hasRole = (userRole, allowedRoles) => {
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }
  return userRole === allowedRoles;
};

/**
 * Verifica si un usuario es administrador
 * @param {string} role - El rol del usuario
 * @returns {boolean} true si es admin
 */
export const isAdmin = (role) => {
  return role === 'admin';
};

/**
 * Verifica si un usuario es médico o admin
 * @param {string} role - El rol del usuario
 * @returns {boolean} true si es médico o admin
 */
export const isMedicoOrAdmin = (role) => {
  return ['admin', 'medico'].includes(role);
};

/**
 * Obtiene la ruta de redirección por defecto según el rol
 * @param {string} role - El rol del usuario
 * @returns {string} Ruta de redirección
 */
export const getDefaultRouteByRole = (role) => {
  // Todos los roles tienen acceso al dashboard
  return '/dashboard';
};

/**
 * Obtiene información descriptiva de un rol
 * @param {string} role - El rol a describir
 * @returns {object} Objeto con label, color y descripción
 */
export const getRoleInfo = (role) => {
  const roleInfo = {
    admin: {
      label: 'Administrador',
      color: 'emerald',
      description: 'Acceso total al sistema',
      icon: '👑',
    },
    medico: {
      label: 'Médico',
      color: 'blue',
      description: 'Acceso a pacientes, consultas y asignación de paquetes',
      icon: '👨‍⚕️',
    },
    asistente: {
      label: 'Asistente',
      color: 'amber',
      description: 'Acceso limitado a clientes',
      icon: '👤',
    },
    invitado: {
      label: 'Invitado',
      color: 'gray',
      description: 'Solo visualización del dashboard',
      icon: '👁️',
    },
  };
  
  return roleInfo[role] || roleInfo.invitado;
};

/**
 * Valida si un rol es válido
 * @param {string} role - El rol a validar
 * @returns {boolean} true si es válido
 */
export const isValidRole = (role) => {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
};

/**
 * Obtiene todos los roles disponibles
 * @returns {string[]} Array con todos los roles
 */
export const getAllRoles = () => {
  return Object.keys(ROLE_PERMISSIONS);
};

/**
 * Verifica si un rol tiene un permiso específico
 * @param {string} role - El rol del usuario
 * @param {string} permission - El permiso a verificar
 * @returns {boolean} true si tiene el permiso
 */
export const hasPermission = (role, permission) => {
  const permissions = getPermissionsByRole(role);
  return permissions.includes(permission);
};
