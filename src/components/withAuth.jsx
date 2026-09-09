import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../store/authStore';
import { hasAccessToRoute, getDefaultRouteByRole } from '../utils/permissionsUtils';

/**
 * HOC (Higher Order Component) para proteger rutas según el rol del usuario
 * Redirige al dashboard si el usuario no tiene permisos para acceder a la ruta
 * 
 * Uso:
 * export default withAuth(MiComponente);
 * 
 * O con roles específicos:
 * export default withAuth(MiComponente, ['admin', 'medico']);
 */
export function withAuth(Component, allowedRoles = null) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const { isAuthenticated, userRole, getRole } = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
      // Marcar como hidratado una vez que el componente se monta
      setIsHydrated(true);
    }, []);

    useEffect(() => {
      // Solo ejecutar verificaciones después de la hidratación
      if (!isHydrated) return;

      // Dar tiempo para que se hidrate el estado desde localStorage
      const checkAuth = setTimeout(() => {
        const currentRole = getRole();
        
        // Si no está autenticado, redirigir al login
        if (!isAuthenticated) {
          router.push('/');
          return;
        }

        // Si se especificaron roles permitidos, verificar que el usuario tenga uno de ellos
        if (allowedRoles && !allowedRoles.includes(currentRole)) {
          const defaultRoute = getDefaultRouteByRole(currentRole);
          router.push(defaultRoute);
          return;
        }

        // Verificar si tiene acceso a la ruta actual
        if (!hasAccessToRoute(currentRole, router.pathname)) {
          const defaultRoute = getDefaultRouteByRole(currentRole);
          router.push(defaultRoute);
          return;
        }
      }, 100); // Pequeño delay para permitir la hidratación

      return () => clearTimeout(checkAuth);
    }, [isAuthenticated, userRole, router.pathname, isHydrated]);

    // Mostrar loading durante la hidratación
    if (!isHydrated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 mt-4">Cargando...</p>
          </div>
        </div>
      );
    }

    // Si no está autenticado después de la hidratación, no renderizar nada (se redirigirá)
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 mt-4">Verificando acceso...</p>
          </div>
        </div>
      );
    }

    const currentRole = getRole();
    if (allowedRoles && !allowedRoles.includes(currentRole)) {
      return null;
    }

    if (!hasAccessToRoute(currentRole, router.pathname)) {
      return null;
    }

    // Si todo está bien, renderizar el componente
    return <Component {...props} />;
  };
}

/**
 * Hook personalizado para verificar permisos dentro de componentes
 * 
 * Uso:
 * const { hasAccess, isAdmin, canEdit } = usePermissions();
 * 
 * if (!hasAccess('configuracion')) {
 *   return <NoAccess />;
 * }
 */
export function usePermissions() {
  const { userRole, hasAccess, isAdmin, getPermissions } = useAuthStore();
  const router = useRouter();

  const checkAccess = (permission) => {
    return hasAccess(permission);
  };

  const checkRole = (roles) => {
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  };

  const redirectIfNoAccess = (permission, redirectTo = '/dashboard') => {
    if (!hasAccess(permission)) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  return {
    userRole,
    hasAccess: checkAccess,
    isAdmin: isAdmin(),
    checkRole,
    redirectIfNoAccess,
    permissions: getPermissions(),
  };
}

/**
 * Componente para renderizar contenido solo si el usuario tiene el rol adecuado
 * 
 * Uso:
 * <RequireRole roles={['admin', 'medico']}>
 *   <ContenidoProtegido />
 * </RequireRole>
 */
export function RequireRole({ roles, children, fallback = null }) {
  const { userRole } = useAuthStore();

  const hasRequiredRole = Array.isArray(roles) 
    ? roles.includes(userRole)
    : userRole === roles;

  if (!hasRequiredRole) {
    return fallback;
  }

  return children;
}

/**
 * Componente para renderizar contenido solo si el usuario tiene el permiso necesario
 * 
 * Uso:
 * <RequirePermission permission="configuracion">
 *   <EnlaceConfiguracion />
 * </RequirePermission>
 */
export function RequirePermission({ permission, children, fallback = null }) {
  const { hasAccess } = useAuthStore();

  if (!hasAccess(permission)) {
    return fallback;
  }

  return children;
}

export default withAuth;
