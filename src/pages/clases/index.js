import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faClock,
  faFilter,
  faMagnifyingGlass,
  faNoteSticky,
  faEye,
  faTrash,
  faEdit,
  faCopy,
  faUser,
  faUsers,
  faCalendar,
  faMapMarkerAlt,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';

import ViewToggle from '../../components/common/ViewToggle';
import useViewStore from '../../store/viewStore';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';
import DayActivitiesSidePanel from '../../components/classes/DayActivitiesSidePanel';
import { 
  getClasses, 
  deleteClass,
  cloneClass,
  CLASS_TYPES,
  CLASS_TYPE_LABELS,
  CLASS_STATUS,
  CLASS_STATUS_LABELS,
  formatPrice,
  formatDateTime,
  formatRecurrentSchedule,
} from '../../../lib/firebase/classesService';

function ClasesPage() {
    // Formatea el nombre del instructor: Nombre ApellidoP. ApellidoM.
    const formatInstructorName = (instructor) => {
      if (!instructor) return 'No asignado';
      // Separar por espacios
      const parts = instructor.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return `${parts[0]} ${parts[1][0]}.`;
      // Si hay más de 2 partes, asumimos: Nombre ApellidoP ApellidoM
      return `${parts[0]} ${parts[1][0]}. ${parts[2][0]}.`;
    };
  const router = useRouter();
  const { viewMode } = useViewStore();
  const selectedSucursal = useSucursalStore((state) => state.selectedSucursal);
  const sucursales = useSucursalStore((state) => state.sucursales);

  // Función para obtener el nombre de la sucursal
  const getSucursalName = (sucursalId) => {
    if (!sucursalId) return 'Sin sucursal';
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal ? sucursal.name : sucursalId;
  };

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingClasses, setDeletingClasses] = useState(new Set());
  const [cloningClasses, setCloningClasses] = useState(new Set());
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    tipo: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Estados para el side panel de detalles
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState(null);

  // Estados para el side panel de actividades del día
  const [showDayActivitiesPanel, setShowDayActivitiesPanel] = useState(false);
  const [selectedDateForActivities, setSelectedDateForActivities] = useState(null);

  // Función auxiliar para formatear días y hora en formato 12h
  const formatSchedule = (classData) => {
    // Modo recurrente
    if (classData.modoProgramacion === 'recurrente' && classData.diasSemana && classData.diasSemana.length > 0) {
      const diasMap = {
        'lunes': 'Lun',
        'martes': 'Mar',
        'miercoles': 'Mié',
        'jueves': 'Jue',
        'viernes': 'Vie',
        'sabado': 'Sáb',
        'domingo': 'Dom'
      };
      const diasAbrev = classData.diasSemana
        .map(dia => diasMap[dia] || dia)
        .join(', ');
      // Formatear hora a 12h
      let hora = classData.horaInicio || '__:__';
      if (hora && hora !== '__:__') {
        const [h, m] = hora.split(':');
        let hour = parseInt(h, 10);
        const min = m.padStart(2, '0');
        const ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12;
        if (hour === 0) hour = 12;
        hora = `${hour}:${min}${ampm}`;
      }
      return `${diasAbrev} · ${hora}`;
    }
    
    // Modo específico
    if (classData.modoProgramacion === 'especifica' && classData.fechasEspecificas && classData.fechasEspecificas.length > 0) {
      if (classData.fechasEspecificas.length === 1) {
        const fecha = new Date(classData.fechasEspecificas[0].fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        const hora = classData.fechasEspecificas[0].hora;
        // Formatear hora a 12h
        if (hora) {
          const [h, m] = hora.split(':');
          let hour = parseInt(h, 10);
          const min = m.padStart(2, '0');
          const ampm = hour >= 12 ? 'pm' : 'am';
          hour = hour % 12;
          if (hour === 0) hour = 12;
          return `${fechaStr} · ${hour}:${min}${ampm}`;
        }
        return fechaStr;
      }
      return `${classData.fechasEspecificas.length} fechas programadas`;
    }
    
    // Compatibilidad con formato antiguo
    if (classData.diasSemana && classData.diasSemana.length > 0) {
      const diasMap = {
        'lunes': 'Lun',
        'martes': 'Mar',
        'miercoles': 'Mié',
        'jueves': 'Jue',
        'viernes': 'Vie',
        'sabado': 'Sáb',
        'domingo': 'Dom'
      };
      const diasAbrev = classData.diasSemana
        .map(dia => diasMap[dia] || dia)
        .join(', ');
      let hora = classData.horaInicio || '__:__';
      if (hora && hora !== '__:__') {
        const [h, m] = hora.split(':');
        let hour = parseInt(h, 10);
        const min = m.padStart(2, '0');
        const ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12;
        if (hour === 0) hour = 12;
        hora = `${hour}:${min}${ampm}`;
      }
      return `${diasAbrev} · ${hora}`;
    }
    
    return 'Sin horario definido';
  };

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClasses(filters);
      if (result.success) {
        setClasses(result.classes);
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      showMessage('error', 'Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleDeleteClass = async (classId) => {
    setDeletingClasses(prev => new Set([...prev, classId]));
    
    try {
      const result = await deleteClass(classId);
      if (result.success) {
        setClasses(prev => prev.filter(cls => cls.id !== classId));
        showMessage('success', 'Clase eliminada exitosamente');
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      showMessage('error', 'Error al eliminar la clase');
    } finally {
      setDeletingClasses(prev => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });
    }
  };

  const handleCloneClass = async (classId) => {
    setCloningClasses(prev => new Set([...prev, classId]));
    
    try {
      const result = await cloneClass(classId);
      if (result.success) {
        // Recargar la lista de clases para mostrar la nueva clase clonada
        await loadClasses();
        showMessage('success', 'Clase clonada exitosamente');
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      console.error('Error cloning class:', error);
      showMessage('error', 'Error al clonar la clase');
    } finally {
      setCloningClasses(prev => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });
    }
  };

  const handleViewDetails = (classData) => {
    setSelectedClassForDetail(classData);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedClassForDetail(null);
  };

  const handleShowDayActivities = (clase) => {
    // Determinar la fecha de la clase
    let classDate;
    
    if (clase.fechasEspecificas && clase.fechasEspecificas.length > 0) {
      // Para clases con fechas específicas, usar la primera fecha
      classDate = new Date(clase.fechasEspecificas[0].fecha + 'T00:00:00');
    } else if (clase.fechaEspecifica) {
      // Para clases de fecha específica (formato antiguo)
      if (clase.fechaEspecifica.includes('T')) {
        classDate = new Date(clase.fechaEspecifica);
      } else {
        classDate = new Date(clase.fechaEspecifica + 'T00:00:00');
      }
    } else if (clase.diasSemana && clase.diasSemana.length > 0) {
      // Para clases recurrentes, encontrar el próximo día que coincida
      const diasSemanaMap = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
        'jueves': 4, 'viernes': 5, 'sabado': 6
      };
      
      const today = new Date();
      const classDays = clase.diasSemana.map(dia => diasSemanaMap[dia.toLowerCase()]);
      const currentDay = today.getDay();
      
      // Buscar el próximo día que coincida
      let targetDay = classDays.find(day => day >= currentDay);
      if (targetDay === undefined) {
        // Si no hay días posteriores esta semana, tomar el primero de la próxima semana
        targetDay = classDays[0];
        const daysToAdd = 7 - currentDay + targetDay;
        classDate = new Date(today);
        classDate.setDate(today.getDate() + daysToAdd);
      } else {
        const daysToAdd = targetDay - currentDay;
        classDate = new Date(today);
        classDate.setDate(today.getDate() + daysToAdd);
      }
    } else {
      // Fallback a la fecha actual
      classDate = new Date();
    }
    
    setSelectedDateForActivities(classDate);
    setShowDayActivitiesPanel(true);
  };

  const handleCloseDayActivitiesPanel = () => {
    setShowDayActivitiesPanel(false);
    setSelectedDateForActivities(null);
  };

  // Filtrar clases por término de búsqueda y sucursal
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Filtro por búsqueda
      const matchesSearch = 
        cls.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por sucursal
      const matchesSucursal = 
        selectedSucursal === ALL_SUCURSALES_ID || 
        cls.sucursal === selectedSucursal ||
        (!cls.sucursal && selectedSucursal === ALL_SUCURSALES_ID);
      
      return matchesSearch && matchesSucursal;
    });
  }, [classes, searchTerm, selectedSucursal]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambien los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Función para generar números de página inteligentes
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case CLASS_STATUS.PROGRAMADA:
        return 'bg-cyan-100 text-cyan-800';
      case CLASS_STATUS.EN_PROGRESO:
        return 'bg-yellow-100 text-yellow-800';
      case CLASS_STATUS.COMPLETADA:
        return 'bg-green-100 text-green-800';
      case CLASS_STATUS.CANCELADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (tipo) => {
    switch (tipo) {
      case CLASS_TYPES.GRUPAL:
        return 'bg-purple-100 text-purple-800';
      case CLASS_TYPES.PERSONALIZADO:
        return 'bg-cyan-100 text-cyan-800';
      case CLASS_TYPES.SESION:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1c4040] flex items-center gap-3">
              <FontAwesomeIcon icon={faNoteSticky} className="w-8 h-8 text-[#1c4040]" />
              Gestión de Actividades
            </h1>
            <p className="text-gray-600">
              Administra actividades grupales, entrenamientos personalizados y sesiones
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3 justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={faFilter} className="w-5 h-5 mr-2" />
              Filtros
            </button>
            <button
              onClick={() => router.push('/clases/calendar')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 mr-2" />
              Calendario
            </button>
            <ViewToggle />
            <button
              onClick={() => router.push('/clases/nueva')}
              className="inline-flex items-center px-4 py-2 bg-[#1c4040] text-white rounded-lg hover:bg-[#143030] transition-colors shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5 mr-2 text-[#c2ef03]" />
              Nueva actividad
            </button>
          </div>
        </div>
        {/* Mensajes de estado */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Actividad
                </label>
                <select
                  value={filters.tipo}
                  onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(CLASS_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilters({ tipo: '', status: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar clases por nombre, instructor o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Lista de clases */}
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faCalendar} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clases</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? "No se encontraron clases que coincidan con los criterios de búsqueda"
                : "Comienza creando tu primera clase"
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/clases/nueva')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1c4040] hover:bg-[#143030]"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4 text-[#c2ef03]" />
                  Crear Primera Actividad
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Vista en Grid
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentClasses.map((cls) => (
              <div key={cls.id} className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                {/* Imagen de la clase */}
                <div className="w-full h-[150px] bg-gray-100 overflow-hidden relative group">
                  {cls.imageUrl ? (
                    <img 
                      src={cls.imageUrl} 
                      alt={cls.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Placeholder cuando no hay imagen */}
                  <div 
                    className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-150 to-cyan-200 ${cls.imageUrl ? 'hidden' : 'flex'}`}
                  >
                    <FontAwesomeIcon icon={faCalendar} className="w-12 h-12 text-cyan-400" />
                  </div>
                  
                  {/* Badges de tipo y estado */}
                  <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(cls.tipo)}`}>
                      {CLASS_TYPE_LABELS[cls.tipo]}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(cls.status)}`}>
                      {CLASS_STATUS_LABELS[cls.status]}
                    </span>
                    {cls.isCloned && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                        Clonada
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6">
                  {/* Header agrupado con separador */}
                  <div className="mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-1 leading-tight line-clamp-1">
                        {cls.nombre}
                      </h3>
                      {cls.descripcion && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {cls.descripcion}
                        </p>
                      )}
                    </div>
                    <hr className="my-4 border-cyan-500" />
                  </div>

                  {/* Información principal con altura fija */}
                  <div className="space-y-2">
                    {/* Fila 1: Fecha/Hora - siempre visible, ocupa toda la fila */}
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                      <span className="text-sm font-bold text-cyan-700 truncate">
                        {formatSchedule(cls)}
                      </span>
                      {cls.duracion && (
                        <span className="text-sm text-cyan-700 ml-2 font-normal flex-shrink-0">({cls.duracion} min)</span>
                      )}
                    </div>

                    {/* Fila 2: Grid de 2 columnas para Instructor y Precio */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faUser} className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-cyan-700">{formatInstructorName(cls.instructor)}</span>
                      </div>
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faDollarSign} className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-cyan-700 truncate">{formatPrice(cls.precio)}</span>
                      </div>
                    </div>

                    {/* Fila 3: Grid de 2 columnas para Ubicación y Participantes */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-cyan-700">{cls.ubicacion || 'Sin ubicación'}</span>
                      </div>
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faUsers} className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-cyan-700 truncate">
                          {cls.tipo === CLASS_TYPES.GRUPAL 
                            ? `${cls.participantesActuales || 0}/${cls.maxParticipantes}`
                            : `${cls.participantesActuales || 0}`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Fila 4: Sucursal */}
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-700">{getSucursalName(cls.sucursal)}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="pt-4 border-t border-cyan-200" style={{padding: '15px'}}>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Ver actividades del día */}
                    <div className="relative group">
                      <button
                        onClick={() => handleShowDayActivities(cls)}
                        className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-xl hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="Ver actividades del día"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-white w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Ver actividades del día
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    {/* Clonar */}
                    <div className="relative group">
                      <button
                        onClick={() => handleCloneClass(cls.id)}
                        disabled={cloningClasses.has(cls.id)}
                        className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clonar clase"
                      >
                        {cloningClasses.has(cls.id) ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FontAwesomeIcon icon={faCopy} className="w-5 h-5" />
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Clonar clase
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    {/* Editar */}
                    <div className="relative group">
                      <button
                        onClick={() => router.push(`/clases/editar/${cls.id}`)}
                        className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Editar
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    {/* Eliminar */}
                    <div className="relative group">
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de que quieres eliminar la clase \"${cls.nombre}\"?`)) {
                            handleDeleteClass(cls.id);
                          }
                        }}
                        disabled={deletingClasses.has(cls.id)}
                        className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        {deletingClasses.has(cls.id) ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Eliminar
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Vista en Tabla
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clase
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th scope="col" className="px-6 py-3 min-w-[300px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horario / Duración
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participantes
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {cls.imageUrl ? (
                              <img className="h-10 w-10 rounded object-cover" src={cls.imageUrl} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded bg-cyan-100 flex items-center justify-center">
                                <FontAwesomeIcon icon={faCalendar} className="h-5 w-5 text-cyan-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{cls.nombre}</span>
                              {cls.isCloned && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                  Clonada
                                </span>
                              )}
                            </div>
                            {cls.descripcion && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{cls.descripcion}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(cls.tipo)}`}>
                          {CLASS_TYPE_LABELS[cls.tipo]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cls.instructor || 'No asignado'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>{formatSchedule(cls)}</div>
                          {cls.duracion && (
                            <div className="text-xs text-gray-500 mt-1">Duración: {cls.duracion} min</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cls.ubicacion || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getSucursalName(cls.sucursal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-cyan-600">
                          {formatPrice(cls.precio)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cls.tipo === CLASS_TYPES.GRUPAL 
                            ? `${cls.participantesActuales || 0}/${cls.maxParticipantes || 0}`
                            : cls.participantesActuales || 0
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(cls.status)}`}>
                          {CLASS_STATUS_LABELS[cls.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-start gap-1">
                          {/* Ver actividades del día */}
                          <button
                            onClick={() => handleShowDayActivities(cls)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 shadow-sm"
                            title="Ver actividades del día"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-white w-3.5 h-3.5" />
                          </button>

                          {/* Clonar */}
                          <button
                            onClick={() => handleCloneClass(cls.id)}
                            disabled={cloningClasses.has(cls.id)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Clonar clase"
                          >
                            {cloningClasses.has(cls.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => router.push(`/clases/editar/${cls.id}`)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-lg hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-sm"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de que quieres eliminar la clase \"${cls.nombre}\"?`)) {
                                handleDeleteClass(cls.id);
                              }
                            }}
                            disabled={deletingClasses.has(cls.id)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar"
                          >
                            {deletingClasses.has(cls.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Controles de paginación */}
        {filteredClasses.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{startIndex + 1}</span> a{' '}
              <span className="font-semibold">{Math.min(endIndex, filteredClasses.length)}</span> de{' '}
              <span className="font-semibold">{filteredClasses.length}</span> clases
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {getPageNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-cyan-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Side Panel de Actividades del Día */}
      <DayActivitiesSidePanel
        isOpen={showDayActivitiesPanel}
        onClose={handleCloseDayActivitiesPanel}
        selectedDate={selectedDateForActivities}
        allClasses={filteredClasses}
        onView={(clase) => router.push(`/clases/${clase.id}`)}
        onEdit={(clase) => router.push(`/clases/editar/${clase.id}`)}
        onDelete={(clase) => {
          if (window.confirm(`¿Estás seguro de que quieres eliminar la clase "${clase.nombre}"?`)) {
            handleDeleteClass(clase.id);
          }
        }}
        deletingClasses={deletingClasses}
      />
    </div>
  );
}

export default ClasesPage;