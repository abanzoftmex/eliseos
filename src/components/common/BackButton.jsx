import React from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

/**
 * Botón de navegación "Atrás" que usa el router para volver a la página anterior
 * Se muestra debajo de las breadcrumbs en las páginas internas
 */
const BackButton = ({ className = '' }) => {
  const router = useRouter();

  const handleGoBack = () => {
    // Si hay historial de navegación en el navegador, usar back()
    // De lo contrario, navegar a dashboard
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <button
      onClick={handleGoBack}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        text-sm font-medium text-gray-700 
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 hover:text-teal-600 hover:border-teal-300
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
        transition-all duration-200
        shadow-sm hover:shadow-md
        ${className}
      `}
      type="button"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
      <span>Volver</span>
    </button>
  );
};

export default BackButton;
