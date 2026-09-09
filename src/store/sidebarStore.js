import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSidebarStore = create(
  persist(
    (set) => ({
      // Estado
      isCollapsed: false,

      // Acciones
      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      
      setCollapsed: (value) => set({ isCollapsed: value }),
    }),
    {
      name: 'sidebar-preferences', // Nombre de la clave en localStorage
      // Solo persistimos isCollapsed
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);

export default useSidebarStore;
