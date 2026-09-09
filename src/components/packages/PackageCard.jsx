import React from 'react';
import { useRouter } from 'next/router';
import { Edit, Trash, Package as PackageIcon, Users, Tag, DollarSign, Eye } from 'lucide-react';
import { formatPrice } from '../../../lib/firebase/packagesService';

const PackageCard = ({ 
  packageData, 
  onDelete, 
  assignedUsersCount = 0, 
  isDeleting = false,
  showUserCount = true,
  onViewUsers = null,
  onViewDetails = null
}) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/paquetes/editar/${packageData.id}`);
  };

  const handleDelete = () => {
    const confirmMessage = assignedUsersCount > 0
      ? `¿Estás seguro de eliminar el paquete "${packageData.name}"?\n\nEste paquete está asignado a ${assignedUsersCount} usuario(s) y será removido de todos ellos.\n\nEsta acción no se puede deshacer.`
      : `¿Estás seguro de que quieres eliminar el paquete "${packageData.name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (window.confirm(confirmMessage)) {
      onDelete(packageData.id);
    }
  };

  const getAudienceLabel = (audience) => {
    const labels = {
      clientes: 'Clientes',
      atletas: 'Atletas', 
      ambos: 'Ambos'
    };
    return labels[audience] || audience;
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      unico: 'Pago único',
      mensual: 'Mensual',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual'
    };
    return labels[type] || type;
  };

  const getTypeLabel = (type) => {
    const labels = {
      grupal: 'Grupal / Exos Training',
      personalizado: 'Personalizado',
      sesion: 'Terapia / Therapy'
    };
    return labels[type] || 'Grupal / Exos Training';
  };

  const getTypeColor = (type) => {
    const colors = {
      grupal: 'bg-blue-100 text-blue-700',
      personalizado: 'bg-purple-100 text-purple-700',
      sesion: 'bg-green-100 text-green-700'
    };
    return colors[type] || 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-2 border-cyan-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-cyan-300 relative overflow-hidden">
      {/* Área clickeable para ver detalles */}
      <div 
        onClick={() => onViewDetails?.(packageData)}
        className={`${onViewDetails ? 'cursor-pointer' : ''} transition-colors`}
      >
        {/* Imagen del paquete */}
        <div className="aspect-video w-full bg-gray-100 overflow-hidden relative group">
          {packageData.imageUrl ? (
            <img 
              src={packageData.imageUrl} 
              alt={packageData.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          {/* Placeholder cuando no hay imagen */}
          <div 
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 ${packageData.imageUrl ? 'hidden' : 'flex'}`}
          >
            <PackageIcon size={48} className="text-emerald-400" />
          </div>
          
          {/* Badge de "Ver detalles" en hover */}
          {onViewDetails && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2">
                <Eye size={18} className="text-emerald-600" />
                <span className="text-sm font-medium text-gray-900">Ver detalles</span>
              </div>
            </div>
          )}
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700 mb-2 leading-tight">
              {packageData.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {packageData.description}
            </p>
          </div>

          {/* Información principal */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(packageData.tipo)}`}>
                {getTypeLabel(packageData.tipo)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Público objetivo:</span>
              <span className="text-sm font-medium text-slate-700">
                {getAudienceLabel(packageData.targetAudience)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo de pago:</span>
              <span className="text-sm font-medium text-slate-700">
                {getPaymentTypeLabel(packageData.paymentType)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sesiones:</span>
              <span className="text-sm font-medium text-slate-700">
                {packageData.sessions || 1} {packageData.sessions === 1 ? 'sesión' : 'sesiones'}
              </span>
            </div>

            {packageData.validityDays && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vigencia:</span>
                <span className="text-sm font-medium text-slate-700">
                  {packageData.validityDays} {packageData.validityDays === 1 ? 'día' : 'días'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Precio:</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatPrice(packageData.price)}
              </span>
            </div>

            {/* Descuentos */}
            {packageData.discounts && packageData.discounts.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Descuentos disponibles:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {packageData.discounts.map((discount, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                    >
                      {discount.name} ({discount.percentage}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contador de usuarios asignados */}
            {showUserCount && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {assignedUsersCount} usuario{assignedUsersCount !== 1 ? 's' : ''} asignado{assignedUsersCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {assignedUsersCount > 0 && onViewUsers && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que se dispare el click del card
                      onViewUsers(packageData);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Ver lista
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción - fuera del área clickeable */}
      <div className="px-6 pb-6 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se dispare el click del card
            handleEdit();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-300 text-cyan-600 rounded-lg transition-colors duration-200"
        >
          <Edit className='text-white' size={18} />
          {/*<span className="text-sm font-medium">Editar</span>*/}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se dispare el click del card
            handleDelete();
          }}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-200 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash size={18} />
          <span className="text-sm font-medium">
            {isDeleting ? 'Eliminando...' : ''}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PackageCard;