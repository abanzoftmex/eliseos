import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clearUserNameCache } from '../utils/userUtils';
import { deleteCookies } from '../utils/cookieUtils';
import { getSafeLocalStorage } from '../utils/safeStorage';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      currentUser: null,
      userRole: null,
      isAuthenticated: false,
      loading: false,
      hasHydrated: false,
      permissionsVersion: 6, // Incrementar esto cuando cambien los permisos

      // Configuración de permisos por rol
      rolePermissions: {
        admin: ['dashboard', 'directorio', 'clientes', 'paquetes', 'productos', 'clases', 'asignar-paquetes', 'configuracion', 'calendario', 'sucursales', 'finanzas', 'perfil'],
        coach: ['dashboard', 'directorio', 'clientes', 'productos', 'clases', 'asignar-paquetes', 'calendario', 'perfil'],
        staff: ['dashboard', 'directorio', 'clientes', 'productos', 'clases', 'asignar-paquetes', 'calendario', 'perfil'],
        medico: ['dashboard', 'directorio', 'clientes', 'productos', 'clases', 'asignar-paquetes', 'calendario', 'perfil'],
        personal: ['dashboard', 'clientes', 'productos', 'clases', 'calendario', 'perfil'],
        asistente: ['dashboard', 'clientes', 'productos', 'clases', 'calendario', 'perfil'],
        invitado: ['dashboard', 'perfil'],
      },

      // Establecer usuario actual
      setCurrentUser: (user, role) => {
        set({
          currentUser: user,
          userRole: role,
          isAuthenticated: !!user,
        });
      },

      // Cerrar sesión
      logout: () => {
        // Limpiar el estado
        set({
          currentUser: null,
          userRole: null,
          isAuthenticated: false,
        });

        // Limpiar localStorage del store de auth
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          // Limpiar cookie de autenticación
          deleteCookies(['auth-token', 'auth-role']);
        }

        // Limpiar cache de nombres de usuarios
        clearUserNameCache();
      },

      // Cerrar sesión y limpiar todas las preferencias de UI
      logoutAndClearAll: () => {
        // Limpiar el estado
        set({
          currentUser: null,
          userRole: null,
          isAuthenticated: false,
        });

        // Limpiar TODO el localStorage (auth, sidebar, view preferences)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('sidebar-preferences');
          localStorage.removeItem('dashboard-view-storage');
          // Limpiar cookie de autenticación
          deleteCookies(['auth-token', 'auth-role']);
        }

        // Limpiar cache de nombres de usuarios
        clearUserNameCache();
      },

      // Obtener permisos del rol actual
      getPermissions: () => {
        const { userRole, rolePermissions } = get();
        return rolePermissions[userRole] || [];
      },

      // Verificar si el usuario tiene acceso a una ruta
      hasAccess: (route) => {
        const permissions = get().getPermissions();
        return permissions.includes(route);
      },

      // Verificar si el usuario es admin
      isAdmin: () => {
        return get().userRole === 'admin';
      },

      // Verificar si el usuario es médico
      isMedico: () => {
        return get().userRole === 'medico';
      },

      // Obtener rol actual
      getRole: () => {
        return get().userRole;
      },

      // Establecer estado de carga
      setLoading: (loading) => {
        set({ loading });
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: 'auth-storage', // nombre de la clave en localStorage
      storage: createJSONStorage(() => getSafeLocalStorage()),
      version: 4, // Versión del storage - incrementar cuando cambien los permisos
      partialize: (state) => ({
        currentUser: state.currentUser,
        userRole: state.userRole,
        isAuthenticated: state.isAuthenticated,
        permissionsVersion: state.permissionsVersion,
      }),
      migrate: (persistedState, version) => {
        // Si la versión del storage es antigua, limpiar y usar valores por defecto
        if (version < 4) {
          console.log('Actualizando permisos a la versión 4 (incluyendo productos)...');
          return {
            currentUser: persistedState.currentUser,
            userRole: persistedState.userRole,
            isAuthenticated: persistedState.isAuthenticated,
            loading: false,
            hasHydrated: true,
            permissionsVersion: 4,
            rolePermissions: {
              admin: ['dashboard', 'directorio', 'clientes', 'paquetes', 'productos', 'clases', 'asignar-paquetes', 'configuracion', 'calendario', 'sucursales'],
              medico: ['dashboard', 'directorio', 'clientes', 'productos', 'clases', 'asignar-paquetes', 'calendario'],
              asistente: ['dashboard', 'clientes', 'productos', 'clases', 'calendario'],
              invitado: ['dashboard'],
            },
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error hidratando auth-storage:', error);
        }

        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
