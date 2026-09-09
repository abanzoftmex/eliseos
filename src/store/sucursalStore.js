import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const ALL_SUCURSALES_ID = 'todas';

const DEFAULT_SUCURSALES = [];

const useSucursalStore = create(
    persist(
        (set, get) => ({
            // Estado
            selectedSucursal: ALL_SUCURSALES_ID,
            sucursales: DEFAULT_SUCURSALES,

            // Acciones
            setSucursal: (sucursalId) => set({ selectedSucursal: sucursalId }),
            setSucursales: (newSucursales) => {
                const list = Array.isArray(newSucursales) ? newSucursales : [];
                set((state) => {
                    const exists = state.selectedSucursal === ALL_SUCURSALES_ID || list.some((s) => s.id === state.selectedSucursal);
                    return {
                        sucursales: list,
                        selectedSucursal: exists ? state.selectedSucursal : ALL_SUCURSALES_ID
                    };
                });
            },

            // Helper to get current sucursal object
            getSucursal: (id) => {
                if (id === ALL_SUCURSALES_ID) return { id: ALL_SUCURSALES_ID, name: 'Todas las Sucursales' };
                return get().sucursales.find(s => s.id === id);
            },
        }),
        {
            name: 'sucursal-preferences', // Nombre de la clave en localStorage
            partialize: (state) => ({ selectedSucursal: state.selectedSucursal }),
        }
    )
);

export default useSucursalStore;
