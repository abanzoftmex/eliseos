import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChevronLeft, faChevronRight, faPlus, faClock, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ClassCardTooltip from '../../components/classes/ClassCardTooltip';
import ParticipantsSidePanel from '../../components/classes/ParticipantsSidePanel';
import DayActivitiesSidePanel from '../../components/classes/DayActivitiesSidePanel';
import useSucursalStore, { ALL_SUCURSALES_ID } from '../../store/sucursalStore';
import { getClasses, deleteClass } from '../../../lib/firebase/classesService';

function CalendarPage() {
  const router = useRouter();
  const { view } = router.query; // Obtener el parámetro 'view' de la URL
  const selectedSucursal = useSucursalStore((state) => state.selectedSucursal);
  const sucursales       = useSucursalStore((state) => state.sucursales);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [deletingClass, setDeletingClass] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week' o 'month'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  const [selectedClassForParticipants, setSelectedClassForParticipants] = useState(null);
  const [showDayActivitiesPanel, setShowDayActivitiesPanel] = useState(false);
  const [selectedDateForActivities, setSelectedDateForActivities] = useState(null);
  const calendarScrollRef = React.useRef(null);

  // Establecer el modo de vista basado en el parámetro de la URL
  useEffect(() => {
    if (view === 'month') {
      setViewMode('month');
    } else if (view === 'week') {
      setViewMode('week');
    }
  }, [view]);

  // Obtener el inicio de la semana (lunes)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Si es domingo (0), retroceder 6 días al lunes anterior
    // Si es otro día, calcular cuántos días retroceder al lunes de esa semana
    const diff = day === 0 ? -6 : -(day - 1);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() + diff);
    return weekStart;
  };

  // Obtener los días de la semana actual
  const getWeekDays = (weekStart) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDays = getWeekDays(weekStart);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClasses();
      if (result.success) {
        console.log('Clases cargadas en calendario:', result.classes);
        console.log('Total de clases cargadas:', result.classes.length);
        result.classes.forEach(clase => {
          console.log(`Clase: ${clase.nombre}, Tipo: ${clase.tipo}, Estado: ${clase.status}`);
        });
        
        // Debug: mostrar información de la semana actual
        const today = new Date();
        const currentWeekStart = getWeekStart(currentWeek);
        console.log('Fecha de hoy:', today.toISOString().split('T')[0]);
        console.log('Semana actual mostrada:', currentWeekStart.toISOString().split('T')[0], 'al', new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        // Debug: mostrar clases no grupales
        const nonGroupClasses = result.classes.filter(c => c.tipo !== 'grupal');
        console.log('Clases no grupales:', nonGroupClasses.map(c => ({
          nombre: c.nombre,
          tipo: c.tipo,
          fechaEspecifica: c.fechaEspecifica,
          horaEspecifica: c.horaEspecifica,
          diasSemana: c.diasSemana
        })));
        
        setClasses(result.classes);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Filtrar clases por sucursal seleccionada
  const filteredClassesBySucursal = useMemo(() => {
    if (selectedSucursal === ALL_SUCURSALES_ID) {
      return classes;
    }
    return classes.filter(clase => 
      clase.sucursal === selectedSucursal
    );
  }, [classes, selectedSucursal]);

  // Scroll automático a la hora actual menos 2 horas cuando se carga o cambia la vista
  useEffect(() => {
    if (viewMode === 'week' && calendarScrollRef.current && !loading) {
      const currentHour = new Date().getHours();
      const targetHour = Math.max(6, currentHour - 2); // Hora actual menos 2 horas, mínimo 6 AM
      const hourIndex = targetHour - 6; // Índice de la hora en el array (6 AM = índice 0)
      
      // Calcular posición de scroll (80px por fila aproximadamente)
      const scrollPosition = hourIndex * 80;
      
      // Hacer scroll suave después de un pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        if (calendarScrollRef.current) {
          calendarScrollRef.current.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [loading, viewMode]);

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  // Mapeo de días de la semana en español a número (0=Domingo, 1=Lunes, etc.)
  const diasSemanaMap = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  };

  // Filtrar clases por día (incluye recurrentes y de fecha específica)
  const getClassesForDay = (date) => {
    const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes, etc.
    // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; // YYYY-MM-DD formato local
    
    console.log(`Buscando clases para el día: ${dateString}`);
    
    const filteredClasses = filteredClassesBySucursal.filter(clase => {
      // 1. Clases recurrentes (grupales) - verificar día de la semana
      if (clase.diasSemana && clase.diasSemana.length > 0) {
        const isRecurring = clase.diasSemana.some(dia => {
          const diaNumero = diasSemanaMap[dia.toLowerCase()];
          return diaNumero === dayOfWeek;
        });
        if (isRecurring) {
          console.log(`Clase recurrente encontrada: ${clase.nombre}`);
        }
        return isRecurring;
      }
      
      // 2. Clases de fecha específica (sesión y personalizada)
      if (clase.fechaEspecifica) {
        // Normalizar la fecha de la clase para comparación
        let claseDate;
        if (clase.fechaEspecifica.includes('T')) {
          // Si tiene tiempo, crear fecha y extraer solo la parte de fecha local
          const d = new Date(clase.fechaEspecifica);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dy = String(d.getDate()).padStart(2, '0');
          claseDate = `${y}-${m}-${dy}`;
        } else {
          // Si es solo fecha, usar directamente
          claseDate = clase.fechaEspecifica;
        }
        
        const matches = claseDate === dateString;
        console.log(`Clase específica: ${clase.nombre}, fecha: ${clase.fechaEspecifica}, claseDate: ${claseDate}, dateString: ${dateString}, matches: ${matches}`);
        return matches;
      }
      
      return false;
    });
    
    console.log(`Clases encontradas para ${dateString}:`, filteredClasses.map(c => ({ nombre: c.nombre, tipo: c.tipo })));
    
    return filteredClasses.sort((a, b) => {
      // Ordenar por hora de inicio - usar horaInicio para grupales, horaEspecifica para otros
      const timeA = a.horaInicio || a.horaEspecifica || '00:00';
      const timeB = b.horaInicio || b.horaEspecifica || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // Navegación entre semanas
  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  // Ir a la semana actual
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Verificar si es la semana actual
  const isCurrentWeek = () => {
    const today = new Date();
    const todayWeekStart = getWeekStart(today);
    return weekStart.getTime() === todayWeekStart.getTime();
  };

  // Calcular posición del indicador de hora actual
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    // Asumiendo que el día empieza a las 6:00 AM y termina a las 10:00 PM (16 horas)
    const startHour = 6;
    const endHour = 22;
    const totalHours = endHour - startHour;
    
    if (hours < startHour || hours >= endHour) return null;
    
    const currentMinutes = (hours - startHour) * 60 + minutes;
    const totalMinutes = totalHours * 60;
    const percentage = (currentMinutes / totalMinutes) * 100;
    
    return percentage;
  };

  // Funciones para vista mensual
  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Días para llenar desde el lunes anterior si el mes no empieza en lunes
    const startDay = firstDay.getDay();
    const daysFromPrevMonth = startDay === 0 ? 6 : startDay - 1;
    
    const days = [];
    
    // Días del mes anterior
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = new Date(year, month, 1 - i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Completar hasta 42 días (6 semanas)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  // Obtener color según tipo de actividad
  const getTypeColor = (type) => {
    const colors = {
      grupal: 'bg-blue-100 text-blue-700 border-blue-200',
      personalizado: 'bg-purple-100 text-purple-700 border-purple-200',
      sesion: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (date) => {
    setCurrentWeek(date);
    setViewMode('week');
    router.push('/clases/calendar?view=week', undefined, { shallow: true });
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta clase?')) return;
    
    setDeletingClass(classId);
    const loadingToast = toast.loading('Eliminando clase...');
    
    try {
      const result = await deleteClass(classId);
      if (result.success) {
        setClasses(prev => prev.filter(c => c.id !== classId));
        toast.success('Clase eliminada exitosamente', { id: loadingToast });
      } else {
        toast.error(result.error, { id: loadingToast });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Error al eliminar la clase', { id: loadingToast });
    } finally {
      setDeletingClass(null);
    }
  };

  const handleViewParticipants = (clase) => {
    setSelectedClassForParticipants(clase);
    setShowParticipantsPanel(true);
  };

  const handleCloseParticipantsPanel = () => {
    setShowParticipantsPanel(false);
    setSelectedClassForParticipants(null);
  };

  const handleShowDayActivities = (clase) => {
    console.log('handleShowDayActivities llamado con clase:', clase.nombre);
    // Determinar la fecha de la clase
    let classDate;
    
    if (clase.fechaEspecifica) {
      // Para clases de fecha específica
      if (clase.fechaEspecifica.includes('T')) {
        classDate = new Date(clase.fechaEspecifica);
      } else {
        classDate = new Date(clase.fechaEspecifica + 'T00:00:00');
      }
    } else if (clase.diasSemana && clase.diasSemana.length > 0) {
      // Para clases recurrentes, usar la fecha actual de la vista
      classDate = new Date(currentWeek);
      
      // Encontrar el próximo día que coincida con los días de la semana de la clase
      const diasSemanaMap = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3,
        'jueves': 4, 'viernes': 5, 'sabado': 6
      };
      
      const classDays = clase.diasSemana.map(dia => diasSemanaMap[dia.toLowerCase()]);
      const currentDay = classDate.getDay();
      
      // Buscar el día más cercano en la semana actual
      let targetDay = classDays.find(day => day >= currentDay);
      if (targetDay === undefined) {
        targetDay = classDays[0]; // Si no hay días posteriores, tomar el primero
      }
      
      const daysToAdd = targetDay - currentDay;
      classDate.setDate(classDate.getDate() + daysToAdd);
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

  const customBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Gestión de Actividades', href: '/clases' },
    { label: 'Calendario', href: '/clases/calendar', isLast: true }
  ];

  if (loading) {
    return (
      <Layout title="Cargando..." activeSection="clases" breadcrumbs={customBreadcrumbs}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando calendario...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center ml-16 lg:ml-0">
            <div>
              <h1 className="text-3xl font-bold text-[#1c4040] flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-8 h-8 text-[#1c4040]" />
                Calendario
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Vista de todas las actividades programadas en calendario
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/clases')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:bg-gray-100 rounded-lg"
            >
              Vista Lista
            </button>
            <button
              onClick={() => {
                const newViewMode = viewMode === 'week' ? 'month' : 'week';
                setViewMode(newViewMode);
                router.push(`/clases/calendar?view=${newViewMode}`, undefined, { shallow: true });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-all duration-200 hover:bg-gray-100 rounded-lg"
            >
              {viewMode === 'week' ? 'Vista Mensual' : 'Vista Semanal'}
            </button>
            <button
              onClick={() => router.push('/clases/nueva')}
              className="flex items-center gap-2 px-6 py-3 bg-[#1c4040] hover:bg-[#143030] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FontAwesomeIcon icon={faPlus} className="w-5 h-5 text-[#c2ef03]" />
              Nueva actividad
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">

          {viewMode === 'week' ? (
            <>
              {/* Navegación de semana */}
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateWeek(-1)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">
                      {weekStart.getDate()} - {weekDays[6].getDate()} {weekStart.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                    </span>
                    {!isCurrentWeek() && (
                      <button
                        onClick={goToCurrentWeek}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-[#1c4040] hover:bg-[#143030] text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-200 hover:scale-105"
                      >
                        <FontAwesomeIcon icon={faCalendarDay} className="w-3 h-3 text-[#c2ef03]" />
                        Hoy
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => navigateWeek(1)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendario Semanal con Grid de Horas */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div ref={calendarScrollRef} className="overflow-auto max-h-[calc(100vh-300px)]">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-white">
                      <tr>
                        <th className="w-20 p-4 border-r border-b border-gray-200 bg-gray-50 text-center">
                          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-500" />
                        </th>
                        {weekDays.map((day, index) => {
                          const isToday = new Date().toDateString() === day.toDateString();
                          return (
                            <th key={index} className={`p-4 text-center border-r border-b border-gray-200 last:border-r-0 ${
                              isToday ? 'bg-[#f4f8f8] border-t-4 border-t-[#1c4040]' : ''
                            }`}>
                              <div className={`text-xs font-semibold capitalize ${
                                isToday ? 'text-[#1c4040]' : 'text-gray-800'
                              }`}>
                                {day.toLocaleDateString('es-MX', { weekday: 'short' })}
                              </div>
                              <div className="flex items-center justify-center gap-2 mt-1">
                                <div className={`text-xl font-bold ${
                                  isToday ? 'text-[#1c4040]' : 'text-gray-600'
                                }`}>
                                  {day.getDate()}
                                </div>
                                {isToday && (
                                  <span className="text-[10px] font-bold text-white bg-[#1c4040] px-1.5 py-0.5 rounded-full">
                                    Hoy
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 16 }, (_, hourIndex) => {
                        const hour = 6 + hourIndex;
                        const hourString = `${String(hour).padStart(2, '0')}:00`;
                        const isCurrentHour = currentTime.getHours() === hour;
                        
                        return (
                          <tr key={hour}>
                            <td className={`w-20 p-2 border-r border-b border-gray-200 bg-gray-50 text-center align-top ${
                              isCurrentHour ? 'bg-red-50' : ''
                            }`}>
                              <span className={`text-xs font-semibold ${
                                isCurrentHour ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {hourString}
                              </span>
                            </td>
                            
                            {weekDays.map((day, dayIndex) => {
                              const dayClasses = getClassesForDay(day);
                              const tooltipPosition = (dayIndex === 5 || dayIndex === 6) ? 'left' : 'right';
                              const isToday = new Date().toDateString() === day.toDateString();
                              
                              const classesInHour = dayClasses.filter(clase => {
                                const claseHour = clase.horaInicio || clase.horaEspecifica || '00:00';
                                const claseHourNum = parseInt(claseHour.split(':')[0]);
                                const matches = claseHourNum === hour;
                                if (matches) {
                                  console.log(`Clase en hora ${hour}:00 - ${clase.nombre} (${claseHour})`);
                                }
                                return matches;
                              });
                              
                              return (
                                <td 
                                  key={dayIndex} 
                                  className={`min-h-[80px] h-20 p-1 border-r border-b border-gray-200 last:border-r-0 relative align-top ${
                                    isToday ? 'bg-cyan-50/30' : ''
                                  } ${isCurrentHour && isToday ? 'bg-red-50/50' : ''}`}
                                >
                                  {isCurrentHour && isToday && (
                                    <div className="absolute left-0 right-0 top-0 z-10 pointer-events-none">
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                                        <div className="flex-1 h-0.5 bg-red-500"></div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-1">
                                    {classesInHour.map((clase) => {
                                      console.log(`Renderizando clase: ${clase.nombre} en vista semanal`);
                                      return (
                                        <ClassCardTooltip
                                          key={clase.id}
                                          clase={clase}
                                          isDeleting={deletingClass === clase.id}
                                          tooltipPosition={tooltipPosition}
                                          sucursalName={sucursales.find(s => s.id === clase.sucursal)?.name || null}
                                          onView={(clase) => router.push(`/clases/${clase.id}`)}
                                          onEdit={(clase) => router.push(`/clases/editar/${clase.id}`)}
                                          onDelete={(clase) => handleDeleteClass(clase.id)}
                                          onViewParticipants={handleViewParticipants}
                                          onShowDayActivities={handleShowDayActivities}
                                        />
                                      );
                                    })}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Navegación de mes */}
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={goToCurrentMonth}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-200 hover:scale-105"
                    >
                      <FontAwesomeIcon icon={faCalendarDay} className="w-3 h-3" />
                      Hoy
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendario Mensual */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Encabezados de días */}
                <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                    <div key={index} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                      <div className="font-semibold text-gray-700 text-sm">
                        {day}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7 gap-0">
                  {getMonthDays(currentMonth).map((dayObj, index) => {
                    const { date, isCurrentMonth } = dayObj;
                    const isToday = new Date().toDateString() === date.toDateString();
                    const dayClasses = getClassesForDay(date);
                    const classCount = dayClasses.length;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => handleDayClick(date)}
                        className={`min-h-[100px] p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer transition-all hover:bg-gray-50 ${
                          !isCurrentMonth ? 'bg-gray-50' : ''
                        } ${isToday ? 'bg-cyan-50 hover:bg-cyan-100 border-2 border-cyan-500' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-semibold ${
                              !isCurrentMonth ? 'text-gray-400' : isToday ? 'text-cyan-600' : 'text-gray-700'
                            }`}>
                              {date.getDate()}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold text-white bg-cyan-600 px-1.5 py-0.5 rounded-full">
                                Hoy
                              </span>
                            )}
                          </div>
                          {classCount > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              isToday ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {classCount}
                            </span>
                          )}
                        </div>
                        
                        {classCount > 0 && (
                          <div className="space-y-1">
                            {dayClasses.slice(0, 2).map((clase) => {
                              const sucName = sucursales.find(s => s.id === clase.sucursal)?.name || null;
                              return (
                                <div
                                  key={clase.id}
                                  className={`text-xs p-1 rounded border cursor-pointer hover:shadow-md transition-shadow ${getTypeColor(clase.tipo)}`}
                                  title={`${clase.nombre} - ${clase.horaInicio || clase.horaEspecifica || 'Sin hora'}`}
                                  onClick={() => handleShowDayActivities(clase)}
                                >
                                  <div className="truncate">{clase.horaInicio || clase.horaEspecifica || 'Sin hora'} - {clase.nombre}</div>
                                  {sucName && <div className="truncate text-[9px] opacity-60 mt-0.5">{sucName}</div>}
                                </div>
                              );
                            })}
                            {classCount > 2 && (
                              <div className="text-xs text-gray-500 pl-1">
                                +{classCount - 2} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        
      </main>

      {/* Side Panel de Participantes */}
      <ParticipantsSidePanel
        classData={selectedClassForParticipants}
        isOpen={showParticipantsPanel}
        onClose={handleCloseParticipantsPanel}
      />

      {/* Side Panel de Actividades del Día */}
      <DayActivitiesSidePanel
        isOpen={showDayActivitiesPanel}
        onClose={handleCloseDayActivitiesPanel}
        selectedDate={selectedDateForActivities}
        allClasses={filteredClassesBySucursal}
        onView={(clase) => router.push(`/clases/${clase.id}`)}
        onEdit={(clase) => router.push(`/clases/editar/${clase.id}`)}
        onDelete={(clase) => {
          if (window.confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
            handleDeleteClass(clase.id);
          }
        }}
        deletingClasses={new Set(deletingClass ? [deletingClass] : [])}
      />
    </>
  );
}

export default CalendarPage;