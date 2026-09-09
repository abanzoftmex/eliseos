import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faBox, 
  faCalendar, 
  faCreditCard, 
  faTrash, 
  faPlus, 
  faGrip, 
  faList, 
  faEye, 
  faClock,
  faMapMarkerAlt 
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../../../../components/layout/Layout';
import AssignedPackageCard from '../../../../components/packages/AssignedPackageCard';
import PackageDetailPanel from '../../../../components/packages/PackageDetailPanel';
import useSucursalStore from '../../../../store/sucursalStore';
import { assignPackageToUser, removePackageFromUser, getPackages, formatPrice } from '../../../../../lib/firebase/packagesService';
import { calcularDiasRestantes, formatearDiasRestantes } from '../../../../utils/packageUtils';

function UserPackagesPage({ initialUser, initialUserType, initialUserPackages, initialAvailablePackages }) {
  const router = useRouter();
  const { id } = router.query;
  
  const [user] = useState(initialUser);
  const [userType] = useState(initialUserType);
  const [userPackages, setUserPackages] = useState(initialUserPackages);
  const [availablePackages] = useState(initialAvailablePackages);
  const [assigningPackage, setAssigningPackage] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [fechaAsignacion, setFechaAsignacion] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPackageData, setSelectedPackageData] = useState(null);
  const [selectedSucursalAsignacion, setSelectedSucursalAsignacion] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isTableView, setIsTableView] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPackageForPanel, setSelectedPackageForPanel] = useState(null);

  // Obtener sucursales del store
  const sucursales = useSucursalStore(state => state.sucursales);

  // Helper para parsear el descuento seleccionado
  const getSelectedDiscountData = () => {
    if (!selectedDiscount) return null;
    try {
      return JSON.parse(selectedDiscount);
    } catch (e) {
      return null;
    }
  };

  // Obtener las sucursales del usuario como array
  const userSucursales = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.sucursales) 
      ? user.sucursales 
      : (user.sucursal ? [user.sucursal] : []);
  }, [user]);

  // Filtrar paquetes disponibles según las sucursales del usuario
  const filteredPackages = useMemo(() => {
    if (!availablePackages || userSucursales.length === 0) return availablePackages || [];
    
    return availablePackages.filter(pkg => {
      // Si el paquete no tiene sucursales definidas (o está vacío), es global
      if (!pkg.sucursales || pkg.sucursales.length === 0) {
        return true;
      }
      // Si el paquete tiene sucursales, verificar que al menos una coincida con las del usuario
      return pkg.sucursales.some(sucId => userSucursales.includes(sucId));
    });
  }, [availablePackages, userSucursales]);

  // Determinar las sucursales válidas para la asignación del paquete seleccionado
  const validSucursalesForAssignment = useMemo(() => {
    if (!selectedPackageData) return [];
    
    // Si el paquete es global (sin sucursales), usar las sucursales del usuario
    if (!selectedPackageData.sucursales || selectedPackageData.sucursales.length === 0) {
      return userSucursales;
    }
    
    // Si el paquete tiene sucursales específicas, filtrar las que coincidan con las del usuario
    return selectedPackageData.sucursales.filter(sucId => userSucursales.includes(sucId));
  }, [selectedPackageData, userSucursales]);

  // Determinar si necesitamos mostrar el selector de sucursal
  const needsSucursalSelector = useMemo(() => {
    return validSucursalesForAssignment.length > 1;
  }, [validSucursalesForAssignment]);

  // Helper para obtener el nombre de una sucursal
  const getSucursalName = useCallback((sucursalId) => {
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal ? sucursal.name : sucursalId;
  }, [sucursales]);

  const loadUserPackages = useCallback(async () => {
    try {
      const response = await fetch(`/api/clientes/${id}/paquetes`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.packages)) {
        setUserPackages(result.packages);
      } else {
        setUserPackages([]);
        if (!result.success) {
          setMessage({ type: 'error', text: result.error || 'Error al cargar paquetes' });
        }
      }
    } catch (error) {
      console.error('Error loading user packages:', error);
      setUserPackages([]);
      setMessage({ type: 'error', text: 'Error al cargar paquetes del usuario' });
    }
  }, [id]);

  const handlePackageSelection = (packageId) => {
    setSelectedPackage(packageId);
    setSelectedDiscount(''); // Reset discount when package changes
    setSelectedSucursalAsignacion(''); // Reset sucursal when package changes
    
    // Find selected package data
    const packageData = availablePackages.find(pkg => pkg.id === packageId);
    setSelectedPackageData(packageData || null);

    // Auto-seleccionar sucursal si solo hay una válida
    if (packageData) {
      let validSucursales;
      if (!packageData.sucursales || packageData.sucursales.length === 0) {
        validSucursales = userSucursales;
      } else {
        validSucursales = packageData.sucursales.filter(sucId => userSucursales.includes(sucId));
      }
      
      if (validSucursales.length === 1) {
        setSelectedSucursalAsignacion(validSucursales[0]);
      }
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedPackage) {
      setMessage({ type: 'error', text: 'Selecciona un paquete' });
      return;
    }

    if (!fechaAsignacion) {
      setMessage({ type: 'error', text: 'La fecha de asignación es requerida' });
      return;
    }

    // Validar sucursal si hay múltiples opciones
    if (needsSucursalSelector && !selectedSucursalAsignacion) {
      setMessage({ type: 'error', text: 'Selecciona la sucursal donde se asignará el paquete' });
      return;
    }

    setAssigningPackage(true);
    
    // Determinar la sucursal a usar
    const sucursalParaAsignar = selectedSucursalAsignacion || validSucursalesForAssignment[0] || userSucursales[0] || 'valquirico';
    
    try {
      const discountData = getSelectedDiscountData();
      const result = await assignPackageToUser(
        id, 
        selectedPackage, 
        discountData || null,
        fechaAsignacion, // Pasar la fecha personalizada
        sucursalParaAsignar // Pasar la sucursal de asignación
      );
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Paquete asignado exitosamente' });
        setShowAssignModal(false);
        setSelectedPackage('');
        setSelectedDiscount('');
        setFechaAsignacion(new Date().toISOString().split('T')[0]);
        setSelectedPackageData(null);
        setSelectedSucursalAsignacion('');
        await loadUserPackages(); // Recargar lista
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error assigning package:', error);
      setMessage({ type: 'error', text: 'Error al asignar paquete' });
    } finally {
      setAssigningPackage(false);
    }
  };

  const handleRemovePackage = async (packageId) => {
    if (!confirm('¿Estás seguro de que quieres remover este paquete?')) return;

    try {
      const result = await removePackageFromUser(id, packageId);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Paquete removido exitosamente' });
        await loadUserPackages(); // Recargar lista
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error removing package:', error);
      setMessage({ type: 'error', text: 'Error al remover paquete' });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    // Si es un Timestamp de Firebase
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Si es una cadena ISO o un Date
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Fecha no disponible';
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Funciones para manejar el panel de detalles
  const handleViewPackageDetails = (pkg) => {
    setSelectedPackageForPanel(pkg);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    // Delay para limpiar el paquete seleccionado después de la animación de cierre
    setTimeout(() => {
      setSelectedPackageForPanel(null);
    }, 300);
  };

  if (!user) {
    return (
  
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <FontAwesomeIcon icon={faUser} className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-700 mb-2">Usuario no encontrado</h1>
            <p className="text-slate-500 mb-4">El usuario solicitado no existe</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
     
    );
  }

  return (
    <>
      {/* Mensaje de estado */}
      {message.text && (
        <div className={`mx-6 mt-6 p-4 rounded-xl shadow-sm border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-3 ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header con información del usuario - Diseño moderno y atractivo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Contenido del perfil - Layout horizontal moderno */}
          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
              {/* Sección izquierda: Avatar, nombre y badge */}
              <div className="flex items-center gap-5">
                {/* Avatar del usuario con badge superpuesto */}
                <div className="relative flex-shrink-0">
                  {user.foto ? (
                    <img 
                      src={user.foto} 
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-3xl font-bold shadow-md border-4 border-gray-50">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Badge de tipo de usuario superpuesto */}
                  <span className={`absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border-2 border-white ${
                    user.type === 'atleta' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-cyan-600 text-white'
                  }`}>
                    {user.type === 'cliente' ? 'Cliente' : 'Atleta'}
                  </span>
                </div>
                
                {/* Información principal */}
                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {user.name}
                  </h1>
                  <p className="text-sm text-gray-600 font-medium mt-0.5">{user.ocupacion}</p>
                </div>
              </div>
              
              {/* Sección derecha: Info de contacto y botón */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Info cards con diseño mejorado */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Email */}
                  <div className="bg-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-gray-200 shadow-sm hover:shadow transition-shadow">
                    <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 font-medium truncate max-w-[150px]">{user.email}</span>
                  </div>
                  
                  {/* Teléfono */}
                  <div className="bg-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-gray-200 shadow-sm hover:shadow transition-shadow">
                    <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{user.telefono}</span>
                  </div>
                </div>
                
                {/* Botón Editar Perfil con mejor diseño */}
                <button className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow">
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Paquetes Asignados - Diseño mejorado con toggle de vista */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Encabezado con ViewToggle */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faBox} className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Paquetes / Planes Asignados
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {userPackages.length} {userPackages.length === 1 ? 'paquete/plan activo' : 'paquetes / planes activos'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Toggle de vista */}
                {userPackages.length > 0 && (
                  <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setIsTableView(false)}
                      className={`p-2 rounded-md transition-all ${
                        !isTableView 
                          ? 'bg-white text-cyan-600 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Vista de tarjetas"
                    >
                      <FontAwesomeIcon icon={faGrip} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsTableView(true)}
                      className={`p-2 rounded-md transition-all ${
                        isTableView 
                          ? 'bg-white text-cyan-600 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title="Vista de tabla"
                    >
                      <FontAwesomeIcon icon={faList} className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 py-2 font-semibold shadow-sm transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                  Asignar Paquete / Plan
                </button>
              </div>
            </div>
          </div>
          
          {/* Contenido de paquetes */}
          <div className="p-6">
            {!Array.isArray(userPackages) || userPackages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faBox} className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No hay paquetes / planes asignados
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm">
                  Este usuario aún no tiene ningún paquete/plan de servicios asignado. Haz clic en &quot;Asignar Paquete/Plan&quot; para comenzar.
                </p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-5 py-2.5 font-semibold shadow-sm transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                  Asignar Primer Paquete
                </button>
              </div>
            ) : isTableView ? (
              // Vista de Tabla
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Nombre del Paquete
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Precio
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha Asignado
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Días Restantes
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {userPackages.map((pkg) => {
                      const diasRestantes = calcularDiasRestantes(pkg.fechaAsignacion);
                      const estadoDias = formatearDiasRestantes(diasRestantes);
                      
                      return (
                      <tr key={pkg.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faBox} className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{pkg.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {formatPrice(pkg.precioFinal || pkg.precioOriginal)}
                            </span>
                            {pkg.descuento && (
                              <span className="text-xs text-cyan-600 font-medium">
                                {(() => {
                                  const pct = pkg.descuentoPorcentaje ?? (
                                    pkg.precioOriginal && pkg.precioFinal && pkg.precioOriginal > pkg.precioFinal
                                      ? Math.round((1 - pkg.precioFinal / pkg.precioOriginal) * 10000) / 100
                                      : null
                                  );
                                  if (pct !== null && !String(pkg.descuento).includes('%')) {
                                    return `${pkg.descuento} (${pct}%) descuento aplicado`;
                                  }
                                  return `${pkg.descuento} descuento aplicado`;
                                })()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
                            {pkg.tipoUsuario || 'Estándar'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(pkg.fechaAsignacion)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-gray-400" />
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${estadoDias.clase}`}>
                              {estadoDias.icono} {estadoDias.texto}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewPackageDetails(pkg)}
                              className="inline-flex items-center px-3 py-1.5 text-cyan-600 hover:text-white hover:bg-cyan-600 border border-cyan-600 rounded-lg text-xs font-medium transition-all duration-200"
                              title="Ver detalles"
                            >
                              <FontAwesomeIcon icon={faEye} className="w-3 h-3 mr-1" />
                              Ver
                            </button>
                            <button
                              onClick={() => handleRemovePackage(pkg.id)}
                              className="inline-flex items-center px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg text-xs font-medium transition-all duration-200"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3 mr-1" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // Vista de Cards
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {userPackages.map((pkg, index) => (
                  <div 
                    key={pkg.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <AssignedPackageCard
                      nombre={pkg.nombre}
                      precio={pkg.precioFinal || pkg.precioOriginal}
                      precioOriginal={pkg.precioOriginal}
                      descuento={pkg.descuento}
                      descuentoPorcentaje={pkg.descuentoPorcentaje}
                      fecha={pkg.fechaAsignacion}
                      onDelete={handleRemovePackage}
                      packageId={pkg.id}
                      onClick={() => handleViewPackageDetails(pkg)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para asignar paquete - Diseño mejorado */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
            {/* Header del modal */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faPlus} className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Asignar Paquete / Plan
                    </h3>
                    <p className="text-gray-600 text-sm">Selecciona un paquete / plan y descuento</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6 space-y-5">
              {/* Info de sucursales del usuario */}
              {userSucursales.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                    Sucursales del usuario: {userSucursales.map(s => getSucursalName(s)).join(', ')}
                  </p>
                </div>
              )}

              {/* Selección de paquete */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faBox} className="w-4 h-4 text-cyan-600" />
                  Paquete / Plan
                </label>
                <select
                  value={selectedPackage}
                  onChange={(e) => handlePackageSelection(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-gray-50 hover:bg-white font-medium"
                >
                  <option value="">Selecciona un paquete / plan...</option>
                  {filteredPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatPrice(pkg.price)}
                      {pkg.sucursales && pkg.sucursales.length > 0 
                        ? ` (${pkg.sucursales.map(s => getSucursalName(s)).join(', ')})` 
                        : ' (Global)'}
                    </option>
                  ))}
                </select>
                {filteredPackages.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    No hay paquetes disponibles para las sucursales de este usuario
                  </p>
                )}
              </div>

              {/* Selección de sucursal (solo si hay múltiples opciones) */}
              {needsSucursalSelector && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-cyan-600" />
                    Sucursal de asignación *
                  </label>
                  <select
                    value={selectedSucursalAsignacion}
                    onChange={(e) => setSelectedSucursalAsignacion(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-gray-50 hover:bg-white font-medium"
                  >
                    <option value="">Selecciona una sucursal...</option>
                    {validSucursalesForAssignment.map((sucId) => (
                      <option key={sucId} value={sucId}>
                        {getSucursalName(sucId)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    El paquete está disponible en múltiples sucursales. Selecciona dónde se registrará esta asignación.
                  </p>
                </div>
              )}

              {/* Selección de descuento */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 text-cyan-600" />
                  Descuento (opcional)
                </label>
                <select
                  value={selectedDiscount}
                  onChange={(e) => setSelectedDiscount(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-gray-50 hover:bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedPackageData}
                >
                  <option value="">Sin descuento</option>
                  {selectedPackageData?.discounts?.map((discount, index) => (
                    <option key={index} value={JSON.stringify({ name: discount.name, percentage: discount.percentage })}>
                      {discount.name} - {discount.percentage}% de descuento
                    </option>
                  ))}
                </select>
                {!selectedPackageData && (
                  <p className="text-xs text-gray-500 mt-2">Selecciona un paquete primero</p>
                )}
              </div>

              {/* Preview del precio */}
              {selectedPackageData && (
                <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Precio final:</span>
                    <div className="text-right">
                      {selectedDiscount && selectedPackageData.discounts && (
                        <span className="text-sm text-gray-500 line-through block">
                          {formatPrice(selectedPackageData.price)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-cyan-600">
                        {(() => {
                          const discountData = getSelectedDiscountData();
                          return selectedDiscount && discountData
                            ? formatPrice(
                                selectedPackageData.price *
                                (1 - discountData.percentage / 100)
                              )
                            : formatPrice(selectedPackageData.price);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo de Fecha de Asignación */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-cyan-600" />
                  Fecha de Asignación
                </label>
                <input
                  type="date"
                  value={fechaAsignacion}
                  onChange={(e) => setFechaAsignacion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all bg-gray-50 hover:bg-white font-medium"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Selecciona una fecha anterior si estás registrando un paquete asignado previamente
                </p>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPackage('');
                  setSelectedDiscount('');
                  setFechaAsignacion(new Date().toISOString().split('T')[0]);
                  setSelectedPackageData(null);
                  setSelectedSucursalAsignacion('');
                }}
                className="flex-1 px-5 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignPackage}
                disabled={assigningPackage || !selectedPackage || (needsSucursalSelector && !selectedSucursalAsignacion)}
                className="flex-1 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {assigningPackage ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Asignando...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} className="w-5 h-5" />
                    Asignar Paquete / Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Panel de Detalles del Paquete */}
      <PackageDetailPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        packageData={selectedPackageForPanel}
        userId={id}
        onPackageUpdated={loadUserPackages}
      />
    </>
  );
}

// Proteger la ruta - requiere permiso 'asignar-paquetes'
// Roles permitidos: admin, medico
export default UserPackagesPage;

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    // Obtener el host del request
    const host = context.req.headers.host;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    // Llamar a la API para obtener datos del usuario y sus paquetes
    const userResponse = await fetch(`${baseUrl}/api/clientes/${id}/paquetes`);
    
    if (!userResponse.ok) {
      return {
        notFound: true,
      };
    }

    const userData = await userResponse.json();

    if (!userData.success || !userData.user) {
      return {
        notFound: true,
      };
    }

    // Obtener todos los paquetes disponibles
    const packagesResponse = await fetch(`${baseUrl}/api/paquetes`);
    let availablePackages = [];

    if (packagesResponse.ok) {
      const packagesData = await packagesResponse.json();
      availablePackages = packagesData.packages || [];
    }

    return {
      props: {
        initialUser: userData.user,
        initialUserType: userData.userType,
        initialUserPackages: userData.packages || [],
        initialAvailablePackages: availablePackages,
      },
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
}