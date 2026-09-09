import toast from 'react-hot-toast';

/**
 * Utilidades para mostrar notificaciones toast consistentes en toda la aplicación
 */

export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    ...options,
  });
};

export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    ...options,
  });
};

export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, options);
};

export const showInfoToast = (message, options = {}) => {
  return toast(message, {
    icon: 'ℹ️',
    duration: 4000,
    ...options,
  });
};

export const showWarningToast = (message, options = {}) => {
  return toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#fff3cd',
      color: '#856404',
    },
    ...options,
  });
};

/**
 * Actualiza un toast existente
 * @param {string} toastId - ID del toast a actualizar
 * @param {string} message - Nuevo mensaje
 * @param {string} type - Tipo: 'success', 'error', 'loading'
 * @param {object} options - Opciones adicionales
 */
export const updateToast = (toastId, message, type = 'success', options = {}) => {
  if (type === 'success') {
    return toast.success(message, { id: toastId, ...options });
  } else if (type === 'error') {
    return toast.error(message, { id: toastId, ...options });
  } else if (type === 'loading') {
    return toast.loading(message, { id: toastId, ...options });
  }
  return toast(message, { id: toastId, ...options });
};

/**
 * Cierra un toast específico
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Cierra todos los toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Toast personalizado con promesa
 * Muestra loading, y luego success o error según el resultado
 */
export const toastPromise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || 'Cargando...',
    success: messages.success || '¡Éxito!',
    error: messages.error || 'Ocurrió un error',
  });
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  loading: showLoadingToast,
  info: showInfoToast,
  warning: showWarningToast,
  update: updateToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  promise: toastPromise,
};
