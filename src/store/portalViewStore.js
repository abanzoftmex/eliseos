import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSafeLocalStorage } from '../utils/safeStorage';

const usePortalViewStore = create(
  persist(
    (set) => ({
      // Vista principal: 'cards' | 'calendar'
      miScienceView: 'calendar',
      setMiScienceView: (view) => set({ miScienceView: view }),

      // Tab de sucursal activa (índice)
      miScienceActiveTab: 0,
      setMiScienceActiveTab: (tab) => set({ miScienceActiveTab: tab }),

      // Modo calendario: 'week' | 'month'
      miScienceCalendarMode: 'week',
      setMiScienceCalendarMode: (mode) => set({ miScienceCalendarMode: mode }),

      // Semana actual (ISO string del lunes de la semana)
      miScienceWeekStart: null,
      setMiScienceWeekStart: (iso) => set({ miScienceWeekStart: iso }),

      // Mes actual: { year, month } (month 0-indexed)
      miScienceMonth: null,
      setMiScienceMonth: (year, month) => set({ miScienceMonth: { year, month } }),
    }),
    {
      name: 'portal-view-storage',
      storage: createJSONStorage(() => getSafeLocalStorage()),
    }
  )
);

export default usePortalViewStore;
