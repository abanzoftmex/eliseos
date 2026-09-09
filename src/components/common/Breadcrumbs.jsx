import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHome } from '@fortawesome/free-solid-svg-icons';
import { buildBreadcrumbs, isUserRoute, getUserIdFromQuery } from '../../utils/breadcrumbUtils';
import { getUserName } from '../../utils/userUtils';

const Breadcrumbs = ({ items = null }) => {
  const router = useRouter();
  const [userName, setUserName] = useState(null);
  const [isLoadingName, setIsLoadingName] = useState(false);

  // Cargar nombre del usuario si estamos en una ruta de usuario
  useEffect(() => {
    const fetchUserName = async () => {
      if (isUserRoute(router.pathname)) {
        const userId = getUserIdFromQuery(router.query);
        if (userId) {
          setIsLoadingName(true);
          try {
            const result = await getUserName(userId);
            setUserName(result.name);
          } catch (error) {
            console.error('Error loading user name:', error);
            setUserName('Cliente');
          } finally {
            setIsLoadingName(false);
          }
        }
      }
    };

    fetchUserName();
  }, [router.pathname, router.query]);

  // Si no se pasan items, generarlos automáticamente basado en la ruta
  const generateBreadcrumbs = () => {
    return buildBreadcrumbs(router.pathname, router.query, userName);
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <FontAwesomeIcon icon={faChevronRight} className="mx-2 text-gray-400 w-4 h-4" />
          )}
          
          {item.isLast ? (
            <span className="flex items-center font-medium text-gray-900">
              {item.icon && <item.icon size={16} className="mr-1" />}
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href}
              className="flex items-center hover:text-teal-600 transition-colors"
            >
              {item.icon && <item.icon size={16} className="mr-1" />}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;