import React from 'react';

const SkeletonProfesionalCard = () => (
  <div className="bg-gradient-to-r from-gray-50 to-teal-50 border-2 border-gray-200 rounded-xl p-6 animate-pulse">
    <div className="flex items-start space-x-4">
      {/* Avatar skeleton */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 bg-gray-300 rounded-xl"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    
    {/* Contact info skeleton */}
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

const SkeletonProfesionalTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div className="min-w-0">
          <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-28"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-28"></div>
    </td>
  </tr>
);

const DirectorioSkeleton = ({ viewMode = 'grid', count = 6 }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-gray-300 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-gray-200 p-3 rounded-xl animate-pulse">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, index) => (
            <SkeletonProfesionalCard key={index} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Profesional
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Especialidad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Puesto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Correo Electrónico
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Teléfono
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.from({ length: count }).map((_, index) => (
                <SkeletonProfesionalTableRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DirectorioSkeleton;