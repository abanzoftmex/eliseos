import { useEffect } from 'react';

export default function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // 1 hora

          // Escuchar mensajes del service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              // Recargar la página automáticamente cuando hay actualizaciones
              window.location.reload();
            }
          });

          // Si hay un service worker en espera, activarlo inmediatamente
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Escuchar cuando un nuevo service worker esté en espera
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay un nuevo service worker listo, activarlo
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((error) => {
          // Fallar silenciosamente sin mostrar errores al usuario
          console.debug('Service worker registration failed:', error);
        });
    }
  }, []);
}
