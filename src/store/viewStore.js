import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSafeLocalStorage } from '../utils/safeStorage';

/**
 * Store global de Zustand para gestionar la vista de los módulos
 * Persistido en localStorage para mantener la preferencia del usuario
 * 
 * Estados posibles:
 * - 'grid': Vista de tarjetas (cards)
 * - 'list': Vista de tabla HTML completa
 */
const useViewStore = create(
  persist(
    (set) => ({
      viewMode: 'grid', // Valor por defecto: vista de cards
      
      // Cambiar el modo de vista
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Alternar entre grid y list
      toggleViewMode: () => set((state) => ({
        viewMode: state.viewMode === 'grid' ? 'list' : 'grid'
      })),
    }),
    {
      name: 'dashboard-view-storage', // Nombre de la clave en localStorage
      storage: createJSONStorage(() => getSafeLocalStorage()), // Usar localStorage seguro para SSR
    }
  )
);

export default useViewStore;
