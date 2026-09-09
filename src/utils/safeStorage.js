/**
 * Safe localStorage accessor for Zustand stores in Next.js SSR
 */
export const getSafeLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
};
