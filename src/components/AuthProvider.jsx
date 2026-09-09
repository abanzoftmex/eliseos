import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../store/authStore';
import { hasAccessToRoute, getDefaultRouteByRole, isValidRole } from '../utils/permissionsUtils';

const AuthProvider = ({ children, pageProps = {} }) => {
  const router = useRouter();
  const { isAuthenticated, userRole, getRole, hasHydrated, logoutAndClearAll } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // Páginas que no requieren autenticación
  const publicRoutes = ['/', '/login'];

  // Portal de usuarios (autenticación separada por código/contraseña propia)
  const isUserPortalRoute = router.pathname === '/portal' || router.pathname.startsWith('/portal/');
  
  // Rutas públicas de fichas compartidas
  const isPublicFichaRoute = router.pathname.startsWith('/f/');
  
  // Obtener configuración de autenticación de la página
  const requireAuth = pageProps.requireAuth !== false && !publicRoutes.includes(router.pathname) && !isPublicFichaRoute && !isUserPortalRoute;
  const allowedRoles = pageProps.allowedRoles || null;

  useEffect(() => {
    if (!hasHydrated) return;

    const checkAuthentication = async () => {
      setIsChecking(true);

      // Si la ruta no requiere autenticación, permitir acceso
      if (!requireAuth) {
        setIsChecking(false);
        return;
      }

      const currentRole = getRole();
      const safeRedirect = (target) => {
        if (!target || target === router.pathname) {
          console.warn(`Redirección bloqueada para evitar bucle en ${router.pathname}`);
          router.replace('/');
          return;
        }

        router.replace(target);
      };

      try {
        // Verificar si está autenticado
        if (!isAuthenticated) {
          console.log('Usuario no autenticado, redirigiendo al login');
          safeRedirect('/');
          return;
        }

        if (!currentRole || !isValidRole(currentRole)) {
          console.warn('Sesion invalida: no hay rol valido en el store, limpiando autenticacion');
          logoutAndClearAll();
          safeRedirect('/');
          return;
        }

        // Verificar roles permitidos
        if (allowedRoles && !allowedRoles.includes(currentRole)) {
          console.log(`Rol ${currentRole} no permitido para esta ruta, redirigiendo`);
          const defaultRoute = getDefaultRouteByRole(currentRole);
          safeRedirect(defaultRoute);
          return;
        }

        // Verificar acceso a la ruta específica
        if (!hasAccessToRoute(currentRole, router.pathname)) {
          console.log(`Sin acceso a la ruta ${router.pathname}, redirigiendo`);
          const defaultRoute = getDefaultRouteByRole(currentRole);
          safeRedirect(defaultRoute);
          return;
        }

        // Si llegamos aquí, el usuario tiene acceso
        setIsChecking(false);

      } catch (error) {
        console.error('Error verificando autenticación:', error);
        safeRedirect('/');
      }
    };

    checkAuthentication();
  }, [hasHydrated, isAuthenticated, userRole, router.pathname, requireAuth, allowedRoles, getRole, logoutAndClearAll, router]);

  // Mostrar pantalla de carga durante la hidratación o verificación
  if (!hasHydrated || (requireAuth && isChecking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg 
            className="animate-spin h-10 w-10 mx-auto text-emerald-600" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600 mt-4">
            {!hasHydrated ? 'Cargando...' : 'Verificando permisos...'}
          </p>
        </div>
      </div>
    );
  }

  // Si no requiere autenticación o ya pasó todas las verificaciones, renderizar contenido
  return children;
};

export default AuthProvider;
