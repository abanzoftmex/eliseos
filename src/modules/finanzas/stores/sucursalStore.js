import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sucursalService } from '@finanzas/services/sucursalService';

export const GLOBAL_SUCURSAL_ID = 'global';

const useSucursalStore = create(
  persist(
    (set, get) => ({
      // Estado
      selectedSucursal: GLOBAL_SUCURSAL_ID,
      sucursales: [],
      loading: false,
      error: null,

      // Acciones
      setSelectedSucursal: (sucursalId) => {
        set({ selectedSucursal: sucursalId || GLOBAL_SUCURSAL_ID });
      },

      loadSucursales: async () => {
        try {
          set({ loading: true, error: null });
          const sucursalesData = await sucursalService.getAll();
          const list = sucursalesData || [];
          set((state) => {
            const exists = state.selectedSucursal === GLOBAL_SUCURSAL_ID || list.some((s) => s.id === state.selectedSucursal);
            return {
              sucursales: list,
              selectedSucursal: exists ? state.selectedSucursal : GLOBAL_SUCURSAL_ID,
              loading: false
            };
          });
        } catch (err) {
          console.error('Error cargando sucursales en store:', err);
          set({ error: err.message, loading: false });
        }
      },

      // Helper para obtener el objeto o nombre de la sucursal seleccionada
      getSelectedSucursalData: () => {
        const { selectedSucursal, sucursales } = get();
        if (selectedSucursal === GLOBAL_SUCURSAL_ID) {
          return { id: GLOBAL_SUCURSAL_ID, name: 'Global (Todas las sedes)' };
        }
        return sucursales.find((s) => s.id === selectedSucursal) || {
          id: selectedSucursal,
          name: 'Sucursal'
        };
      }
    }),
    {
      name: 'eliseos-finanzas-sucursal-preferences',
      partialize: (state) => ({ selectedSucursal: state.selectedSucursal }),
    }
  )
);

export default useSucursalStore;
