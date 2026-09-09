import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSafeLocalStorage } from '../utils/safeStorage';

/**
 * Store para preferencias del Punto de Venta
 */
const usePosStore = create(
    persist(
        (set) => ({
            // Modos: 'grid' (normal), 'dense' (grid de 8/pequeño), 'table' (lista)
            viewMode: 'grid',
            setViewMode: (mode) => set({ viewMode: mode }),
        }),
        {
            name: 'pos-preferences-storage',
            storage: createJSONStorage(() => getSafeLocalStorage()),
        }
    )
);

export default usePosStore;
